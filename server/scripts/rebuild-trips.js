// rebuild the trips of one device ( or all devices ) from the raw samples
// INFO: Usage
// 1. node scripts/rebuild-trips.js 1
// 2. node scripts/rebuild-trips.js all

// WARNING:
// 1. stop the API server first ==> the background sync must not run at the same time
// 2. rebuild / run this script when we change a threshold / `rBad`

// import the data found in our `.env` file
require("dotenv").config();
// import the `knex.js` file to create database connection
const db = require("../db/knex");
// import the `rebuildDevice` function from the `services/trips.js` file
const { rebuildDevice } = require("../services/trips");

// display how to call the script and flag the run as failed
// INFO: 'process.exitCode' ( not 'process.exit' ) ==> 'db.destroy' in 'finally' still runs
function usage() {
  console.error("usage: node scripts/rebuild-trips.js <deviceId | all>");
  process.exitCode = 1;
}

// read the argument ==> rebuild one device / every device
async function main() {
  // device `id` or `all` from the command line
  const arg = process.argv[2];
  // missing argument or not a positive whole number ==> print usage and stop
  if (!arg || (arg !== "all" && !/^\d+$/.test(arg))) return usage();

  // base query ==> every device ( oldest first )
  const query = db("devices").orderBy("id").select("id", "label");
  // 'all' ==> keep every device --> otherwise filter down to the requested id
  const devices = arg === "all" ? await query : await query.where({ id: arg });

  // unknown device id ==> nothing to rebuild
  if (devices.length === 0) {
    console.error("no matching device");
    process.exitCode = 1;
    return;
  }

  // one device at a time ==> the log lines stay readable / the queries do not pile up
  for (const device of devices) {
    console.log(`rebuilding device ${device.id} (${device.label}) ...`);
    await rebuildDevice(device.id);
  }

  // trip count as a quick sanity check for the whole run
  // NOTE: 'count(*)' is a bigint ==> it arrives as a string
  const [{ count }] = await db("trips").count("* as count");
  console.log(`done ==> ${count} trips in the database`);
}

// top-level call ==> catch anything that escapes 'main' and mark the run as failed
main()
  .catch((error) => {
    console.error("rebuild failed:", error.message);
    process.exitCode = 1;
  })
  // always close the connection pool ==> otherwise the script never exits
  .finally(() => db.destroy());
