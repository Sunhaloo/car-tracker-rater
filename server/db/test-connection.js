// import the `knex.js` file to create database connection
const db = require("./knex");

// create a asynchronous function ==> wait for connection
async function main() {
  try {
    // test the connetion by sending a "raw" SQL command
    const result = await db.raw("select 1 as ok, now() as server_time");
    console.log("Connected:", result.rows[0]);

    // if connection was not able to be established
  } catch (err) {
    // simply display a little message
    console.error("Connection failed:", err.message);
  } finally {
    // even if success --> close the connection
    await db.destroy();
  }
}

// run the main `asyc` function
main();
