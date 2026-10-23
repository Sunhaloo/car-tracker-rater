// import the `knex.js` file to create database connection
const db = require("../db/knex");
// import the `labelFor` function from the `services/geo.js` file
const { labelFor } = require("./geo");

// DB row ==> API JS object ==> hides `user_id` from the client
// NOTE: `Number(...)` because 'bigserial' comes back from PostgreSQL as a string
const toPublic = (place) => ({
  id: Number(place.id),
  label: place.label,
  latitude: place.latitude,
  longitude: place.longitude,
  radius_m: place.radius_m,
});

// every place that belongs to this user ==> oldest first
async function listPlaces(userId) {
  const places = await db("places").where({ user_id: userId }).orderBy("id");
  return places.map(toPublic);
}

// insert a new place for this user ==> returns it in API shape
async function createPlace(userId, data) {
  // 'returning' gives an array ==> destructure the single inserted row
  const [place] = await db("places")
    .insert({ user_id: userId, ...data })
    .returning("*");
  return toPublic(place);
}

// update one of this user's places
// NOTE: undefined when the place does not exist / belongs to someone else
async function updatePlace(userId, id, changes) {
  const [place] = await db("places")
    // filter on 'user_id' too ==> you can only change your own places
    .where({ id, user_id: userId })
    .update(changes)
    .returning("*");
  return place ? toPublic(place) : undefined;
}

// delete one of this user's places ==> `true` when a row was actually removed
async function deletePlace(userId, id) {
  // 'del()' returns the number of deleted rows ==> '> 0' means it existed
  return (await db("places").where({ id, user_id: userId }).del()) > 0;
}

// `start_label` / `end_label` of one trip ==> called when a trip is finalized
// NOTE: open trips and trips without a GPS fix are left alone
async function labelTrip(tripId) {
  // read the coordinates of the trip and the owner --> joined through `devices`
  const trip = await db("trips")
    .join("devices", "devices.id", "trips.device_id")
    .where("trips.id", tripId)
    .first(
      "trips.ended_at",
      "trips.start_latitude",
      "trips.start_longitude",
      "trips.end_latitude",
      "trips.end_longitude",
      "devices.user_id",
    );

  // unknown trip or still running ==> nothing to label
  if (!trip || trip.ended_at === null) return;

  // the user's saved places ==> all the labels we can match against
  const places = await db("places")
    .where({ user_id: trip.user_id })
    .select("label", "latitude", "longitude", "radius_m");

  // only label the ends that have a GPS fix
  const changes = {};
  if (trip.start_latitude !== null && trip.start_longitude !== null) {
    changes.start_label = labelFor(
      trip.start_latitude,
      trip.start_longitude,
      places,
    );
  }
  if (trip.end_latitude !== null && trip.end_longitude !== null) {
    changes.end_label = labelFor(trip.end_latitude, trip.end_longitude, places);
  }

  // one update for both labels ( skip it when there is nothing to write )
  if (Object.keys(changes).length > 0)
    await db("trips").where({ id: tripId }).update(changes);
}

// old trips keep their old labels when a place is added ==> this rewrites all of the user's finished trips
async function relabelUserTrips(userId) {
  // every finished trip of this user ( open ones get labelled when they close )
  const trips = await db("trips")
    .join("devices", "devices.id", "trips.device_id")
    .where("devices.user_id", userId)
    .whereNotNull("trips.ended_at")
    .select("trips.id");

  // label them one by one, then report how many were touched
  for (const trip of trips) await labelTrip(trip.id);
  return trips.length;
}

// make these functions available to other files
module.exports = {
  listPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  labelTrip,
  relabelUserTrips,
};
