// function to check if something is true
const assert = require("assert");
// import the following functions from the `services/geo.js` file
const { haversineMeters, labelFor } = require("../services/geo");

// INFO: Port Louis to Curepipe is about 17 km
const km = haversineMeters(-20.1609, 57.5012, -20.3162, 57.5166) / 1000;

// check if the distance is correct
assert(km > 16 && km < 19, `unexpected distance: ${km}`);

//  University of Mauritius --> 150 m radius
const places = [
  {
    label: "University of Mauritius",
    latitude: -20.233889,
    longitude: 57.496944,
    radius_m: 150,
  },
];

// approximately 50 m north of the university ==> inside the place
assert.strictEqual(
  labelFor(-20.23344, 57.496944, places),
  "University of Mauritius",
);

// approximately 1 km north ==> outside the radius --> so the nearest built-in town ( Moka )
assert.strictEqual(labelFor(-20.2249, 57.496944, places), "Moka");

// far out at sea ==> raw coordinates
assert.strictEqual(labelFor(-21.0, 58.5, places), "-21.0000, 58.5000");

console.log("geo tests passed");
