// import library to import data from `.env` file
require("dotenv").config();

// make this peice of code available to other files
module.exports = {
  // the database client ( type ) that we are using
  client: "pg",
  // our `DATABASE_URL` connection string from `.env`
  connection: process.env.DATABASE_URL,
  // define the minimum and maximum database connections allowed
  pool: { min: 0, max: 5 },
  // where migrations files should be written / stored ( inside the `db/migrations` )
  migrations: { directory: "./db/migrations" },
  // where seeds files should be written / stored ( inside the `db/seeds` )
  seeds: { directory: "./db/seeds" },
};
