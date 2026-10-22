// import the 'express' library
const express = require("express");
// import the `authenticate` function from the `middleware/auth.js` file
const { authenticate } = require("../middleware/auth");
// import all the function from the `services/tripQueries.js` file
const trips = require("../services/tripQueries");

// router holding every '/api/tripRouter' route
const router = express.Router();

// this route needs the user to be authenticated in order to access
// INFO: it also sets `req.user.id` from the token ==> every route below can use it
router.use(authenticate);

// guard for the route parameter ==> only a positive whole number is a valid id
const isId = (value) => /^\d+$/.test(value);

// `GET /api/trips?limit=5&all=true`
router.get("/", async (req, res) => {
  // clamp 'limit' between 1 and 100 ( default 20 )
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  // 'all=true' ==> also include the short trips
  const all = req.query.all === "true";
  // return this user's trips
  res.json(await trips.listTrips(req.user.id, { limit, all }));
});

// `GET /api/trips/latest`
// WARNING: must come BEFORE `/:id` otherwise `latest` would be read as an `id`
router.get("/latest", async (req, res) => {
  // newest trip ==> in progress or long enough to count
  const trip = await trips.getLatestTrip(req.user.id);
  // nothing to show yet
  if (!trip) return res.status(404).json({ error: "No trips yet" });
  res.json(trip);
});

// shared by the three `/:id` routes
// INFO: 'fetchData' is one of 'getTrip' / 'getTrack' / 'getEvents'
function tripRoute(fetchData) {
  return async (req, res) => {
    // a non-numeric id can never match a row ==> 404 straight away
    if (!isId(req.params.id))
      return res.status(404).json({ error: "Trip not found" });

    const data = await fetchData(req.user.id, req.params.id);
    // `null` ==> the trip does not exist or is not this user's
    if (data === null) return res.status(404).json({ error: "Trip not found" });

    res.json(data);
  };
}

// create our `GET` routes
// summary + the number of harsh events per type
router.get("/:id", tripRoute(trips.getTrip));
// one point per second for the map and the charts
router.get("/:id/track", tripRoute(trips.getTrack));
// where and when each harsh event happened
router.get("/:id/events", tripRoute(trips.getEvents));

// make the `tripRouter` available to other files
module.exports = router;
