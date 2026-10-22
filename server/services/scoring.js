// import the `config/index.js` file in order to have access to constants
const config = require("../config");

// to find the bounds for data
function clamp(value, min, max) {
  // return the minimum value if less than `min`
  return Math.min(max, Math.max(min, value));
}

// INFO: conditions
// 1. long_g > + eventThresholdG ==> acceleration
// 2. long_g < - eventThresholdG ==> braking
// 3. | lat_g | > eventThresholdG ==> cornering ( either left or right )

// NOTE: `null` value ends the current run and is never over threshold
function detectEvents(rows, thresholdG = config.eventThresholdG) {
  const events = [];
  const open = { accel: null, brake: null, corner: null };

  rows.forEach((row, index) => {
    // check for acceleration and cornering
    const over = {
      accel: row.long_g !== null && row.long_g > thresholdG,
      brake: row.long_g !== null && row.long_g < -thresholdG,
      corner: row.lat_g !== null && Math.abs(row.lat_g) > thresholdG,
    };

    // check for each type of event independently
    for (const type of Object.keys(over)) {
      if (!over[type]) {
        // end the event
        open[type] = null;
      } else if (open[type] === null) {
        // start a new event
        events.push({ type, startIndex: index, endIndex: index });
        open[type] = events.length - 1;
      } else {
        // extend the event
        events[open[type]].endIndex = index;
      }
    }
  });

  // allow other function to have access to array of `events`
  return events;
}

// scoring / rating system from 0 to 10
// WARNING: if the distance covered is too short ==> `null` --> we don't have much data
function scoreTrip({ eventCount, distanceKm }) {
  if (distanceKm < config.minTripDistanceKm) return null;
  const eventsPer10Km = eventCount / (distanceKm / 10);
  const score = clamp(10 - (10 * eventsPer10Km) / config.rBad, 0, 10);
  return Math.round(score * 100) / 100;
}

// the label is derived from the score, never stored
function ratingFromScore(score) {
  if (score === null || score === undefined) return "Not enough data";
  if (score < config.badBelow) return "Bad";
  if (score < config.goodFrom) return "Normal";
  return "Good";
}

// make these functions available to other files
module.exports = { detectEvents, scoreTrip, ratingFromScore };
