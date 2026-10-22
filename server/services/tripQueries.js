// create the database connection
const db = require("../db/knex");
// import all the data that we have inside the `config` directory ==> `index.js` "constants" file
const config = require("../config");
// import the required functions from the `services/scoring.js` file
const { detectEvents, ratingFromScore } = require("./scoring");

// round to `digits` decimal places ( NOT significant figures )
// NOTE: `null` / `undefined` pass through untouched ==> the API keeps "no data" instead of faking '0'
const round = (value, digits) =>
  value === null || value === undefined
    ? null
    : Math.round(value * 10 ** digits) / 10 ** digits;

// metres ==> km ( keeps `null` as `null` --> because `null / 1000` would give '0' )
const km = (metres) => (metres === null ? null : round(metres / 1000, 2));

// trips that belong to this user
// NOTE: the 'trips' table has no 'user_id' ==> join through 'devices' to reach the owner
function userTrips(userId) {
  return db("trips")
    .join("devices", "devices.id", "trips.device_id")
    .where("devices.user_id", userId)
    .select("trips.*");
}

// DB row ==> API JS object ( list and details )
function toSummary(trip) {
  // a trip is still in progress while 'ended_at' is `null`
  const inProgress = trip.ended_at === null;
  return {
    id: trip.id,
    in_progress: inProgress,
    started_at: trip.started_at,
    ended_at: trip.ended_at,
    distance_km: km(trip.distance_m),
    // speed --> 1 decimal place, G values --> 3 decimal places
    max_speed_kmh: round(trip.max_speed, 1),
    max_accel_g: round(trip.max_accel_g, 3),
    max_brake_g: round(trip.max_brake_g, 3),
    max_right_g: round(trip.max_right_g, 3),
    max_left_g: round(trip.max_left_g, 3),
    max_resultant_g: round(trip.max_resultant_g, 3),
    score: trip.score,
    // no rating while the trip is still running
    rating: inProgress ? null : ratingFromScore(trip.score),
    // start / end position ( + geocoded label, when available )
    start: {
      latitude: trip.start_latitude,
      longitude: trip.start_longitude,
      label: trip.start_label,
    },
    end: {
      latitude: trip.end_latitude,
      longitude: trip.end_longitude,
      label: trip.end_label,
    },
  };
}

// DB row ==> the text-only payload for the mobile app
function toMobile(trip) {
  // a trip is still in progress while 'ended_at' is `null`
  const inProgress = trip.ended_at === null;
  return {
    in_progress: inProgress,
    start: trip.started_at,
    end: trip.ended_at,
    start_label: trip.start_label,
    end_label: trip.end_label,
    // same rounding as `toSummary` ( km to 2 dp, speed to 1, G values to 3 )
    distance_km: km(trip.distance_m),
    max_speed_kmh: round(trip.max_speed, 1),
    max_g: round(trip.max_resultant_g, 3),
    score: trip.score,
    // no label while the trip is still running
    label: inProgress ? null : ratingFromScore(trip.score),
  };
}

// closed trips ( newest first ) ==> trips under the minimum distance ==> boot sessions are hidden unless 'all' is true
async function listTrips(userId, { limit, all }) {
  // this user's closed trips ==> newest first and capped by `limit`
  const query = userTrips(userId)
    .whereNotNull("trips.ended_at")
    .orderBy("trips.started_at", "desc")
    .limit(limit);

  // hide trips shorter than the minimum ( ESP32 boot sessions ) unless `all` is true
  if (!all)
    query.where("trips.distance_m", ">=", config.minTripDistanceKm * 1000);

  // shape every row for the API
  return (await query).map(toSummary);
}

// newest trip that is in progress or long enough to count --> `null` if there is none
async function getLatestTrip(userId) {
  // minimum distance in metres ( the config value is in km )
  const minMetres = config.minTripDistanceKm * 1000;

  const trip = await userTrips(userId)
    // still in progress OR long enough to count
    .where((builder) =>
      builder
        .whereNull("trips.ended_at")
        .orWhere("trips.distance_m", ">=", minMetres),
    )
    .orderBy("trips.started_at", "desc")
    .first();

  // nothing found ==> no trip to return
  return trip ? toMobile(trip) : null;
}

// summary with number of harsh events per type --> `null` if the trip does not exist / is not the user's
async function getTrip(userId, tripId) {
  // check that the trip exists and belongs to this user
  const trip = await userTrips(userId).where("trips.id", tripId).first();
  if (!trip) return null;

  // read only the G values needed to detect the harsh events
  const rows = await db("samples")
    .where({ trip_id: tripId })
    .orderBy("created_at")
    .select("long_g", "lat_g");

  // count the harsh events, one per type ( accel / brake / corner )
  const events = detectEvents(rows);
  const counts = { accel: 0, brake: 0, corner: 0 };
  events.forEach((event) => counts[event.type]++);

  // summary + the per-type counts and their total
  return { ...toSummary(trip), events: { ...counts, total: events.length } };
}

// one point per second for the map and the charts
// NOTE: latitude / longitude are `null` when there was no GPS fix
async function getTrack(userId, tripId) {
  // check that the trip exists and belongs to this user
  const trip = await userTrips(userId)
    .where("trips.id", tripId)
    .first("trips.id");
  if (!trip) return null;

  // one row per second, oldest first ==> ready for the map and the charts
  return db("samples")
    .where({ trip_id: tripId })
    .orderBy("created_at")
    .select(
      "created_at as time",
      "latitude",
      "longitude",
      "speed",
      "long_g",
      "lat_g",
      "resultant_g",
    );
}

// where and when each harsh event happened ==> for the pins on the map
function describeEvent(event, rows) {
  // the rows covered by this event ( start and end inclusive )
  const slice = rows.slice(event.startIndex, event.endIndex + 1);

  // the strongest value of the event, sign kept
  let peak;
  if (event.type === "accel")
    // acceleration ==> the highest `long_g`
    peak = Math.max(...slice.map((row) => row.long_g));
  else if (event.type === "brake")
    // braking ==> the lowest `long_g` ( most negative )
    peak = Math.min(...slice.map((row) => row.long_g));
  else {
    // cornering ==> the largest absolute `lat_g` ( left / right )
    peak = slice.reduce(
      (best, row) => (Math.abs(row.lat_g) > Math.abs(best) ? row.lat_g : best),
      slice[0].lat_g,
    );
  }

  // first row of the event that has a position ( an event during a GPS no-fix has none )
  const located = slice.find((row) => row.latitude !== null);

  return {
    type: event.type,
    started_at: slice[0].created_at,
    ended_at: slice[slice.length - 1].created_at,
    // one row per second ==> the slice length is the duration in seconds
    duration_s: slice.length,
    peak_g: round(peak, 3),
    // speed of the event, or `null` when no row has one
    speed_kmh: round(slice.find((row) => row.speed !== null)?.speed ?? null, 1),
    latitude: located ? located.latitude : null,
    longitude: located ? located.longitude : null,
  };
}

// harsh events of one trip ==> each with where and when it happened
async function getEvents(userId, tripId) {
  // check that the trip exists and belongs to this user
  const trip = await userTrips(userId)
    .where("trips.id", tripId)
    .first("trips.id");
  if (!trip) return null;

  // read the columns `describeEvent` needs
  const rows = await db("samples")
    .where({ trip_id: tripId })
    .orderBy("created_at")
    .select("created_at", "latitude", "longitude", "speed", "long_g", "lat_g");

  // detect the events, then describe each one
  return detectEvents(rows).map((event) => describeEvent(event, rows));
}

// make these functions available to other files
module.exports = { listTrips, getLatestTrip, getTrip, getTrack, getEvents };
