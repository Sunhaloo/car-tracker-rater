// INFO: this is a developer only file which will create a "dev user" inside the Neon's 'user' table
// this needs to be done as we don't have any front-end for the moment

// NOTE: we need to provide the arguments for:
// 1. username
// 2. email
// 3. password

// WARNING: use a throwaway password because of shell history

// import the data found in our `.env` file
require("dotenv").config();

// import the `bcryptjs` library
const bcrypt = require("bcryptjs");
// create the database connection
const db = require("../db/knex");
// import the `encrypt` function from the `services/encryption.js` file
const { encrypt } = require("../services/encryption");

// create user by providing arguments inside the terminal
async function main() {
  // get the user's credential from the command line arguments
  const [username, email, password] = process.argv.slice(2);

  // check if we have the arguments else we end the program
  if (!username || !email || !password) {
    console.error(
      "usage: node scripts/seed-dev.js <username> <email> <password>",
    );
    process.exit(1);
  }

  // hash the password in order for database administrator to not see
  const passwordHash = await bcrypt.hash(password, 10);

  // create the user using knex.js SQL query builder
  const [user] = await db("users")
    .insert({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
    })
    .onConflict("username")
    .merge(["email", "password_hash"])
    .returning(["id", "username"]);

  // create a device row for the user
  const [device] = await db("devices")
    .insert({
      user_id: user.id,
      label: "Mazda 3",
      thingspeak_channel_id: Number(process.env.THINGSPEAK_CHANNEL_ID),
      read_key_encrypted: encrypt(process.env.THINGSPEAK_READ_KEY),
    })
    .onConflict("thingspeak_channel_id")
    .merge(["label", "read_key_encrypted"])
    .returning(["id", "label"]);

  console.log("user:", user);
  console.log("device:", device);
}

// run the main function in order to create the user and associated device
main()
  // if any success / error has occurred ==> simply destroy the connection to the database
  .catch((err) => console.error("seed failed:", err.message))
  .finally(() => db.destroy());
