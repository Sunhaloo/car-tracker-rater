// import the 'express' library
const express = require("express");
// create the database connection
const db = require("../db/knex");
// import the `authenticate` function from the `middleware/auth.js` file
const { authenticate } = require("../middleware/auth");
// import the `encrypt` function from the `server/encryption.js` file
const { encrypt } = require("../services/encryption");
// import all the required functions from the `services/deviceService.js` file
const { verifyChannel, toPublic } = require("../services/deviceService");

// router holding every '/api/deviceRouter' route
const router = express.Router();

// this route needs the user to be authenticated in order to access
// INFO: it also sets `req.user.id` from the token ==> every route below can use it
router.use(authenticate);

// check for positive integer numbers ==> valid positive number for `id`
const isId = (value) => /^\d+$/.test(value);
// a ThingSpeak channel ID ==> whole number bigger than zero
const isChannelId = (value) => Number.isInteger(value) && value > 0;
// a text field ==> not empty and not longer than 'max' characters
const isText = (value, max) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= max;

// the user's device / undefined ==> a device of someone else looks like it does not exist
const findOwned = (userId, id) =>
  db("devices").where({ id, user_id: userId }).first();

// `GET /api/devices`
router.get("/", async (req, res) => {
  // only this user's devices ==> the 'user_id' comes from the token, not from the body
  const devices = await db("devices")
    .where({ user_id: req.user.id })
    .orderBy("id");
  // 'toPublic' hides the read key ==> the client only gets the safe fields
  res.json(devices.map(toPublic));
});

// `POST /api/devices` ==> { label, thingspeak_channel_id, read_key }
router.post("/", async (req, res) => {
  // take the body apart ==> the API names are shorter than the column names
  const {
    label,
    thingspeak_channel_id: channelId,
    read_key: readKey,
  } = req.body;

  // check every field ==> each failure comes back as a '400' with a message for the user
  if (!isText(label, 50))
    return res
      .status(400)
      .json({ error: "Label is required (max 50 characters)" });
  if (!isChannelId(channelId))
    return res
      .status(400)
      .json({ error: "Channel ID must be a positive number" });
  if (!isText(readKey, 100))
    return res.status(400).json({ error: "Read key is required" });

  // prove the channel works ==> a broken channel ID or key never reaches the database
  const check = await verifyChannel(channelId, readKey.trim());
  if (!check.ok) return res.status(400).json({ error: check.reason });

  try {
    // store the device ==> the read key is encrypted before it touches the database
    // INFO: `returning("*")` gives the new row back --> `toPublic` needs it for the answer
    const [device] = await db("devices")
      .insert({
        user_id: req.user.id,
        label: label.trim(),
        thingspeak_channel_id: channelId,
        read_key_encrypted: encrypt(readKey.trim()),
      })
      .returning("*");

    // the sync loop picks it up on its next tick
    res.status(201).json(toPublic(device));
  } catch (error) {
    // channel IDs are unique ==> one channel cannot belong to two accounts
    if (error.code === "23505")
      return res
        .status(409)
        .json({ error: "This channel is already registered" });
    // any other error ==> the global handler in 'app.js' turns it into a 500
    throw error;
  }
});

// `PATCH /api/devices/:id` ==> { label, thingspeak_channel_id, read_key }
router.patch("/:id", async (req, res) => {
  // a non-numeric `id` can never match a row ==> '404' response
  if (!isId(req.params.id))
    return res.status(404).json({ error: "Device not found" });

  // the device does not exist or belongs to someone else ==> `404 response again
  const device = await findOwned(req.user.id, req.params.id);
  if (!device) return res.status(404).json({ error: "Device not found" });

  // take the body apart ==> only the fields that were sent end up in "changes"
  const {
    label,
    thingspeak_channel_id: channelId,
    read_key: readKey,
  } = req.body;

  // the changes start empty --> field that was not sent is simply not updated
  const changes = {};

  // check every field that was sent --> each one is validated before it is stored
  if (label !== undefined) {
    if (!isText(label, 50))
      return res.status(400).json({ error: "Label must be 1-50 characters" });
    changes.label = label.trim();
  }

  if (channelId !== undefined) {
    if (!isChannelId(channelId))
      return res
        .status(400)
        .json({ error: "Channel ID must be a positive number" });
    changes.thingspeak_channel_id = channelId;
  }

  if (readKey !== undefined) {
    if (!isText(readKey, 100))
      return res.status(400).json({ error: "Read key cannot be empty" });
    changes.read_key_encrypted = encrypt(readKey.trim());
  }

  // empty patch ==> there is nothing to save
  if (Object.keys(changes).length === 0)
    return res.status(400).json({ error: "Nothing to update" });

  // channel ID / 'read' API key changed ==> test the final combination
  // INFO: an old key does not work with a new channel, and the reverse
  if (changes.thingspeak_channel_id !== undefined || readKey !== undefined) {
    // NOTE: the old key is decrypted here ==> it only lives in memory
    const { decrypt } = require("../services/encryption");
    // the combination that will be stored ==> the new channel or the old one
    const finalChannel =
      changes.thingspeak_channel_id ?? device.thingspeak_channel_id;
    const finalKey =
      readKey !== undefined
        ? readKey.trim()
        : decrypt(device.read_key_encrypted);

    const check = await verifyChannel(finalChannel, finalKey);
    if (!check.ok) return res.status(400).json({ error: check.reason });
  }

  try {
    // write the changes ==> only the columns inside "changes" are touched
    const [updated] = await db("devices")
      .where({ id: device.id })
      .update(changes)
      .returning("*");
    // the client gets the updated device --> still without the read key
    res.json(toPublic(updated));
  } catch (error) {
    // channel IDs are unique ==> one channel cannot belong to two accounts
    if (error.code === "23505")
      return res
        .status(409)
        .json({ error: "This channel is already registered" });
    // handled by the `server/app.js` file
    throw error;
  }
});

// `DELETE /api/devices/:id``
// NOTE: deletes its samples and trips --> `ON DELETE CASCADE`
router.delete("/:id", async (req, res) => {
  // a non-numeric `id` can never match a row ==> '404' response
  if (!isId(req.params.id))
    return res.status(404).json({ error: "Device not found" });

  // the delete is scoped to the user ==> nobody can delete someone else's device
  const deleted = await db("devices")
    .where({ id: req.params.id, user_id: req.user.id })
    .del();

  // nothing was deleted ==> the device does not exist or belongs to someone else
  if (deleted === 0) return res.status(404).json({ error: "Device not found" });
  // no content ==> the device is gone
  res.status(204).end();
});

// make the `deviceRouter` available to other files
module.exports = router;
