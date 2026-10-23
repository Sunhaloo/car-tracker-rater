// import the 'express' library
const express = require("express");
// import the `authenticate` from `middleware/auth.js` file
const { authenticate } = require("../middleware/auth");
// import everything from `config/` directory in order to have access to constants
const config = require("../config");
// import all the required functions from the `services/placeQueries.js` file
const places = require("../services/placeQueries");

// router holding every '/api/placeRouter' route
const router = express.Router();

// this route needs the user to be authenticated in order to access
// INFO: it also sets `req.user.id` from the token ==> every route below can use it
router.use(authenticate);

// guard for the route parameter ==> only a positive whole number is a valid id
const isId = (value) => /^\d+$/.test(value);
// label ==> a non-empty string of at most 60 characters
const isLabel = (value) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= 60;
// latitude ==> a real number between -90 and 90
const isLatitude = (value) =>
  Number.isFinite(value) && value >= -90 && value <= 90;
// longitude ==> a real number between -180 and 180
const isLongitude = (value) =>
  Number.isFinite(value) && value >= -180 && value <= 180;
// radius ==> a whole number of metres inside the limits from 'config'
const isRadius = (value) =>
  Number.isInteger(value) &&
  value >= config.placeRadiusMinM &&
  value <= config.placeRadiusMaxM;

// never accept a 0 / 0 position ==> it means "no fix" --> not a place
const isRealPosition = (latitude, longitude) =>
  !(latitude === 0 && longitude === 0);

// `GET /api/places`
router.get("/", async (req, res) => {
  // every saved place of this user
  res.json(await places.listPlaces(req.user.id));
});

// `POST /api/places/relabel` ==> rewrite the labels of all finished trips ( run after adding or changing a place )
router.post("/relabel", async (req, res) => {
  // report how many trips were relabelled
  res.json({ relabelled_trips: await places.relabelUserTrips(req.user.id) });
});

// `POST /api/places` ==> body: label / latitude / longitude / radius_m ( optional )
router.post("/", async (req, res) => {
  const { label, latitude, longitude } = req.body;
  // radius is optional ==> fall back to the default from 'config'
  const radius = req.body.radius_m ?? config.defaultPlaceRadiusM;

  // validate everything BEFORE touching the database
  if (!isLabel(label))
    return res
      .status(400)
      .json({ error: "Label is required (max 60 characters)" });
  if (!isLatitude(latitude))
    return res
      .status(400)
      .json({ error: "Latitude must be between -90 and 90" });
  if (!isLongitude(longitude))
    return res
      .status(400)
      .json({ error: "Longitude must be between -180 and 180" });
  if (!isRealPosition(latitude, longitude))
    return res.status(400).json({ error: "0,0 is not a real position" });
  if (!isRadius(radius)) {
    return res.status(400).json({
      error: `Radius must be a whole number between ${config.placeRadiusMinM} and ${config.placeRadiusMaxM} metres`,
    });
  }

  // store the trimmed label + the validated numbers
  const place = await places.createPlace(req.user.id, {
    label: label.trim(),
    latitude,
    longitude,
    radius_m: radius,
  });
  // 201 = created ==> send the new place back
  res.status(201).json(place);
});

// `PATCH /api/places/:id` ==> any of: label / latitude / longitude / radius_m
router.patch("/:id", async (req, res) => {
  // a non-numeric id can never match a row ==> 404 straight away
  if (!isId(req.params.id))
    return res.status(404).json({ error: "Place not found" });

  // any of these fields may be sent ==> 'radius_m' is renamed to 'radius'
  const { label, latitude, longitude, radius_m: radius } = req.body;
  // only the fields that were actually sent end up in 'changes'
  const changes = {};

  // label was sent ==> check it then queue the trimmed value
  if (label !== undefined) {
    if (!isLabel(label))
      return res.status(400).json({ error: "Label must be 1-60 characters" });
    changes.label = label.trim();
  }
  // latitude was sent ==> check it then queue it
  if (latitude !== undefined) {
    if (!isLatitude(latitude))
      return res
        .status(400)
        .json({ error: "Latitude must be between -90 and 90" });
    changes.latitude = latitude;
  }
  // longitude was sent ==> check it then queue it
  if (longitude !== undefined) {
    if (!isLongitude(longitude))
      return res
        .status(400)
        .json({ error: "Longitude must be between -180 and 180" });
    changes.longitude = longitude;
  }
  // radius was sent ==> check it then queue it
  if (radius !== undefined) {
    if (!isRadius(radius))
      return res.status(400).json({ error: "Radius is out of range" });
    changes.radius_m = radius;
  }

  // empty body ==> nothing was sent --> nothing to update
  if (Object.keys(changes).length === 0)
    return res.status(400).json({ error: "Nothing to update" });

  const place = await places.updatePlace(req.user.id, req.params.id, changes);
  // `undefined` ==> the place does not exist or is not this user's
  if (!place) return res.status(404).json({ error: "Place not found" });
  // send the updated place back
  res.json(place);
});

// `DELETE /api/places/:id`
router.delete("/:id", async (req, res) => {
  // a non-numeric id can never match a row ==> 404 straight away
  if (!isId(req.params.id))
    return res.status(404).json({ error: "Place not found" });

  const deleted = await places.deletePlace(req.user.id, req.params.id);
  // 'false' ==> the place does not exist or is not this user's
  if (!deleted) return res.status(404).json({ error: "Place not found" });
  // 204 = deleted ==> no body to send
  res.status(204).end();
});

// make the `placeRouter` available to other files
module.exports = router;
