// INFO: this code will be able to take the data from ThingSpeak's database
// and then copy these data to our 'samples' database table

// create the database connection
const db = require("../db/knex");

// import all the data that we have inside the `config` directory ==> `index.js` "constants" file
const config = require("../config");
// import the `decrypt` function from the `services/encryption.js` file
const { decrypt } = require("./encryption");
// import the `fetchFeeds` function from `services/thingspeak.js`
const { fetchFeeds } = require("./thingspeak");

// how many rows go into one `INSERT` command
const INSERT_CHUNK = 500;

// newest sample already saved for this device ( null for a new device )
async function getNewestCreatedAt(deviceId) {
  const row = await db("samples")
    .where({ device_id: deviceId })
    .max("created_at as newest")
    .first();
  return row?.newest ?? null;
}

async function syncDevice(device) {
  // check for the newest row
  const newest = await getNewestCreatedAt(device.id);

  // decryption of 'read' API key in memory
  // WARNING: only in memory so as to not leak it
  const readKey = decrypt(device.read_key_encrypted);

  // try to fetch new data that is available
  const feeds = await fetchFeeds({
    channelId: device.thingspeak_channel_id,
    readKey,
    after: newest,
  });

  // take the returned "newest" rows from ThingSpeak
  const rows = feeds
    .filter((row) => !newest || new Date(row.created_at) > newest)
    .map((row) => ({ ...row, device_id: device.id }));

  // start inserting these new data inside of the 'samples' table
  let inserted = 0;
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const result = await db("samples")
      .insert(rows.slice(i, i + INSERT_CHUNK))
      .onConflict(["device_id", "created_at"])
      .ignore()
      .returning("id");
    inserted += result.length;
  }

  // simply return the number of rows inserted
  return { fetched: feeds.length, inserted };
}

// WARNING: guard ==> a slow run must not overlap with the next timer tick
let running = false;

// sync every device one after the other
async function syncAll() {
  // a run is already in progress ==> skip this timer tick ( see guard above )
  if (running) return;

  // take the guard ==> we are now running a sync
  running = true;

  try {
    // get all the devices ( only the columns needed by 'syncDevice' )
    const devices = await db("devices").select(
      "id",
      "thingspeak_channel_id",
      "read_key_encrypted",
    );

    // sync the devices one at a time
    for (const device of devices) {
      try {
        const result = await syncDevice(device);

        // only log when there are actually new rows
        if (result.inserted > 0) {
          console.log(
            `sync: device ${device.id} ==> ${result.inserted} new rows`,
          );
        }
      } catch (err) {
        console.error(`sync failed for device ${device.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error("sync failed:", err.message);
  } finally {
    // release the guard no matter what ==> else 'syncAll' would never run again
    running = false;
  }
}

// catch up once at startup, then repeat on a timer
function startSync() {
  syncAll();
  setInterval(syncAll, config.syncIntervalMs);
}

// make these functions available to other files
module.exports = { syncDevice, syncAll, startSync };
