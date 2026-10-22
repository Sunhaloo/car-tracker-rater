// turns raw 'samples' into trips: assigns 'trip_id', computes distance, closes finished trips, scores them

// create the database connection
const db = require("../db/knex");
// import the required constants from the `config/index.js` file
const config = require("../config");
// import the required functions from the `services/scoring.js` file
const { detectEvents, scoreTrip } = require("./scoring");

// start sampling ==> adding to database when ESP32 boots up or has a reboot
// INFO: calibration does not add any new rows!
async function assignTrips(deviceId) {
  // enforce transaction rules ==> a crash halfway must never leave samples half-assigned
  return db.transaction(async (trx) => {
    // every sample of this device that does not belong to a trip yet ( oldest first )
    const unassigned = await trx("samples")
      .where({ device_id: deviceId })
      .whereNull("trip_id")
      .orderBy("created_at")
      .select("id", "created_at", "uptime");

    // nothing new to assign ==> stop early
    if (unassigned.length === 0) return [];

    // last already-assigned sample before the first new one ( none for a brand new device )
    let previous =
      (await trx("samples")
        .where({ device_id: deviceId })
        .whereNotNull("trip_id")
        .where("created_at", "<", unassigned[0].created_at)
        .orderBy("created_at", "desc")
        .first("id", "created_at", "uptime", "trip_id")) ?? null;

    // trip the next sample will join unless a break is found
    let currentTripId = previous ? previous.trip_id : null;
    // trip id ==> the sample ids that belong to it ( written back in one go after the loop )
    const idsByTrip = new Map();

    for (const row of unassigned) {
      // time since the previous sample ( 0 when there is none )
      // INFO: `Date - Date` gives the difference in milliseconds
      const gapMs = previous ? row.created_at - previous.created_at : 0;

      // ESP32 lost power / rebooted ==> `uptime` went backwards
      // INFO: even a short gap means a new trip when the board restarted
      const rebooted =
        previous &&
        previous.uptime !== null &&
        row.uptime !== null &&
        row.uptime < previous.uptime;

      // no previous sample, a gap longer than 'tripGapMs' or a reboot ==> start a new trip
      if (!previous || gapMs > config.tripGapMs || rebooted) {
        const [trip] = await trx("trips")
          .insert({ device_id: deviceId, started_at: row.created_at })
          .returning("id");
        currentTripId = trip.id;
      }

      // file this sample under the trip it belongs to
      if (!idsByTrip.has(currentTripId)) idsByTrip.set(currentTripId, []);
      idsByTrip.get(currentTripId).push(row.id);

      // this row becomes the reference for the next iteration
      previous = { ...row, trip_id: currentTripId };
    }

    // write the assignments back, one trip at a time
    for (const [tripId, ids] of idsByTrip) {
      // update in batches so a single query does not get too large
      for (let i = 0; i < ids.length; i += 1000) {
        await trx("samples")
          .whereIn("id", ids.slice(i, i + 1000))
          .update({ trip_id: tripId });
      }
    }

    // trips that were touched ( newly created or extended )
    return [...idsByTrip.keys()];
  });
}

// find the steps for whole trip everytime
// INFO: rows without speed ==> + 0 m --> as not GPS fix
async function recomputeSteps(tripId) {
  // one `UPDATE ... FROM` sets `step_distance_m` for every sample of the trip in one query
  await db.raw(
    `
    UPDATE samples AS s
    SET step_distance_m = x.step
    FROM (
      SELECT id,
             CASE
               WHEN LAG(created_at) OVER w IS NULL THEN 0
               ELSE COALESCE(speed, 0) / 3.6
                    * LEAST(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER w)), ?::numeric)
             END AS step
      FROM samples
      WHERE trip_id = ?::bigint
      WINDOW w AS (ORDER BY created_at)
    ) AS x
    WHERE s.id = x.id
    `,
    // bind parameters ==> the cap on the time gap, then the trip to recompute
    [config.maxStepSeconds, tripId],
  );
}

// INFO: "strongest" values are always positive --> a trip with no hard braking has 0, not a negative number
const positive = (value) => (value === null ? null : Math.max(0, value));

// close the trip in order to summarise and create the score for the trip
async function finalizeTrip(tripId) {
  // make sure `step_distance_m` is up to date before summing the distance
  await recomputeSteps(tripId);

  // summarise the whole trip in one aggregate query
  const agg = await db("samples")
    .where({ trip_id: tripId })
    .select(
      // trip boundaries ( first and last sample )
      db.raw("min(created_at) as started_at"),
      db.raw("max(created_at) as ended_at"),
      // total distance ==> sum of the per-row steps
      db.raw("coalesce(sum(step_distance_m), 0) as distance_m"),
      // strongest speed
      db.raw("max(speed) as max_speed"),
      // strongest acceleration ( highest positive 'long_g' )
      db.raw("max(long_g) as max_accel_g"),
      // strongest braking ==> 'min' is negative so negate it to stay positive
      db.raw("-min(long_g) as max_brake_g"),
      // strongest right turn ( highest positive 'lat_g' )
      db.raw("max(lat_g) as max_right_g"),
      // strongest left turn ==> 'min' is negative so negate it to stay positive
      db.raw("-min(lat_g) as max_left_g"),
      // strongest overall force felt
      db.raw("max(resultant_g) as max_resultant_g"),
    )
    .first();

  // trip has no samples ==> nothing to summarise
  if (!agg || !agg.started_at) return;

  // first sample with a GPS fix ==> start position of the trip
  const first = await db("samples")
    .where({ trip_id: tripId })
    .whereNotNull("latitude")
    .orderBy("created_at", "asc")
    .first("latitude", "longitude");

  // last sample with a GPS fix ==> end position of the trip
  const last = await db("samples")
    .where({ trip_id: tripId })
    .whereNotNull("latitude")
    .orderBy("created_at", "desc")
    .first("latitude", "longitude");

  // every G reading of the trip ( oldest first ) ==> used to count the hard events
  const rows = await db("samples")
    .where({ trip_id: tripId })
    .orderBy("created_at")
    .select("long_g", "lat_g");

  // score comes from the number of hard events spread over the distance
  // INFO: 'scoreTrip' returns null when the trip is too short to judge
  const events = detectEvents(rows);
  const score = scoreTrip({
    eventCount: events.length,
    distanceKm: agg.distance_m / 1000,
  });

  // write the summary back onto the trip row
  await db("trips")
    .where({ id: tripId })
    .update({
      // boundaries, distance and strongest speed
      started_at: agg.started_at,
      ended_at: agg.ended_at,
      distance_m: agg.distance_m,
      max_speed: agg.max_speed,
      // made positive with the 'positive' helper above
      max_accel_g: positive(agg.max_accel_g),
      max_brake_g: positive(agg.max_brake_g),
      max_right_g: positive(agg.max_right_g),
      max_left_g: positive(agg.max_left_g),
      max_resultant_g: agg.max_resultant_g,
      // overall trip score
      score,
      // start and end position ( null when the trip had no GPS fix )
      start_latitude: first?.latitude ?? null,
      start_longitude: first?.longitude ?? null,
      end_latitude: last?.latitude ?? null,
      end_longitude: last?.longitude ?? null,
      // start_label / end_label: filled by the places lookup ( not written yet )
    });
}

// closes open trips whose newest sample is older than 'tripCloseWaitMs'
// also re-finalizes a CLOSED trip that just received late rows ==> hotspot dropout, uploaded later
async function processDevice(deviceId) {
  // assign any new samples to trips first ==> gives the trips that were touched
  const touched = await assignTrips(deviceId);

  // set of trip ids to finalize ( a 'Set' avoids finalizing the same trip twice )
  const toFinalize = new Set();

  // a CLOSED trip that just received late rows must be finalized again
  if (touched.length > 0) {
    const late = await db("trips")
      .whereIn("id", touched)
      .whereNotNull("ended_at")
      .select("id");
    late.forEach((trip) => toFinalize.add(trip.id));
  }

  // still-open trips ==> close the ones whose newest sample is old enough
  const openTrips = await db("trips")
    .where({ device_id: deviceId })
    .whereNull("ended_at")
    .select("id");
  for (const trip of openTrips) {
    // newest sample of the trip ==> tells us when the trip last saw data
    const { newest } = await db("samples")
      .where({ trip_id: trip.id })
      .max("created_at as newest")
      .first();
    // no new sample for longer than 'tripCloseWaitMs' ==> the trip is over
    if (newest && Date.now() - newest.getTime() > config.tripCloseWaitMs) {
      toFinalize.add(trip.id);
    }
  }

  // recompute the summary and score of every trip marked above
  for (const tripId of toFinalize) {
    await finalizeTrip(tripId);
  }
}

// recompute every closed trip of a device ==> run after changing the thresholds or 'rBad' in config
async function rebuildDevice(deviceId) {
  // only CLOSED trips are rebuilt ==> open trips are still changing and will be scored later
  const closed = await db("trips")
    .where({ device_id: deviceId })
    .whereNotNull("ended_at")
    .select("id");

  // re-run the summary + score for each closed trip
  for (const trip of closed) {
    await finalizeTrip(trip.id);
  }
}

// make these functions available to other files
module.exports = { processDevice, rebuildDevice, finalizeTrip };
