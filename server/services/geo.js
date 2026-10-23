// import all the data that we have inside the `config` directory ==> `index.js` "constants" file
const config = require("../config");
// import all the data that we have inside the `config/towns.js` file
const towns = require("../config/towns");

// constants about the radius of the Earth and converting degrees into radians
const EARTH_RADIUS_M = 6371000;
const toRadians = (degrees) => (degrees * Math.PI) / 180;

// calculate the distance between two coordinates in metres
function haversineMeters(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

// the closest item from a list with its distance ( `null` when the list is empty )
function nearest(latitude, longitude, items) {
  let best = null;
  for (const item of items) {
    const distance = haversineMeters(
      latitude,
      longitude,
      item.latitude,
      item.longitude,
    );
    if (best === null || distance < best.distance) best = { item, distance };
  }
  return best;
}

// INFO: turn the coordinates into text data
// 1. personal place whose radius contains the point ==> closest centre wins when they overlap
// 2. nearest built-in town within `townMaxDistanceM`
// 3. raw coordinates
function labelFor(latitude, longitude, places, townList = towns) {
  const inside = nearest(
    latitude,
    longitude,
    places.filter(
      (place) =>
        haversineMeters(latitude, longitude, place.latitude, place.longitude) <=
        place.radius_m,
    ),
  );
  if (inside) return inside.item.label;

  const town = nearest(latitude, longitude, townList);
  if (town && town.distance <= config.townMaxDistanceM) return town.item.name;

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

// make these functions available to other files
module.exports = { haversineMeters, labelFor };
