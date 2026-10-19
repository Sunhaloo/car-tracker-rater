// reads rows from a ThingSpeak channel and converts them to the shape of the 'samples' table

// import all the data that we have inside the `config` directory ==> `index.js` "constants" file
const config = require("../config");

// base URL for ThingSpeak's API
const BASE_URL = "https://api.thingspeak.com";

// convert all the string values into actual numbers in order to work with it
// NOTE: use `null` instead of `Number(null)` in order to not fake the data
// as `Number(null)` will output '0' instead of `null`!
function toNumber(value) {
  // check if we even have a value ==> else `null`
  if (value === null || value === undefined || value === "") return null;

  // convert the string value to and actually number
  const number = Number(value);

  // simply return the value for other functions
  return Number.isFinite(number) ? number : null;
}

// take one ThingSpeak row and convert it to one 'samples' table row
function normalizeFeed(feed) {
  // variables for GPS coordinates
  let latitude = toNumber(feed.latitude);
  let longitude = toNumber(feed.longitude);

  // invariant: a missing GPS fix is never stored as 0,0
  if (latitude === 0 && longitude === 0) {
    latitude = null;
    longitude = null;
  }

  // the status text looks like "sats:7" ==> keep only the number
  const satsMatch = /sats:(\d+)/.exec(String(feed.status ?? ""));

  // return a JS object ( in the form of 'samples' table )
  return {
    created_at: feed.created_at,
    thingspeak_entry_id: toNumber(feed.entry_id),
    speed: toNumber(feed.field1),
    long_g: toNumber(feed.field2),
    lat_g: toNumber(feed.field3),
    yaw_rate: toNumber(feed.field4),
    uptime: toNumber(feed.field5),
    status_bits: toNumber(feed.field6),
    latitude,
    longitude,
    elevation: toNumber(feed.elevation),
    sats: satsMatch ? Number(satsMatch[1]) : null,
  };
}

// format the date-time in UTC format which is required by ThingSpeak
function formatStart(after) {
  return new Date(after).toISOString().slice(0, 19).replace("T", " ");
}

// rows newer than 'after' ( i.e a Date or an ISO string ) --> already normalised oldest first
// NOTE: `after` is inclusive --> so the newest known row comes back again ==> the unique key in 'samples' skips it
async function fetchFeeds({ channelId, readKey, after }) {
  let query = new URLSearchParams({
    api_key: readKey,
    results: String(config.thingspeakMaxRows),
    location: "true",
    status: "true",
  }).toString();

  // turn `<Space>` character into `%20` ( what is found inside of URLs )
  if (after) query += `&start=${encodeURIComponent(formatStart(after))}`;

  // WARNING: never `console.log` the `url` variable as it contains the 'read' API key
  const url = `${BASE_URL}/channels/${channelId}/feeds.json?${query}`;

  // check if we have been able to fetch the data from ThingSpeak
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    throw new Error(`ThingSpeak responded with status ${response.status}`);
  }

  // get the HTTP response from the API
  const body = await response.json();

  // take the response and simply turn it into an array
  const feeds = body.feeds ?? [];

  // NOTE: 8000-row cap was reached ==> there may be more rows than we got
  if (feeds.length >= config.thingspeakMaxRows) {
    console.warn(
      `ThingSpeak returned ${feeds.length} rows ( the maximum ) ==> older rows may be missing`,
    );
  }

  // create new array containing normalised feed
  return feeds.map(normalizeFeed);
}

// make these functions available to other files
module.exports = { fetchFeeds, normalizeFeed };
