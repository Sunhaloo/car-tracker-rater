// import the data found in our `.env` file
require("dotenv").config();

// import the `fetchFeeds` function from the `server/services/thingspeak.js` file
const { fetchFeeds } = require("./services/thingspeak");

// INFO: optional start date from the command line --> `node test-thingspeak.js 2026-10-16`
const after = process.argv[2] ?? null;

// async arrow function in order to wait for `fetchFeeds` response
(async () => {
  const rows = await fetchFeeds({
    channelId: process.env.THINGSPEAK_CHANNEL_ID,
    readKey: process.env.THINGSPEAK_READ_KEY,
    after,
  });

  console.log("rows:", rows.length);
  console.log("first two:", rows.slice(0, 2));
  console.log("last:", rows.at(-1));
})().catch((err) => console.error("failed:", err.message));
