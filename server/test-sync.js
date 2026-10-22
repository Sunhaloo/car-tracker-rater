// import the data found in our `.env` file
require("dotenv").config();

// create the database connection
const db = require("./db/knex");
// import the `syncAll` function from the `services/sync.js` file
const { syncAll } = require("./services/sync");

// async arrow function in order to wait for `fetchFeeds` response
(async () => {
  // call the `syncAll` function and wait for response
  await syncAll();

  // count the number of new rows inserted
  const [{ count }] = await db("samples").count("* as count");
  console.log("rows in samples:", count);
})()
  .catch((err) => console.error("failed:", err.message))
  .finally(() => db.destroy());
