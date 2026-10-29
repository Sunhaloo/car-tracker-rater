---
id: Robotics and IOT - Car Tracker and Driver Rater
aliases: Car Tracker and Driver Rater for Robotics and Iot Assignment
tags:
  - C
  - microcontroller
  - uni
  - uom
module: ICT 3207Y
author: S.Sunhaloo
date: 2026-10-17
status: Completed
---

## List of Contents

- [[#AI Usage]]
- [[#Setup GitHub Repository]]
  - [[#Root Ignore File]]
  - [[#Setup Firmware Directory]]
  - [[#Server Directory]]
  - [[#Client Directory]]
- [[#Firmware]]
- [[#Server]]
  - [[#Setup Server Directory]]
  - [[#Knex.js SQL Query Builder]]
    - [[#Creation of Migration File]]
      - [[#Trips Table]]
      - [[#Samples Table]]
      - [[#Places Table]]
      - [[#Users Table]]
      - [[#Devices Table]]
  - [[#Express.js Server]]
    - [[#The Constants File]]
    - [[#Main Server File]]
      - [[#Update Package JSON File]]
  - [[#Encryption]]
    - [[#Create Encryption Key]]
    - [[#Create Encryption Service]]
      - [[#Test Encryption Algorithm]]
  - [[#ThingSpeak Data]]
    - [[#Normalise ThingSpeak Data]]
      - [[#Test ThingSpeak Data Fetching]]
  - [[#Syncing ThingSpeak Data with Neon's Database Table]]
    - [[#Create Development User]]
    - [[#Create Synchronisation Code]]
      - [[#Test Synchronisation]]
  - [[#Scoring and Trips]]
    - [[#Scoring]]
    - [[#Trips]]
  - [[#Authentication - Register and Login]]
    - [[#JSON Web Tokens]]
    - [[#Middleware]]
    - [[#Routes For Authentication]]
    - [[#Testing Authentication Endpoints]]
  - [[#Trips and Trips Routes]]
    - [[#Trip Queries]]
    - [[#Routes For Trip Queries]]
    - [[#Testing Trip Queries Endpoints]]
  - [[#Device Service and Routes]]
    - [[#Device Service]]
    - [[#Routes For Device]]
    - [[#Testing Device Endpoints]]
  - [[#Status Bits]]
    - [[#Status Bits Queries]]
    - [[#Routes For Status Bits]]
    - [[#Testing Status Bits Endpoints]]
  - [[#Geographic - Places Location]]
    - [[#Geographic Location Fallback]]
    - [[#Geolocation Calculations]]
    - [[#Routes For Geographic Locations]]
  - [[#Rebuild Trips Script]]
  - [[#Update Error Handler]]
- [[#Client]]

---

> [!NOTE]
>
> - ThingSpeak: <https://thingspeak.mathworks.com/>
> - Node.js: <https://nodejs.org/>
> - Neon ( _Serverless RDMS_ ): <https://neon.com/>
> - Knex.js: <https://knexjs.org/>
> - Vercel: <https://vercel.com/>
> - Advanced Encryption Standard: <https://en.wikipedia.org/wiki/Advanced_Encryption_Standard>
> - React: <https://react.dev/>
> - `jq`: <https://jqlang.org/>
> - opencode: <https://opencode.ai/>

# AI Usage

# Setup GitHub Repository

- Clone the clean, empty `car-tracker-rater` repository onto our local machine:

```bash
# clone the repository onto our local machine ( if using 'SSH' )
git clone git@github.com:Sunhaloo/car-tracker-rater.git

# clone the repository onto our local machine ( if using 'HTTPS' )
git clone https://github.com/Sunhaloo/car-tracker.git
```

## Root Ignore File

We have planned to have **four** `.gitignore` files whereby each directory and also the repository **root** is going to have one.

> In this way, we will be able to _fine-tune_ what we need / don't need!

- Here is the _global_ `.gitgnore` file that we have at the **root** of our repository:

```.gitignore
# Node.js dependencies
node_modules/

# secret environment files
.env
.env.*

# NOTE: do allow `.env.example` files to be committed
!.env.example

# any log directories
logs/
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# any build / output directories
dist/
build/
out/

# any cache directories
.cache/
.parcel-cache/
.eslintcache

# remove VS Code's junk from the repository
.vscode/

# operating systems ( MacOS + Windows ) related junk
.DS_Store
Thumbs.db
```

## Firmware Directory

We are going to be committing the `.ino` _firmware_ file to our repository so that _[little Timmy](http://little-timmy.urbanup.com/17425127)_ can compile the firmware code from scratch **without** needing to re-write the code himself.

- Below you are going to find the structure for `firmware` directory that we have inside the repository:

```console
 firmware
├── 󰊢 .gitignore
├──  assets
│   └──  wiring-diagram.png
├──  car_tracker
│   ├──  car_tracker.ino
│   ├──  secrets.h.example
│   └──  types.h
└── 󰂺 README.md
```

## Server Directory

## Client Directory

---

> [!NOTE]
> The upcoming chapter will **document** the _setup_, _coding_ and _testing_ processes for this 'Car Tracker and Driver Rater' Robotics and Iot project!

---

# Firmware

# Server

## Setup Server Directory

This is going to be a JavaScript based back-end where we are going to use tools such as [Node.js](https://nodejs.org) and [Neon](https://neon.com/) in order export the required data for the front-end application to display.

- Create the `server` directory inside **root** of the `car-tracker-rater` repository:

```bash
# make the server directory at the root and head into
mkdir server && cd server
```

- Initialise the Node.js _server_ project:

```bash
# initialise the node project for back-end
npm init -y

# install the required dependencies
npm install express knex pg cors dotenv

# install `nodemon` ( to automate reloading ) as development dependency
npm install --save-dev nodemon
```

- Create the required files and directories for the `server` back-end directory:

```bash
# create the following files inside `server`
mkdir -p config db/migrations services routes

# create the following directories inside `server`
touch app.js knexfile.js
```

- Create our `server/.env.example` file:

```bash
# WARNING: make a copy of this `.env.example` file and rename it to `.env`
# additionally, make sure that you replace with your data

# Express.js API port
PORT=5000

# Neon ( Postgres ) SQL connection string
# WARNING: do keep the `?sslmode=require` at the of the connection string
DATABASE_URL=

# ThingSpeak channel ID
THINGSPEAK_CHANNEL_ID=

# ThingSpeak READ API key for above channel
# NOTE: for development ==> you can keep using your current API key
# nevertheless, do regenerate the API key for real trips
THINGSPEAK_READ_KEY=

# encryption key to use for encrypting user's ThingSpeak 'read' key
ENCRYPTION_KEY=

# JSON Web Tokens for user registrations and logins
JWT_SECRET=
```

> [!WARNING]
> In order to actually use the project and be able to make it _run_... You need to copy this `.env.example` file in order to create a `.env` file.
>
> Thus, you the replace the **placeholder values** inside of the newly copied / created `.env` file.
>
> > And also; never **commit** or **show** anyone your _private_ `.env` environment file.

> [!NOTE]
> Now, head over to [Neon](https://console.neon.tech) and create your own project in order to get your `DATABASE_URL` and place it in your own `.env` file.
>
> Here is what a sample `DATABASE_URL` **string** looks like:
>
> ```bash
> DATABASE_URL="postgresql://example_user:fake_password@ep-example-123456.us-east-2.aws.neon.tech/example_db?sslmode=require&channel_binding=require"
> ```
>
> The `DATABASE_URL` string **should** include / have the following at the end of it: `?sslmode=require&channel_binding=require`!

## Knex.js SQL Query Builder

Instead of writing "_raw_" SQL scripts / commands, we are going to be using [Knex.js](https://knexjs.org/) in order to write JavaScript code that will be translated to these SQL commands.

- Here is the ( _current_ ) contents of our `knexfile.js` file:

```js
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
```

> The above file is going to be responsible for the setup and configuration of the actual database.

- Create the `server/db/knex.js` file:

```js
// import the `knex` library and our configuration
const knex = require("knex");

// import the configuration for knex.js found inside `knexfile.js`
const knexconfig = require("../knexfile.js");

// initialise knex with our `knexfile.js` configuration file
const db = knex(knexconfig);

// export the connection ( to be used in other files )
module.exports = db;
```

> The above code is the actual code that will create the `db` object in order use it!

- Create the `server/db/test-connection.js` file to **test** database connection:

```js
// import the `knex.js` file
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
```

- Run the following command to _run_ the `test-connection.js` file:

```bash
# simply run the `test-connection.js` file
# INFO: need to run command inside of `server` directory
node db/test-connection.js
```

> [!TIP]
> You need to see something like this:
>
> ```console
> ◇ injected env (4) from .env
> Connected: { ok: 1, server_time: 2026-10-17T21:28:33.663Z }
> ```
>
> > If you **don't** see the above message... Something might be wrong!

### Creation of Migration File

#### Trips Table

| Column            | Type             | Null? | Notes                                                    |
| ----------------- | ---------------- | ----- | -------------------------------------------------------- |
| `id`              | bigint, identity | no    | primary key                                              |
| `driver`          | text             | yes   | set from the web app after the trip                      |
| `started_at`      | timestamptz      | no    | first sample of the trip                                 |
| `ended_at`        | timestamptz      | yes   | null while the trip is in progress                       |
| `distance_m`      | real             | yes   | sum of `step_distance_m`                                 |
| `max_speed`       | real             | yes   | km/h                                                     |
| `max_accel_g`     | real             | yes   | max of `long_g`                                          |
| `max_brake_g`     | real             | yes   | −(min of `long_g`)                                       |
| `max_right_g`     | real             | yes   | max of `lat_g`                                           |
| `max_left_g`      | real             | yes   | −(min of `lat_g`)                                        |
| `max_resultant_g` | real             | yes   | max of `resultant_g`                                     |
| `score`           | real             | yes   | filled in once the scoring method is decided             |
| `start_latitude`  | double precision | yes   | first sample with a fix                                  |
| `start_longitude` | double precision | yes   | first sample with a fix                                  |
| `end_latitude`    | double precision | yes   | last sample with a fix                                   |
| `end_longitude`   | double precision | yes   | last sample with a fix                                   |
| `start_label`     | text             | yes   | place name from geocoding, looked up once and then saved |
| `end_label`       | text             | yes   | place name from geocoding, looked up once and then saved |

- Use the following command to create the migration file:

```bash
# node runner to create migration file ( trips table )
# INFO: need to run command inside of `server` directory
npx knex migrate:make create_trips_table
```

- Running the above command; I see something like this:

```console
npm notice run server@1.0.0 npx
npm notice run 'knex' migrate:make create_trips_table
◇ injected env (4) from .env
Created Migration: /home/username/GitHub/car-tracker-rater/server/db/migrations/20261017210112_create_trips_table.js
```

- Create the actual `server/db/migrations/*_create_trips_table.js` file:

```js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// creation of 'trips' table
exports.up = function (knex) {
  return knex.schema.createTable("trips", (table) => {
    // primary key for 'trips' table ==> `bigint` auto-increment
    table.bigIncrements("id");

    // driver name ==> set from the web app after the trip
    table.text("driver");

    // first sample of the trip ==> null not allowed
    table.timestamp("started_at", { useTz: true }).notNullable();

    // last sample of the trip ==> null while the trip is in progress
    table.timestamp("ended_at", { useTz: true });

    // sum of 'step_distance_m'
    table.float("distance_m");

    // maximum speed reached during the trip
    table.float("max_speed");

    // maximum 'long_g' ==> strongest acceleration ( positive )
    table.float("max_accel_g");

    // −( minimum 'long_g' ) ==> strongest braking ( always positive )
    table.float("max_brake_g");

    // maximum 'lat_g' ==> strongest right-hand turn ( positive )
    table.float("max_right_g");

    // −( minimum 'lat_g' ) ==> strongest left-hand turn ( always positive )
    table.float("max_left_g");

    // maximum 'resultant_g' ==> strongest overall force felt
    table.float("max_resultant_g");

    // overall trip score ==> based the scoring system
    table.float("score");

    // first GPS sample with a fix ==> start position
    table.double("start_latitude");
    table.double("start_longitude");

    // last GPS sample with a fix ==> end position
    table.double("end_latitude");
    table.double("end_longitude");

    // place name from the 'places' lookup ==> written once at trip end
    table.text("start_label");
    table.text("end_label");
  });
};

// deletion of 'trips' table
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  // delete the 'trips' table when `.down` called
  return knex.schema.dropTableIfExists("trips");
};
```

- Actually _migrate_ / create the table and check Neon console:

```bash
# create the database table over at Neon
# INFO: need to run command inside of `server` directory
npx knex migrate:latest
```

> [!TIP]
>
> - Running the above `migrate:latest` command I do get the following output:
>
> ```console
> npm notice run server@1.0.0 npx
> npm notice run 'knex' migrate:latest
> ◇ injected env (4) from .env
> Batch 1 run: 1 migrations
> ```

#### Samples Table

| Field                 | Type             | Null? | Notes                                                                             |
| --------------------- | ---------------- | ----- | --------------------------------------------------------------------------------- |
| `id`                  | bigint, identity | no    | primary key                                                                       |
| `created_at`          | timestamptz      | no    | UTC, unique, used for repeatable ingest ( will convert to Mauritian time )        |
| `thingspeak_entry_id` | integer          | yes   | for traceability                                                                  |
| `speed`               | real             | yes   | km/h                                                                              |
| `long_g`              | real             | yes   | accelerating: +, braking: -                                                       |
| `lat_g`               | real             | yes   | + right, − left                                                                   |
| `resultant_g`         | real             | yes   | generated: sqrt($long_{g}^2$ + $lat_{g}^2$); null if either is null               |
| `yaw_rate`            | real             | yes   | degree/s, turning right: +, turning left: -                                       |
| `uptime`              | integer          | yes   | seconds since boot                                                                |
| `status_bits`         | smallint         | yes   | see the status bits table                                                         |
| `latitude`            | double precision | yes   | null when there is no fix                                                         |
| `longitude`           | double precision | yes   | null when there is no fix                                                         |
| `elevation`           | real             | yes   | metres                                                                            |
| `sats`                | smallint         | yes   | satellites, parsed from the `sats:N` status text                                  |
| `step_distance_m`     | real             | yes   | metres since the previous row = speed / 3.6 $\times$ seconds; set by the ingester |
| `trip_id`             | bigint           | yes   | foreign key to `trips.id`, set by the ingester                                    |

- Use the following command to create the migration file:

```bash
# node runner to create migration file ( trips table )
# INFO: need to run command inside of `server` directory
npx knex migrate:make create_samples_table
```

- Running the above command; I see something like this:

```console
npm notice run server@1.0.0 npx
npm notice run 'knex' migrate:make create_samples_table
◇ injected env (4) from .env
Created Migration: /home/username/GitHub/car-tracker-rater/server/db/migrations/20261017214553_create_samples_table.js
```

- Create the actual `server/db/migrations/*_create_sample_table.js` file:

```js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// creation of 'samples' table --> basically a copy of ThingSpeak
exports.up = async function (knex) {
  await knex.schema.createTable("samples", (table) => {
    // primary key for 'trips' table ==> `bigint` auto-increment
    table.bigIncrements("id");

    // time of the sample ( UTC, from ThingSpeak ) ==> unique so 'sync' can run twice safely
    table.timestamp("created_at", { useTz: true }).notNullable().unique();

    // ThingSpeak's own row number
    table.integer("thingspeak_entry_id");

    // field1 ==> speed
    table.float("speed");

    // field2 ==> longitudinal G ( + --> acceleration, - --> braking )
    table.float("long_g");

    // field3 ==> lateral G ( + --> turning right, − --> turning left )
    table.float("lat_g");

    // field4 ==> yaw rate ( + --> turning right, - --> turning left )
    table.float("yaw_rate");

    // field5 ==> seconds since ESP32 boot
    table.integer("uptime");

    // field6 ==> status bits ( 1 = GPS talking, 2 = GPS fix, 4 = IMU responding )
    table.smallint("status_bits");

    // built-in ThingSpeak position ==> `null` when there was no GPS fix
    table.double("latitude");
    table.double("longitude");
    table.float("elevation");

    // satellite count ==> parsed from the 'status' text `sats:N`
    table.smallint("sats");

    // distance since the previous row ==> set by 'sync'
    table.float("step_distance_m");

    // trip this sample belongs to ==> set by 'sync'
    // WARNING: `SET NULL` on delete
    // 'trips' is only a cache ==> removing trip must never delete raw samples
    table
      .bigInteger("trip_id")
      .references("id")
      .inTable("trips")
      .onDelete("SET NULL");

    // speeds up "all samples of one trip, in time order"
    table.index(["trip_id", "created_at"]);
  });

  // generated `resultant_g` column
  // NOTE: no Knex.js helper function ==> need to perform calculations manually
  await knex.raw(`
    ALTER TABLE samples
      ADD COLUMN resultant_g real
      GENERATED ALWAYS AS (sqrt(long_g * long_g + lat_g * lat_g)) STORED
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// deletion of 'samples' table
exports.down = function (knex) {
  // delete the 'samples' table when `.down` called
  return knex.schema.dropTableIfExists("samples");
};
```

- Actually _migrate_ / create the table and check Neon console:

```bash
# create the database table over at Neon
# INFO: need to run command inside of `server` directory
npx knex migrate:latest
```

> [!TIP]
>
> - Running the above `migrate:latest` command I do get the following output:
>
> ```console
> npm notice run server@1.0.0 npx
> npm notice run 'knex' migrate:latest
> ◇ injected env (4) from .env
> Batch 2 run: 1 migrations
> ```

#### Places Table

| Column      | Type                       | Notes                                                                                 |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `id`        | bigint identity            | primary key                                                                           |
| `label`     | text, not null             | name shown to the user, e.g. "Home", "University of Mauritius"                        |
| `latitude`  | double precision, not null | centre of the place                                                                   |
| `longitude` | double precision, not null | centre of the place                                                                   |
| `radius_m`  | integer, not null          | how close (in metres) counts as "at" this place, e.g. 200 for a house, 800 for campus |

- Use the following command to create the migration file:

```bash
# node runner to create migration file ( trips table )
# INFO: need to run command inside of `server` directory
npx knex migrate:make create_places_table
```

- Create the actual `server/db/migrations/*_create_places_table.js` file:

```js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// creation of 'places' table --> personal named places ( Home, University, ... )
exports.up = function (knex) {
  return knex.schema.createTable("places", (table) => {
    // primary key for 'trips' table ==> `bigint` auto-increment
    table.bigIncrements("id");

    // name shown on a trip ==> "Home", "University of Mauritius"
    table.text("label").notNullable();

    // centre of the place ==> define the location
    table.double("latitude").notNullable();
    table.double("longitude").notNullable();

    // metres around the centre that count as "at" this place
    // INFO: basically destination perimeter --> like the size of the area
    table.integer("radius_m").notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// deletion of 'places' table
exports.down = function (knex) {
  // delete the 'places' table when `.down` called
  return knex.schema.dropTableIfExists("places");
};
```

- Actually _migrate_ / create the table and check Neon console:

```bash
# create the database table over at Neon
# INFO: need to run command inside of `server` directory
npx knex migrate:latest
```

> [!TIP]
>
> - Running the above `migrate:latest` command I do get the following output:
>
> ```console
> npm notice run server@1.0.0 npx
> npm notice run 'knex' migrate:latest
> ◇ injected env (4) from .env
> Batch 3 run: 1 migrations
> ```

### Adding User and Devices Table

Initially, I was thinking that we can simply have a simple "_lockscreen_" type of page on our front-end as I was not planning to host it at all.

But given the nature of the project and I also want to show that this project should be scalable. I think I am going to use [Vercel](https://vercel.com/) to host the project and always be available online.

Thus, we are going to have to update the initial plan in order to include a `users` and `devices` table.

Well the `users` table is going to handle user-related stuff like **registration** and **logins** while the `devices` table is going to handle things like ThingSpeak channel ID and 'read' API keys.

#### Users Table

| Column          | Type                   | Notes                                            |
| --------------- | ---------------------- | ------------------------------------------------ |
| `id`            | bigint identity        | primary key                                      |
| `username`      | text, not null, unique | login name "lowercased" by the app before saving |
| `email`         | text, not null, unique | contact address "lowercased" by the app          |
| `password_hash` | text, not null         | bcrypt hash the password itself is never stored  |
| `created_at`    | timestamptz, not null  | defaults to now ( UTC )                          |

- Use the following command to create the migration file:

```bash
# node runner to create migration file ( trips table )
# INFO: need to run command inside of `server` directory
npx knex migrate:make create_users_table
```

- Create the actual `server/db/migrations/*_create_users_table.js` file:

```js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// creation of 'users' table ==> one row per registered account
exports.up = function (knex) {
  return knex.schema.createTable("users", (table) => {
    // primary key for 'users' table ==> `bigint` auto-increment
    table.bigIncrements("id");

    // login name --> to be used for login
    // WARNING: lowecases the `username` behind the scences ==> "JoeMame" == "joemama"
    // additionally "unique" ==> only 1 user with that username is allowed
    table.text("username").notNullable().unique();

    // email address --> to be provided during registration
    // WARNING: lowecases the `email` behind the scences ==> "SomeHoe@email.domain" == "somehoe@email.domain"
    // additionally "unique" ==> only 1 user with that username is allowed
    table.text("email").notNullable().unique();

    // `bcrypt` to hash user's password ==> password will not be seen by database administrator
    table.text("password_hash").notNullable();

    // when the account was created
    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
};

// deletion of 'users' table
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// deletion of 'users' table
exports.down = function (knex) {
  // delete the 'users' table when `.down` called
  return knex.schema.dropTableIfExists("users");
};
```

- Actually _migrate_ / create the table and check Neon console:

```bash
# create the database table over at Neon
# INFO: need to run command inside of `server` directory
npx knex migrate:latest
```

> [!TIP]
>
> - Running the above `migrate:latest` command I do get the following output:
>
> ```console
> npm notice run server@1.0.0 npx
> npm notice run 'knex' migrate:latest
> ◇ injected env (4) from .env
> Batch 4 run: 1 migrations
> ```

#### Devices Table

| Column                  | Type                      | Notes                                          |
| ----------------------- | ------------------------- | ---------------------------------------------- |
| `id`                    | bigint identity           | primary key                                    |
| `user_id`               | bigint, not null          | FK --> `users.id`, `ON DELETE CASCADE` indexed |
| `label`                 | text, not null            | name shown to the user, e.g. "Mazda 3"         |
| `thingspeak_channel_id` | integer, not null, unique | the channel `sync` pulls from                  |
| `read_key_encrypted`    | text, not null            | thingSpeak read key                            |
| `created_at`            | timestamptz, not null     | defaults to now ( UTC )                        |

- Use the following command to create the migration file:

```bash
# node runner to create migration file ( trips table )
# INFO: need to run command inside of `server` directory
npx knex migrate:make create_devices_table
```

- Create the actual `server/db/migrations/*_create_devices_table.js` file:

```js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// creation of 'devices' table --> one row per ThingSpeak channel ( owned by a 'user' )
exports.up = function (knex) {
  return knex.schema.createTable("devices", (table) => {
    // primary key for 'devices' table ==> `bigint` auto-increment
    table.bigIncrements("id");

    // foreign keys "connecting" `users` table with `devices` table
    // INFO: `CASCADE` means that deleting a 'user' will delete all related devices
    table
      .bigInteger("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    // name shown to the user --> "Mazda 3"
    table.text("label").notNullable();

    // ThingSpeak channel number
    table.integer("thingspeak_channel_id").notNullable().unique();

    // ThingSpeak 'READ' key, encrypted so as database administrator cannot see it
    table.text("read_key_encrypted").notNullable();

    // when the device was added / created
    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    // speeds up "all devices of one user"
    table.index("user_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// deletion of 'devices' table
exports.down = function (knex) {
  // delete the 'devices' table when `.down` called
  return knex.schema.dropTableIfExists("devices");
};
```

- Actually _migrate_ / create the table and check Neon console:

```bash
# create the database table over at Neon
# INFO: need to run command inside of `server` directory
npx knex migrate:latest
```

> [!TIP]
>
> - Running the above `migrate:latest` command I do get the following output:
>
> ```console
> npm notice run server@1.0.0 npx
> npm notice run 'knex' migrate:latest
> ◇ injected env (4) from .env
> Batch 5 run: 1 migrations
> ```

#### Update Previous Tables

Given that we have made changes to how the _base_ application works... We are going to have to update our `trips`, `samples` and `places` tables in order to add "_associated_" `user`.

| Table     | Change                                                                  | Notes                                                                                                     |
| --------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `samples` | new `device_id` bigint, not null                                        | FK → `devices.id`, `ON DELETE CASCADE`                                                                    |
| `samples` | unique key on `created_at` replaced by unique `(device_id, created_at)` | Timestamps are unique per device, so two users can't block each other; `sync` stays idempotent per device |
| `trips`   | new `device_id` bigint, not null                                        | FK → `devices.id`, `ON DELETE CASCADE`; index `(device_id, started_at)`                                   |
| `places`  | new `user_id` bigint, not null                                          | FK → `users.id`, `ON DELETE CASCADE`; indexed. Places belong to a person, not a device                    |

- Use the following command to create the migration file:

```bash
# node runner to create migration file ( trips table )
# INFO: need to run command inside of `server` directory
npx knex migrate:make add_ownership_to_existing_tables
```

- Create the actual `server/db/migrations/*_add_ownership_to_existing_table.js` file:

```js
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// ownership --> ( every sample and trip belongs to a device ) and ( every place belongs to a user )
// WARNING: new columns are set to 'NOT NULL' ==> this only works while 'samples', 'trips' and 'places' are
exports.up = async function (knex) {
  await knex.schema.alterTable("samples", (table) => {
    // foreign keys "connecting" `devices` table with `samples` table
    // INFO: `CASCADE` means that deleting a 'device' will delete all related 'samples'
    table
      .bigInteger("device_id")
      .notNullable()
      .references("id")
      .inTable("devices")
      .onDelete("CASCADE");

    // NOTE: timestamps are now unique PER DEVICE, not globally
    // meaning that two users logging in the same second must not block each other
    table.dropUnique(["created_at"]);
    table.unique(["device_id", "created_at"]);
  });

  await knex.schema.alterTable("trips", (table) => {
    // foreign keys "connecting" `devices` table with `trips` table
    // INFO: `CASCADE` means that deleting a 'device' will delete all related 'trips'
    table
      .bigInteger("device_id")
      .notNullable()
      .references("id")
      .inTable("devices")
      .onDelete("CASCADE");

    // speeds up "latest trips of a device"
    table.index(["device_id", "started_at"]);
  });

  await knex.schema.alterTable("places", (table) => {
    // foreign keys "connecting" `user` table with `places` table
    // INFO: `CASCADE` means that deleting a 'user' will delete all related 'places'
    table
      .bigInteger("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    // speeds up "all places of one user"
    table.index("user_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// remove all foreigns key created above in `.up`
exports.down = async function (knex) {
  await knex.schema.alterTable("places", (table) => {
    // drop the "all places of one user" index first then the 'users' foreign key `user_id`
    table.dropIndex("user_id");
    table.dropColumn("user_id");
  });

  await knex.schema.alterTable("trips", (table) => {
    // drop the "latest trips of a device" index first then the 'devices' foreign key `device_id`
    table.dropIndex(["device_id", "started_at"]);
    table.dropColumn("device_id");
  });

  // drop the per-device uniqueness first then the 'devices' foreign key `device_id`
  await knex.schema.alterTable("samples", (table) => {
    table.dropUnique(["device_id", "created_at"]);
    table.dropColumn("device_id");
  });

  // restore the old global unique key
  await knex.schema.alterTable("samples", (table) => {
    table.unique(["created_at"]);
  });
};
```

- Actually _migrate_ / create the table and check Neon console:

```bash
# create the database table over at Neon
# INFO: need to run command inside of `server` directory
npx knex migrate:latest
```

> [!TIP]
>
> - Running the above `migrate:latest` command I do get the following output:
>
> ```console
> npm notice run server@1.0.0 npx
> npm notice run 'knex' migrate:latest
> ◇ injected env (4) from .env
> Batch 6 run: 1 migrations
> ```

> [!TIP]
> We can now run the command below to check if all of our migrations that we created ( _or "migrated"_ ) has actually been applied.
>
> - Run the following command inside the `server/` directory to check for migrations:
>
> ```bash
> # list out all the completed migrations
> # NOTE: we should have 6 completed migrations
> npx knex migrate:list
> ```
>
> - Hence, in my case, I get the following output:
>
> ```console
> npm notice run server@1.0.0 npx
> npm notice run 'knex' migrate:list
> ◇ injected env (4) from .env
> Found 6 Completed Migration file/files.
> 20261017210112_create_trips_table.js
> 20261017214553_create_samples_table.js
> 20261017220515_create_places_table.js
> 20261018082743_create_users_table.js
> 20261018084253_create_devices_table.js
> 20261018085540_add_ownership_to_existing_tables.js
> No Pending Migration files Found.
> ```

## Express.js Server

### The Constants File

We are now going to create the `server/config/index.js` which is going to basically hold all the constants for the project!

- Add the following code to the `index.js` file:

```js
// make this peice of code available to other files
module.exports = {
  // harsh-event threshold ==> same value for hard acceleration, hard braking and hard cornering
  eventThresholdG: 0.3,

  // trip splitting ==> a gap bigger than this between two rows starts a new trip
  tripGapMs: 5 * 60 * 1000,

  // trip closing ==> a trip is closed when its newest row is older than this
  tripCloseWaitMs: 3 * 60 * 1000,

  // hardware status ==> newest row older than this means the ESP32 is offline
  offlineAfterMs: 60 * 1000,

  // how often 'sync' runs
  syncIntervalMs: 30 * 1000,

  // ThingSpeak returns at most this many rows per read
  thingspeakMaxRows: 8000,

  // scoring ==> event rate ( events per 10 km ) that gives a score of 0
  // WARNING: using placeholder value '5' ==> needs to be calibrated on real drives
  // rough drives = 0-3, good normal drives = 4-7, smooth drives = 8-10
  rBad: 5,

  // rating cut-offs on the 0-10 score
  // INFO:
  // 1. below `badBelow` ==> Bad
  // 2. below `goodFrom``==> Normal
  // 3. else Good )
  badBelow: 4,
  goodFrom: 8,

  // trips shorter than this get the rating "Not enough data"
  minTripDistanceKm: 1,
};
```

> [!WARNING]
> For the `rBad` variable, this value **cannot** be set simply by using an _online value_ or _calculated value_.
>
> This `rBad` variable needs to be actually updated during **real drives**!
>
> > This is something that needs to be felt and **not** _calcualted_

> [!WARNING]
> The `rBad` _value_ **cannot** be set from an _online value_ or a _calculated value_.
>
> It has to be _calibrated_ on **real drives**, and it is a judgement call ( _based on a "feeling"_ ).
>
> Its basically the number of **harsh events per 10 km** that gives a _score_ of **0**.
>
> > A small `rBad` is a strict scale, a large `rBad` is a forgiving one.
>
> How to set it:
>
> 1. Tune `eventThresholdG` first.
>
> - Always calibrate `rBad` **after** the threshold, because a **lower** threshold produces _more events_.
>
> 1. Record 2 to 3 **smooth** trips and 2 to 3 **rough** trips ( _5 km or more each_ ).
> 2. For each trip compute $rate = events / (distance_{km} / 10)$`.
> 3. Pick `rBad` between $5 × smooth_rate$ ( _smooth trips score 8 or more_ ) and $rough_rate / 0.7$ ( _rough trips score 3 or less_ ).
> 4. If that range is empty, the threshold is not separating the drives. Go back to step 1.
> 5. Change the value in `server/config/index.js`, restart the server and **rebuild all trips**. Old scores were computed with the old value.

### Main Server File

We are now going to create / write the `app.js` which is the one file that is going to be _sourced_ when we run the `npm run dev` command inside our `server` directory to actually start the back-end.

- Here is the initial code that we are going to use which will start our server in order test it out:

```js
// WARNING: remove in production ==> for development purposes
console.log(
  `\n\n\t-- Server Started At: ${new Date().toLocaleTimeString()} --\n\n`,
);

// import the data found in our `.env` file
// NOTE: loaded first so every file required below can already read 'process.env'
require("dotenv").config();

// import the 'express' and 'cors' libraries
const express = require("express");
const cors = require("cors");

// create the actual 'express' application / server
const app = express();

// define the port ( default to environment variable or '5000' )
const PORT = process.env.PORT || 5000;

// define the middleware with 'cors' ==> allow front-end to communicate with back-end
// NOTE: only needed for the web app ( browsers enforce CORS ) --> the Flutter app is not affected
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// convert front-end data into JS object
app.use(express.json());

// test route --> to check if server is running correctly
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// error handler --> must come after the routes
// NOTE: Express.js 5 sends errors thrown inside 'async' handlers here automatically
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

// start the server
// NOTE: '0.0.0.0' ==> listen on all network interfaces so the mobile app can reach it not only 'localhost'
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on 'http://localhost:${PORT}'`);
});
```

#### Update Package JSON File

In order to actually _run_ the development server; we are going to have to modify the `server/package.json` file whereby we are going to update the `script` in order to add `dev` and `start`.

- Hence, update your `package.json`'s **script** section with the following:

```json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "nodemon app.js",
    "start": "node app.js"
  },
```

> [!TIP]
> Therefore, if you start the server. Open another terminal / [TMUX](https://github.com/tmux/tmux) pane and use the following command below to _run_ it
>
> ```bash
> # start the development server ( with `nodemon` )
> npm run dev
> ```
>
> - You should see something like this:
>
> ```console
> npm notice run server@1.0.0 dev
> npm notice run nodemon app.js
> [nodemon] 3.1.14
> [nodemon] to restart at any time, enter `rs`
> [nodemon] watching path(s): *.*
> [nodemon] watching extensions: js,mjs,cjs,json
> [nodemon] starting `node app.js`
>
>
>  -- Server Started At: 15:06:35 --
>
>
> ◇ injected env (4) from .env
> Server running on 'http://localhost:5000'
> ```

> [!NOTE]
> Open up your browser and simply head over to the following URL in order to check that everything is being run as expected:
>
> ```console
> http://localhost:5000/health
> ```
>
> - Upon opening you should see that you have a **response** that looks like this ( _without 'Pretty print'_ ):
>
> ```console
> {"ok":true}
> ```

## Encryption

> [!NOTE]
> The encryption algorithm that was used is called the [AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) encryption algorithm.
>
> > Refer to 'Computer Security' module for more information!

### Create Encryption Key

- Head inside the `server/` directory and run the following command to create the encryption key:

```bash
# create the encrytion key for encrypting ThingSpeak 'read' API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- Running the above command; you should see that we get something like this:

```console
a7f3c91e5b2d8046f1a9e7c3d6b08f425e9a1c7d3f6b8042c5e8a9d1f7b3064e
```

> [!IMPORTANT]
> This means that we can _populate_ the `ENCRYPTION_KEY` variable inside our actual `.env` environment variable file like so:
>
> ```
> # encryption key to use for encrypting user's ThingSpeak 'read' key
> ENCRYPTION_KEY=a7f3c91e5b2d8046f1a9e7c3d6b08f425e9a1c7d3f6b8042c5e8a9d1f7b3064e
> ```

### Create Encryption Service

- Go ahead and create the `server/services/encryption.js` file which is going to contain functions to **encrypt** and **decrypt** 'read' ThingSpeak API key:

```js
// encrypts and decrypts the users' ThingSpeak read keys using 'AES-256-GCM'

// import the built-in 'crypto' library
const crypto = require("crypto");

// define the encryption ALGORITHM to be used ==> again in this case --> 'AES-256-GCM'
const ALGORITHM = "aes-256-gcm";

// NOTE: GCM "mode" works best with a 12-byte 'Initialisation Vector' ( IV )
const IV_LENGTH = 12;

// read the master key from '.env'
function getKey() {
  const hex = process.env.ENCRYPTION_KEY;

  // check if the length of encryption key generated is 64 characters in length
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters ( 32 bytes )");
  }

  // simply return the actual encryption key ( to be used by other functions )
  return Buffer.from(hex, "hex");
}

// encryption of plain text data to cipther text
function encrypt(plainText) {
  // create a new random IV each time
  // INFO: this is done to randomise the output for same text
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  // encrypt the plain text string with AES
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  // cryptographic fingerprint acting as tamper-detection system
  // INFO: this is done in order to verify data has not been changed
  const authTag = cipher.getAuthTag();

  // return the required data ( to be used by other functions )
  return [iv, authTag, encrypted]
    .map((part) => part.toString("base64"))
    .join(":");
}

// decryption of cipher text data to plain text
function decrypt(payload) {
  // split the data individually
  const [ivB64, tagB64, dataB64] = payload.split(":");

  // try to find the IV in order to create correct output
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64"),
  );

  // check for tampering of data
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  // decrypt the cipher text into plain text
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);

  // simply return the plain text to the program
  return decrypted.toString("utf8");
}

// make the 2 functions available to other files
module.exports = { encrypt, decrypt };
```

#### Test Encryption Algorithm

- Create a `server/test-encryption.js` file so that we can perform a quick **encryption** and **decryption** test:

```js
// import the data found in our `.env` file
require("dotenv").config();

// import the `encrypt` and `decrypt` from the `server/encryption.js` file
const { encrypt, decrypt } = require("./services/encryption");

// create the plain text string
const secret = "FAKEREADKEY12345";

// encrypt the plain text using the imported function
const packed = encrypt(secret);

console.log("encrypted:", packed);

// 1. round trip ==> should print true
console.log("round trip ok:", decrypt(packed) === secret);

// 2. random IV ==> encrypting the same text twice should give different output --> so print true
console.log("different each time:", encrypt(secret) !== packed);

// 3. tampering ==> changing one character must make decrypt throw
try {
  const [iv, tag, data] = packed.split(":");
  const broken = [iv, tag, "A" + data.slice(1)].join(":");
  decrypt(broken);
  console.log("tamper test: FAILED ( it decrypted )");
} catch (err) {
  console.log("tamper test ok:", err.message);
}
```

- Hence running the above file using `node test-encryption.js`, we should see that we have something like this:

```console
◇ injected env (6) from .env
encrypted: OiMSmADeVYDOwqpb:mCDaqQFoTZrDp1OM1hkOaw==:Sj8jYofX3IhIzsXRVUYEYQ==
round trip ok: true
different each time: true
tamper test ok: Unsupported state or unable to authenticate data
```

> [!IMPORTANT]
> You should see that if you run the `node test-encryption.js` file over and over again. The value for the `encrypted` will change!
>
> - Running the file again, the output is different:
>
> ```console
> ◇ injected env (6) from .env
> encrypted: Xn/WskL/3cmC1Mzm:3rydpfRKGkl5X8H8Z01PEA==:3hlcS7A+/93SPfiPc6WmWQ==
> round trip ok: true
> different each time: true
> tamper test ok: Unsupported state or unable to authenticate data
> ```

## ThingSpeak Data

### Normalise ThingSpeak Data

We are now going to write the code that will **fetch** the data from ThingSpeak using the 'read' API key and stuff in order to **normalise** the data so we can work with it.

- Therefore, create a `server/services/thingspeak.js` file to read the data from ThingSpeak's database:

```js
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
```

#### Test ThingSpeak Data Fetching

- Create a `server/test-thingspeak.js` file in order to test the _fetching_ of data rows from ThingSpeak database:

```js
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
```

- Running the code **without** any argument(s):

```bash
# simply run the script without any arguments
node test-thignspeak.js
```

- Here is the output with **no** argument(s):

```console
rows: 1539
first two: [
  {
    created_at: '2026-10-16T11:34:02Z',
    thingspeak_entry_id: 1,
    speed: 0.5,
    long_g: 0.001,
    lat_g: -0.001,
    yaw_rate: -0,
    uptime: 21,
    status_bits: 7,
    latitude: <redacted>,
    longitude: <redacted>,
    elevation: <redacted>,
    sats: 9
  },
  {
    created_at: '2026-10-16T11:34:03Z',
    thingspeak_entry_id: 2,
    speed: 0.9,
    long_g: 0.001,
    lat_g: 0.001,
    yaw_rate: 0,
    uptime: 24,
    status_bits: 7,
    latitude: <redacted>,
    longitude: <redacted>,
    elevation: <redacted>,
    sats: 10
  }
]
last: {
  created_at: '2026-10-16T13:36:13Z',
  thingspeak_entry_id: 1539,
  speed: null,
  long_g: -0.384,
  lat_g: 0.294,
  yaw_rate: 35.6,
  uptime: 22,
  status_bits: 5,
  latitude: null,
  longitude: null,
  elevation: null,
  sats: 0
}
```

- Running the code **with** argument:

```bash
# simply run the script without any arguments
# WARNING: in this case I am running an "invalid" argument
node test-thignspeak.js 2026-10-17
```

- Here is the output **with** argument:

```console
◇ injected env (6) from .env
rows: 0
first two: []
last: undefined
```

> [!TIP]
> Well the last output it **good** as there is **no** data for '2026-10-17'!

> [!WARNING]
> If you see that you have the following output when you are running the `test-thingspeak.js` file with / without any arguments
>
> ```console
> ◇ injected env (6) from .env
> failed: ThingSpeak responded with status 404
> ```
>
> Make sure that you have:
>
> - Set your `THINGSPEAK_CHANNEL_ID`
> - Set your `THINGSPEAK_READ_KEY`

## Syncing ThingSpeak Data with Neon's Database Table

Given that we have been able to make a `GET` request with ThingSpeak's API and be able to normalise the data in order to be able to work with.

It is now the time to actually `GET` those data and therefore, populate the 'samples' database table that we have over in our Neon's project.

### Create Development User

Given that we **don't** have any [React](https://react.dev/) front-end right now. We are going to be a script that will create a _development user_ in order to bring the current _test_ data that I have in my ThingSpeak channel.

- Create the `scripts/seed-dev.js` directory and file:

```bash
# create the `scripts` directory and `seed-dev.js` file
# NOTE: this command needs to be run `server` directory
mkdir scripts && touch scripts/seed-dev.js
```

- Add the following code inside the `server/scripts/seed-dev.js` file:

```js
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
```

- Therefore, run the following command from the `server` directory in order to create the user:

```bash
# create "development" user
# NOTE: it's just a simple user that I am going to be deleting later
node scripts/seed-dev.js dev-user dev-user@email.com <dev-user-password>
```

> [!TIP]
> This is what I see when it has successfully added the 2 rows inside the 'user' and 'device' database tables.
>
> ```
> ◇ injected env (6) from .env
> ◇ injected env (0) from .env
> user: { id: '1', username: 'dev-user' }
> device: { id: '1', label: 'Mazda 3' }
> ```
>
> > I do also see that our `dev-user` and associated device has been created over at Neon's console!

### Create Synchronisation Code

Given that we have our `dev-user` inside our database, we will be able to sync up the data from ThingSpeak into our 'samples' database table.

- Hence, create the `server/services/sync.js` file:

```js
// INFO: this code will be able to take the data from ThingSpeak's database
// and then copy these data to our 'samples' database table

// create the database connection
const db = require("../db/knex");

// import all the data that we have inside the `config` directory ==> `index.js` "constants" file
const config = require("../config");
// import the `decrypt` function from the `services/encryption.js` file
const { decrypt } = require("./encryption");
// import the `fetchFeeds` function from `services/thingspeak.js`
const { fetchFeeds } = require("./thingspeak");

// how many rows go into one `INSERT` command
const INSERT_CHUNK = 500;

// newest sample already saved for this device ( null for a new device )
async function getNewestCreatedAt(deviceId) {
  const row = await db("samples")
    .where({ device_id: deviceId })
    .max("created_at as newest")
    .first();
  return row?.newest ?? null;
}

async function syncDevice(device) {
  // check for the newest row
  const newest = await getNewestCreatedAt(device.id);

  // decryption of 'read' API key in memory
  // WARNING: only in memory so as to not leak it
  const readKey = decrypt(device.read_key_encrypted);

  // try to fetch new data that is available
  const feeds = await fetchFeeds({
    channelId: device.thingspeak_channel_id,
    readKey,
    after: newest,
  });

  // take the returned "newest" rows from ThingSpeak
  const rows = feeds
    .filter((row) => !newest || new Date(row.created_at) > newest)
    .map((row) => ({ ...row, device_id: device.id }));

  // start inserting these new data inside of the 'samples' table
  let inserted = 0;
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const result = await db("samples")
      .insert(rows.slice(i, i + INSERT_CHUNK))
      .onConflict(["device_id", "created_at"])
      .ignore()
      .returning("id");
    inserted += result.length;
  }

  // simply return the number of rows inserted
  return { fetched: feeds.length, inserted };
}

// WARNING: guard ==> a slow run must not overlap with the next timer tick
let running = false;

// sync every device one after the other
async function syncAll() {
  // a run is already in progress ==> skip this timer tick ( see guard above )
  if (running) return;

  // take the guard ==> we are now running a sync
  running = true;

  try {
    // get all the devices ( only the columns needed by 'syncDevice' )
    const devices = await db("devices").select(
      "id",
      "thingspeak_channel_id",
      "read_key_encrypted",
    );

    // sync the devices one at a time
    for (const device of devices) {
      try {
        const result = await syncDevice(device);

        // only log when there are actually new rows
        if (result.inserted > 0) {
          console.log(
            `sync: device ${device.id} ==> ${result.inserted} new rows`,
          );
        }
      } catch (err) {
        console.error(`sync failed for device ${device.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error("sync failed:", err.message);
  } finally {
    // release the guard no matter what ==> else 'syncAll' would never run again
    running = false;
  }
}

// catch up once at startup, then repeat on a timer
function startSync() {
  syncAll();
  setInterval(syncAll, config.syncIntervalMs);
}

// make these functions available to other files
module.exports = { syncDevice, syncAll, startSync };
```

#### Test Synchronisation

- Create a `server/test-sync.js` file in order to _try_ to to sync up the ThingSpeak database with our 'samples' database table:

```js
// import the data found in our `.env` file
require("dotenv").config();

// import the `knex.js` file to create database connection
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
```

- Hence use the following command in order to _run_ the program:

```bash
# run the command to populate the 'samples' table
node test-sync.js
```

- In my case, running it for the **first** time, I get the following output:

```console
◇ injected env (6) from .env
◇ injected env (0) from .env
sync: device 1 ==> 1539 new rows
rows in samples: 1539
```

- Running it for the **second** time, I get the following output:

```console
◇ injected env (6) from .env
◇ injected env (0) from .env
rows in samples: 1539
```

> [!TIP]
>
> - Running the following SQL query inside of Neon's console:
>
> ```sql
> SELECT COUNT(id) FROM samples;
> ```
>
> > I do see that we have all the 1539 rows that has been added!

> [!NOTE]
> On the 21th October 2026, I gathered some more data and hence I am going to run the `test-sync.js` file again in order to add all of the **new** rows into the 'samples' database table.
>
> ```console
> ◇ injected env (6) from .env
> ◇ injected env (0) from .env
> sync: device 1 ==> 1383 new rows
> rows in samples: 2922
> ```

## Scoring and Trips

### Scoring

- Add the following constant to stop long gaps from being counted to the `server/config/index.js` file:

```js
  // `distance per row = speed * time` since the previous row --> but time is capped at this
  // NOTE: stops a long gap from being counted as driving at the last speed
  maxStepSeconds: 5,
```

- Create `server/services/scoring.js` for the scoring system for each of the trip / drive that the user does:

```js
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
```

### Trips

We now need to populate the 'trips' database table from our data found in the 'samples' table.

- Hence, create the `server/services/trips.js` file:

```js
// turns raw 'samples' into trips: assigns 'trip_id', computes distance, closes finished trips, scores them

// create the database connection
const db = require("../db/knex");
// import the required constants from the `config/index.js` file
const config = require("../config");
// import the required functions from the `services/scoring.js` file
const { detectEvents, scoreTrip } = require("./scoring");

// start sampling ==> adding to database when ESP32 boots up or has a reboot
// INFO: calibration does not add any new rows!
async function assignTrips(deviceId) {
  // enforce transaction rules ==> a crash halfway must never leave samples half-assigned
  return db.transaction(async (trx) => {
    // every sample of this device that does not belong to a trip yet ( oldest first )
    const unassigned = await trx("samples")
      .where({ device_id: deviceId })
      .whereNull("trip_id")
      .orderBy("created_at")
      .select("id", "created_at", "uptime");

    // nothing new to assign ==> stop early
    if (unassigned.length === 0) return [];

    // last already-assigned sample before the first new one ( none for a brand new device )
    let previous =
      (await trx("samples")
        .where({ device_id: deviceId })
        .whereNotNull("trip_id")
        .where("created_at", "<", unassigned[0].created_at)
        .orderBy("created_at", "desc")
        .first("id", "created_at", "uptime", "trip_id")) ?? null;

    // trip the next sample will join unless a break is found
    let currentTripId = previous ? previous.trip_id : null;
    // trip id ==> the sample ids that belong to it ( written back in one go after the loop )
    const idsByTrip = new Map();

    for (const row of unassigned) {
      // time since the previous sample ( 0 when there is none )
      // INFO: `Date - Date` gives the difference in milliseconds
      const gapMs = previous ? row.created_at - previous.created_at : 0;

      // ESP32 lost power / rebooted ==> `uptime` went backwards
      // INFO: even a short gap means a new trip when the board restarted
      const rebooted =
        previous &&
        previous.uptime !== null &&
        row.uptime !== null &&
        row.uptime < previous.uptime;

      // no previous sample, a gap longer than 'tripGapMs' or a reboot ==> start a new trip
      if (!previous || gapMs > config.tripGapMs || rebooted) {
        const [trip] = await trx("trips")
          .insert({ device_id: deviceId, started_at: row.created_at })
          .returning("id");
        currentTripId = trip.id;
      }

      // file this sample under the trip it belongs to
      if (!idsByTrip.has(currentTripId)) idsByTrip.set(currentTripId, []);
      idsByTrip.get(currentTripId).push(row.id);

      // this row becomes the reference for the next iteration
      previous = { ...row, trip_id: currentTripId };
    }

    // write the assignments back, one trip at a time
    for (const [tripId, ids] of idsByTrip) {
      // update in batches so a single query does not get too large
      for (let i = 0; i < ids.length; i += 1000) {
        await trx("samples")
          .whereIn("id", ids.slice(i, i + 1000))
          .update({ trip_id: tripId });
      }
    }

    // trips that were touched ( newly created or extended )
    return [...idsByTrip.keys()];
  });
}

// find the steps for whole trip everytime
// INFO: rows without speed ==> + 0 m --> as not GPS fix
async function recomputeSteps(tripId) {
  // one `UPDATE ... FROM` sets `step_distance_m` for every sample of the trip in one query
  await db.raw(
    `
    UPDATE samples AS s
    SET step_distance_m = x.step
    FROM (
      SELECT id,
             CASE
               WHEN LAG(created_at) OVER w IS NULL THEN 0
               ELSE COALESCE(speed, 0) / 3.6
                    * LEAST(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER w)), ?::numeric)
             END AS step
      FROM samples
      WHERE trip_id = ?::bigint
      WINDOW w AS (ORDER BY created_at)
    ) AS x
    WHERE s.id = x.id
    `,
    // bind parameters ==> the cap on the time gap, then the trip to recompute
    [config.maxStepSeconds, tripId],
  );
}

// INFO: "strongest" values are always positive --> a trip with no hard braking has 0, not a negative number
const positive = (value) => (value === null ? null : Math.max(0, value));

// close the trip in order to summarise and create the score for the trip
async function finalizeTrip(tripId) {
  // make sure `step_distance_m` is up to date before summing the distance
  await recomputeSteps(tripId);

  // summarise the whole trip in one aggregate query
  const agg = await db("samples")
    .where({ trip_id: tripId })
    .select(
      // trip boundaries ( first and last sample )
      db.raw("min(created_at) as started_at"),
      db.raw("max(created_at) as ended_at"),
      // total distance ==> sum of the per-row steps
      db.raw("coalesce(sum(step_distance_m), 0) as distance_m"),
      // strongest speed
      db.raw("max(speed) as max_speed"),
      // strongest acceleration ( highest positive 'long_g' )
      db.raw("max(long_g) as max_accel_g"),
      // strongest braking ==> 'min' is negative so negate it to stay positive
      db.raw("-min(long_g) as max_brake_g"),
      // strongest right turn ( highest positive 'lat_g' )
      db.raw("max(lat_g) as max_right_g"),
      // strongest left turn ==> 'min' is negative so negate it to stay positive
      db.raw("-min(lat_g) as max_left_g"),
      // strongest overall force felt
      db.raw("max(resultant_g) as max_resultant_g"),
    )
    .first();

  // trip has no samples ==> nothing to summarise
  if (!agg || !agg.started_at) return;

  // first sample with a GPS fix ==> start position of the trip
  const first = await db("samples")
    .where({ trip_id: tripId })
    .whereNotNull("latitude")
    .orderBy("created_at", "asc")
    .first("latitude", "longitude");

  // last sample with a GPS fix ==> end position of the trip
  const last = await db("samples")
    .where({ trip_id: tripId })
    .whereNotNull("latitude")
    .orderBy("created_at", "desc")
    .first("latitude", "longitude");

  // every G reading of the trip ( oldest first ) ==> used to count the hard events
  const rows = await db("samples")
    .where({ trip_id: tripId })
    .orderBy("created_at")
    .select("long_g", "lat_g");

  // score comes from the number of hard events spread over the distance
  // INFO: 'scoreTrip' returns null when the trip is too short to judge
  const events = detectEvents(rows);
  const score = scoreTrip({
    eventCount: events.length,
    distanceKm: agg.distance_m / 1000,
  });

  // write the summary back onto the trip row
  await db("trips")
    .where({ id: tripId })
    .update({
      // boundaries, distance and strongest speed
      started_at: agg.started_at,
      ended_at: agg.ended_at,
      distance_m: agg.distance_m,
      max_speed: agg.max_speed,
      // made positive with the 'positive' helper above
      max_accel_g: positive(agg.max_accel_g),
      max_brake_g: positive(agg.max_brake_g),
      max_right_g: positive(agg.max_right_g),
      max_left_g: positive(agg.max_left_g),
      max_resultant_g: agg.max_resultant_g,
      // overall trip score
      score,
      // start and end position ( null when the trip had no GPS fix )
      start_latitude: first?.latitude ?? null,
      start_longitude: first?.longitude ?? null,
      end_latitude: last?.latitude ?? null,
      end_longitude: last?.longitude ?? null,
      // start_label / end_label: filled by the places lookup ( not written yet )
    });
}

// closes open trips whose newest sample is older than 'tripCloseWaitMs'
// also re-finalizes a CLOSED trip that just received late rows ==> hotspot dropout, uploaded later
async function processDevice(deviceId) {
  // assign any new samples to trips first ==> gives the trips that were touched
  const touched = await assignTrips(deviceId);

  // set of trip ids to finalize ( a 'Set' avoids finalizing the same trip twice )
  const toFinalize = new Set();

  // a CLOSED trip that just received late rows must be finalized again
  if (touched.length > 0) {
    const late = await db("trips")
      .whereIn("id", touched)
      .whereNotNull("ended_at")
      .select("id");
    late.forEach((trip) => toFinalize.add(trip.id));
  }

  // still-open trips ==> close the ones whose newest sample is old enough
  const openTrips = await db("trips")
    .where({ device_id: deviceId })
    .whereNull("ended_at")
    .select("id");
  for (const trip of openTrips) {
    // newest sample of the trip ==> tells us when the trip last saw data
    const { newest } = await db("samples")
      .where({ trip_id: trip.id })
      .max("created_at as newest")
      .first();
    // no new sample for longer than 'tripCloseWaitMs' ==> the trip is over
    if (newest && Date.now() - newest.getTime() > config.tripCloseWaitMs) {
      toFinalize.add(trip.id);
    }
  }

  // recompute the summary and score of every trip marked above
  for (const tripId of toFinalize) {
    await finalizeTrip(tripId);
  }
}

// recompute every closed trip of a device ==> run after changing the thresholds or 'rBad' in config
async function rebuildDevice(deviceId) {
  // only CLOSED trips are rebuilt ==> open trips are still changing and will be scored later
  const closed = await db("trips")
    .where({ device_id: deviceId })
    .whereNotNull("ended_at")
    .select("id");

  // re-run the summary + score for each closed trip
  for (const trip of closed) {
    await finalizeTrip(trip.id);
  }
}

// make these functions available to other files
module.exports = { processDevice, rebuildDevice, finalizeTrip };
```

- Update our `server/services/sync.js` file by hooking up the `trips.js` file:

```js
// INFO: this code will be able to take the data from ThingSpeak's database
// and then copy these data to our 'samples' database table

// create the database connection
const db = require("../db/knex");

// import all the data that we have inside the `config` directory ==> `index.js` "constants" file
const config = require("../config");
// import the `decrypt` function from the `services/encryption.js` file
const { decrypt } = require("./encryption");
// import the `fetchFeeds` function from `services/thingspeak.js` file
const { fetchFeeds } = require("./thingspeak");
// import the `processDevice` function from the `services/trips.js` file
const { processDevice } = require("./trips");

// how many rows go into one `INSERT` command
const INSERT_CHUNK = 500;

// newest sample already saved for this device ( null for a new device )
async function getNewestCreatedAt(deviceId) {
  const row = await db("samples")
    .where({ device_id: deviceId })
    .max("created_at as newest")
    .first();
  return row?.newest ?? null;
}

async function syncDevice(device) {
  // check for the newest row
  const newest = await getNewestCreatedAt(device.id);

  // decryption of 'read' API key in memory
  // WARNING: only in memory so as to not leak it
  const readKey = decrypt(device.read_key_encrypted);

  // try to fetch new data that is available
  const feeds = await fetchFeeds({
    channelId: device.thingspeak_channel_id,
    readKey,
    after: newest,
  });

  // take the returned "newest" rows from ThingSpeak
  const rows = feeds
    .filter((row) => !newest || new Date(row.created_at) > newest)
    .map((row) => ({ ...row, device_id: device.id }));

  // start inserting these new data inside of the 'samples' table
  let inserted = 0;
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const result = await db("samples")
      .insert(rows.slice(i, i + INSERT_CHUNK))
      .onConflict(["device_id", "created_at"])
      .ignore()
      .returning("id");
    inserted += result.length;
  }

  // simply return the number of rows inserted
  return { fetched: feeds.length, inserted };
}

// WARNING: guard ==> a slow run must not overlap with the next timer tick
let running = false;

// sync every device one after the other ==> new samples then the trips pipeline
async function syncAll() {
  // a run is already in progress ==> skip this timer tick ( see guard above )
  if (running) return;

  // take the guard ==> we are now running a sync
  running = true;

  try {
    // get all the devices ( only the columns needed by 'syncDevice' )
    const devices = await db("devices").select(
      "id",
      "thingspeak_channel_id",
      "read_key_encrypted",
    );

    // sync the devices one at a time
    for (const device of devices) {
      // one failing device must not stop the others ==> log it and retry on the next tick
      try {
        const result = await syncDevice(device);

        // turn the freshly inserted samples into trips ( assign, close, score )
        await processDevice(device.id);

        // only log when there are actually new rows
        if (result.inserted > 0) {
          console.log(
            `sync: device ${device.id} ==> ${result.inserted} new rows`,
          );
        }
      } catch (err) {
        console.error(`sync failed for device ${device.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error("sync failed:", err.message);
  } finally {
    // release the guard no matter what ==> else 'syncAll' would never run again
    running = false;
  }
}

// catch up once at startup, then repeat on a timer
function startSync() {
  syncAll();
  setInterval(syncAll, config.syncIntervalMs);
}

// make these functions available to other files
module.exports = { syncDevice, syncAll, startSync };
```

- Run the `node test-sync.js` file in order to populate the 'trips' database table:

```console
◇ injected env (6) from .env
◇ injected env (0) from .env
rows in samples: 2922
```

## Authentication - Register and Login

### JSON Web Tokens

- Create the 'JWT' secret key:

```bash
# create the JWT key for authentication purposes
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- Running the above command; you should see that we get something like this:

```console
a7f3c91e8b2d6045f1a9c7e3d8b4620f9e5a1c7d3b8f6042a6e9d1c5b7f8304a
```

> [!IMPORTANT]
> This means that we can _populate_ the `JWT_SECRET` variable inside our actual `.env` environment variable file like so:
>
> ```
> # JSON Web Tokens for user registrations and logins
> JWT_SECRET=<your-jwt-secret>
> ```

- Update the `server/config/index.js` file in order to add authentication constants:

```js
  // authentication --> register and login
  jwtExpiresIn: "7d",
  bcryptRounds: 10,
  minPasswordLength: 8,
```

### Middleware

- Create the `server/middleware/` directory:

```bash
# create the 'middleware' directory in to hold code for authentications
mkdir middleware && cd middleware
```

- Create the `server/middleware/auth.js` file:

```js
// import the `jsonwebtoken` library
const jwt = require("jsonwebtoken");

// Express.js middleware ==> runs before the route handler it protects
function authenticate(req, res, next) {
  // split the "Authorization" header into its scheme and its token
  // INFO: a missing header falls back to "" ==> `split` yields [''] so both parts are undefined
  const [scheme, token] = (req.headers.authorization || "").split(" ");

  // reject a missing header --> a wrong scheme or an empty token early
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    // check the signature and the expiry against the secret ==> throws when invalid or expired
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // the token holds the user's id ( not the `username` which could change )
    // INFO: `sub` is the JWT standard "subject" claim
    req.user = { id: payload.sub };

    // token is valid ==> hand control to the route handler
    next();
  } catch {
    // deliberately no error detail ==> a bad signature, expired or malformed all give the same 401
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// make the function available to other files
module.exports = { authenticate };
```

### Routes For Authentication

- Create the `server/routes/` directory:

```bash
# create the 'routes' directory in to hold code for handling the authentication
mkdir routes && cd routes
```

- Create the `server/routes/authRoutes.js` file:

```js
// register, login and "who am I"
// NOTE: there is no logout route ==> a token is stateless, so logging out = the client deletes its token

// import the 'express' library
const express = require("express");
// import the `bcryptjs` library
const bcrypt = require("bcryptjs");
// import the `jsonwebtoken` library
const jwt = require("jsonwebtoken");
// create the database connection
const db = require("../db/knex");
// import the `config/index.js` file in order to have access to constants
const config = require("../config");
// import the `authenticate` from `middleware/auth.js` file
const { authenticate } = require("../middleware/auth");

// router holding every '/api/auth' route
const router = express.Router();

// username ==> 3 - 30 characters --> lowercase letters, digits or '_' ( case handled by normalising )
const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
// email ==> basic "xx@yy.zz" check ( not the full email specification )
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// bcrypt only looks at the first 72 bytes of a password
// INFO: refuse longer ones instead of silently cutting them
const MAX_PASSWORD_LENGTH = 72;

// used when the username does not exist ==> so a wrong username and a wrong password take the same time
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", config.bcryptRounds);

// create a login token ==> 'sub' is the JWT standard "subject" claim ( holds the user id )
function signToken(user) {
  return jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, {
    expiresIn: config.jwtExpiresIn,
  });
}

// `POST /api/auth/register` ==> { username, email, password }
router.post("/register", async (req, res) => {
  // normalise once ==> 'Username' and 'username' are the same account
  const username = String(req.body.username ?? "")
    .trim()
    .toLowerCase();
  const email = String(req.body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password ?? "");

  // back-end validation --> validate all three fields before touching the database
  if (!USERNAME_PATTERN.test(username)) {
    return res.status(400).json({
      error: "Username must be 3-30 characters: letters, digits or _",
    });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  if (
    password.length < config.minPasswordLength ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return res.status(400).json({
      error: `Password must be ${config.minPasswordLength}-${MAX_PASSWORD_LENGTH} characters`,
    });
  }

  try {
    // hash the password ==> it is never stored in plain text
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // create the user, returning only the safe columns ( never the hash )
    const [user] = await db("users")
      .insert({ username, email, password_hash: passwordHash })
      .returning(["id", "username"]);

    // 201 = created ==> log them in straight away by returning a token
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    // 23505 = Postgres "unique violation" ( username or email already taken )
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Username or email already in use" });
    }
    // handled by the `server/app.js` file
    throw err;
  }
});

// `POST /api/auth/login` ==>  { username, password }
router.post("/login", async (req, res) => {
  const username = String(req.body.username ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password ?? "");

  // find the user by the normalised username
  const user = await db("users")
    .where({ username })
    .first("id", "username", "password_hash");

  // always run the comparison, even for an unknown username
  const passwordOk = await bcrypt.compare(
    password,
    user ? user.password_hash : DUMMY_HASH,
  );

  // one generic message ==> never reveal which usernames exist
  if (!user || !passwordOk) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  // success ==> return a fresh token and the public user fields
  res.json({
    token: signToken(user),
    user: { id: user.id, username: user.username },
  });
});

// `GET /api/auth/me`` ==> client check that its stored token is still valid
router.get("/me", authenticate, async (req, res) => {
  // load the current user from the id inside the token
  const user = await db("users")
    .where({ id: req.user.id })
    .first("id", "username", "email", "created_at");

  // the account was deleted after the token was issued
  if (!user) return res.status(401).json({ error: "User no longer exists" });

  // return the public fields ( no password hash )
  res.json(user);
});

// make the `router` available to other files
module.exports = router;
```

- Update the `server/app.js` file in order to have authentication routes:

> We have also added the `startSync` background task!

```js
// WARNING: remove in production ==> for development purposes
console.log(
  `\n\n\t-- Server Started At: ${new Date().toLocaleTimeString()} --\n\n`,
);

// import the data found in our `.env` file
// NOTE: loaded first so every file required below can already read 'process.env'
require("dotenv").config();

// fail fast ==> a missing secret should stop the server now --> not break a request later
for (const name of ["DATABASE_URL", "JWT_SECRET", "ENCRYPTION_KEY"]) {
  if (!process.env[name]) {
    throw new Error(`${name} is missing in .env`);
  }
}

// import the 'express' and 'cors' libraries
const express = require("express");
const cors = require("cors");

// background job that copies ThingSpeak rows into the database
const { startSync } = require("./services/sync.js");

// import our routers ==> uncomment each one when its file is created
const authRouter = require("./routes/authRoutes.js");

// create the actual 'express' application / server
const app = express();

// define the port ( default to environment variable or '5000' )
const PORT = process.env.PORT || 5000;

// define the middleware with 'cors' ==> allow front-end to communicate with back-end
// NOTE: only needed for the web app ( browsers enforce CORS ) --> the Flutter app is not affected
// NOTE: no 'credentials' ==> the token is sent in the 'Authorization' header, not in a cookie
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// convert front-end data into JS object
app.use(express.json());

// test route ==> proves the server is running
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// authentication routes ==>  register and login and me
app.use("/api/auth", authRouter);

// error handler --> must come after the routes
// NOTE: Express.js 5 sends errors thrown inside 'async' handlers here automatically
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

// start the server
// NOTE: '0.0.0.0' ==> listen on all network interfaces so the mobile app can reach it not only 'localhost'
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on 'http://localhost:${PORT}'`);
  startSync();
});
```

### Testing Authentication Endpoints

#### Register New User

- Run the following command to create new user:

```bash
# curl command to register a new user to 'username' table
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"<testuser-password>"}'
```

- The output of the above command is this:

```console
{"token":"<redacted>","user":{"id":"2","username":"testuser"}}
```

#### Register Same User Again

- Run the following command to create new user, again:

```bash
# curl command to register a new user to 'username' table, again
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"<testuser-password>"}'
```

- The output of the above command is this:

```console
{"error":"Username or email already in use"}
```

> [!WARNING]
> If we use something another username like `Testuser`... You should still see that we have the error!

#### Login

##### Login as 'testuser'

- Run the following command to login as the `testuser` user:

```bash
# curl command to login as the newly created user
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"<testuser-password>"}'
```

- The output of the above command is this:

```console
{"token":"<redacted>","user":{"id":"2","username":"testuser"}}
```

##### Login As 'dev-user'

> [!WARNING]
> Need to re-run the `scrips/seed-dev.js` script as we need to create the **hashed password** for the `dev-user` user.
>
> ```bash
> # re-run the command to generate hash for password
> node scripts/seed-dev.js dev-user dev-user@email.com <dev-user-password>
> ```
>
> - You should see that we have something like this again:
>
> ```console
> ◇ injected env (6) from .env
> ◇ injected env (0) from .env
> user: { id: '1', username: 'dev-user' }
> device: { id: '1', label: 'Mazda 3' }
> ```

- Run the following command to login as the `dev-user` user:

```bash
# curl command to login as the `dev-user` user
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dev-user","password":"<dev-user-password>"}'
```

- The output of the above command is this:

```console
{"token":"<redacted>","user":{"id":"1","username":"dev-user"}}
```

#### Wrong Password

- Run the following command to login as the `dev-user` user:

```bash
# curl command to login as the newly created user
# WARNING: this should throw an error ==> wrong password!
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"wrong"}'
```

- The output of the above command is this:

```console
{"error":"Invalid username or password"}
```

#### Check Logged-in User

##### Without Authorisation Token

- Run the following command to check the logged-in user:

```bash
# curl command to check login as the `dev-user` user
curl -s http://localhost:5000/api/auth/me
```

- The output of the above command is this:

```console
{"error":"Missing token"}
```

##### With Authorisation Token

- Run the following command to check the logged-in user:

```bash
# curl command to check login as the `dev-user` user
curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

- The output of the above command is this:

```console
{"id":"1","username":"dev-user","email":"dev-user@email.com","created_at":"2026-10-19T15:53:04.073Z"}
```

> [!NOTE]
> In the above command; I simply used the `dev-user`'s Authorisation token!
>
> > Hence, the reason as to why the output contains `dev-user`!

## Trips and Trips Routes

### Trip Queries

We are now going to create the file that will contain all the database 'SQL' commands in order to `SELECT` / fetch the correct data depending on the use case.

- Create the `server/services/tripQueries.js` file:

```js
// create the database connection
const db = require("../db/knex");
// import all the data that we have inside the `config` directory ==> `index.js` "constants" file
const config = require("../config");
// import the required functions from the `services/scoring.js` file
const { detectEvents, ratingFromScore } = require("./scoring");

// round to `digits` decimal places ( NOT significant figures )
// NOTE: `null` / `undefined` pass through untouched ==> the API keeps "no data" instead of faking '0'
const round = (value, digits) =>
  value === null || value === undefined
    ? null
    : Math.round(value * 10 ** digits) / 10 ** digits;

// metres ==> km ( keeps `null` as `null` --> because `null / 1000` would give '0' )
const km = (metres) => (metres === null ? null : round(metres / 1000, 2));

// trips that belong to this user
// NOTE: the 'trips' table has no 'user_id' ==> join through 'devices' to reach the owner
function userTrips(userId) {
  return db("trips")
    .join("devices", "devices.id", "trips.device_id")
    .where("devices.user_id", userId)
    .select("trips.*");
}

// DB row ==> API JS object ( list and details )
function toSummary(trip) {
  // a trip is still in progress while 'ended_at' is `null`
  const inProgress = trip.ended_at === null;
  return {
    id: trip.id,
    in_progress: inProgress,
    started_at: trip.started_at,
    ended_at: trip.ended_at,
    distance_km: km(trip.distance_m),
    // speed --> 1 decimal place, G values --> 3 decimal places
    max_speed_kmh: round(trip.max_speed, 1),
    max_accel_g: round(trip.max_accel_g, 3),
    max_brake_g: round(trip.max_brake_g, 3),
    max_right_g: round(trip.max_right_g, 3),
    max_left_g: round(trip.max_left_g, 3),
    max_resultant_g: round(trip.max_resultant_g, 3),
    score: trip.score,
    // no rating while the trip is still running
    rating: inProgress ? null : ratingFromScore(trip.score),
    // start / end position ( + geocoded label, when available )
    start: {
      latitude: trip.start_latitude,
      longitude: trip.start_longitude,
      label: trip.start_label,
    },
    end: {
      latitude: trip.end_latitude,
      longitude: trip.end_longitude,
      label: trip.end_label,
    },
  };
}

// DB row ==> the text-only payload for the mobile app
function toMobile(trip) {
  // a trip is still in progress while 'ended_at' is `null`
  const inProgress = trip.ended_at === null;
  return {
    in_progress: inProgress,
    start: trip.started_at,
    end: trip.ended_at,
    start_label: trip.start_label,
    end_label: trip.end_label,
    // same rounding as `toSummary` ( km to 2 dp, speed to 1, G values to 3 )
    distance_km: km(trip.distance_m),
    max_speed_kmh: round(trip.max_speed, 1),
    max_g: round(trip.max_resultant_g, 3),
    score: trip.score,
    // no label while the trip is still running
    label: inProgress ? null : ratingFromScore(trip.score),
  };
}

// closed trips ( newest first ) ==> trips under the minimum distance ==> boot sessions are hidden unless 'all' is true
async function listTrips(userId, { limit, all }) {
  // this user's closed trips ==> newest first and capped by `limit`
  const query = userTrips(userId)
    .whereNotNull("trips.ended_at")
    .orderBy("trips.started_at", "desc")
    .limit(limit);

  // hide trips shorter than the minimum ( ESP32 boot sessions ) unless `all` is true
  if (!all)
    query.where("trips.distance_m", ">=", config.minTripDistanceKm * 1000);

  // shape every row for the API
  return (await query).map(toSummary);
}

// newest trip that is in progress or long enough to count --> `null` if there is none
async function getLatestTrip(userId) {
  // minimum distance in metres ( the config value is in km )
  const minMetres = config.minTripDistanceKm * 1000;

  const trip = await userTrips(userId)
    // still in progress OR long enough to count
    .where((builder) =>
      builder
        .whereNull("trips.ended_at")
        .orWhere("trips.distance_m", ">=", minMetres),
    )
    .orderBy("trips.started_at", "desc")
    .first();

  // nothing found ==> no trip to return
  return trip ? toMobile(trip) : null;
}

// summary with number of harsh events per type --> `null` if the trip does not exist / is not the user's
async function getTrip(userId, tripId) {
  // check that the trip exists and belongs to this user
  const trip = await userTrips(userId).where("trips.id", tripId).first();
  if (!trip) return null;

  // read only the G values needed to detect the harsh events
  const rows = await db("samples")
    .where({ trip_id: tripId })
    .orderBy("created_at")
    .select("long_g", "lat_g");

  // count the harsh events, one per type ( accel / brake / corner )
  const events = detectEvents(rows);
  const counts = { accel: 0, brake: 0, corner: 0 };
  events.forEach((event) => counts[event.type]++);

  // summary + the per-type counts and their total
  return { ...toSummary(trip), events: { ...counts, total: events.length } };
}

// one point per second for the map and the charts
// NOTE: latitude / longitude are `null` when there was no GPS fix
async function getTrack(userId, tripId) {
  // check that the trip exists and belongs to this user
  const trip = await userTrips(userId)
    .where("trips.id", tripId)
    .first("trips.id");
  if (!trip) return null;

  // one row per second, oldest first ==> ready for the map and the charts
  return db("samples")
    .where({ trip_id: tripId })
    .orderBy("created_at")
    .select(
      "created_at as time",
      "latitude",
      "longitude",
      "speed",
      "long_g",
      "lat_g",
      "resultant_g",
    );
}

// where and when each harsh event happened ==> for the pins on the map
function describeEvent(event, rows) {
  // the rows covered by this event ( start and end inclusive )
  const slice = rows.slice(event.startIndex, event.endIndex + 1);

  // the strongest value of the event, sign kept
  let peak;
  if (event.type === "accel")
    // acceleration ==> the highest `long_g`
    peak = Math.max(...slice.map((row) => row.long_g));
  else if (event.type === "brake")
    // braking ==> the lowest `long_g` ( most negative )
    peak = Math.min(...slice.map((row) => row.long_g));
  else {
    // cornering ==> the largest absolute `lat_g` ( left / right )
    peak = slice.reduce(
      (best, row) => (Math.abs(row.lat_g) > Math.abs(best) ? row.lat_g : best),
      slice[0].lat_g,
    );
  }

  // first row of the event that has a position ( an event during a GPS no-fix has none )
  const located = slice.find((row) => row.latitude !== null);

  return {
    type: event.type,
    started_at: slice[0].created_at,
    ended_at: slice[slice.length - 1].created_at,
    // one row per second ==> the slice length is the duration in seconds
    duration_s: slice.length,
    peak_g: round(peak, 3),
    // speed of the event, or `null` when no row has one
    speed_kmh: round(slice.find((row) => row.speed !== null)?.speed ?? null, 1),
    latitude: located ? located.latitude : null,
    longitude: located ? located.longitude : null,
  };
}

// harsh events of one trip ==> each with where and when it happened
async function getEvents(userId, tripId) {
  // check that the trip exists and belongs to this user
  const trip = await userTrips(userId)
    .where("trips.id", tripId)
    .first("trips.id");
  if (!trip) return null;

  // read the columns `describeEvent` needs
  const rows = await db("samples")
    .where({ trip_id: tripId })
    .orderBy("created_at")
    .select("created_at", "latitude", "longitude", "speed", "long_g", "lat_g");

  // detect the events, then describe each one
  return detectEvents(rows).map((event) => describeEvent(event, rows));
}

// make these functions available to other files
module.exports = { listTrips, getLatestTrip, getTrip, getTrack, getEvents };
```

### Routes For Trip Queries

- Create the `server/routes/tripRoutes.js` file:

```js
// import the 'express' library
const express = require("express");
// import the `authenticate` function from the `middleware/auth.js` file
const { authenticate } = require("../middleware/auth");
// import all the function from the `services/tripQueries.js` file
const trips = require("../services/tripQueries");

// router holding every '/api/tripRouter' route
const router = express.Router();

// this route needs the user to be authenticated in order to access
// INFO: it also sets `req.user.id` from the token ==> every route below can use it
router.use(authenticate);

// guard for the route parameter ==> only a positive whole number is a valid id
const isId = (value) => /^\d+$/.test(value);

// `GET /api/trips?limit=5&all=true`
router.get("/", async (req, res) => {
  // clamp 'limit' between 1 and 100 ( default 20 )
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  // 'all=true' ==> also include the short trips
  const all = req.query.all === "true";
  // return this user's trips
  res.json(await trips.listTrips(req.user.id, { limit, all }));
});

// `GET /api/trips/latest`
// WARNING: must come BEFORE `/:id` otherwise `latest` would be read as an `id`
router.get("/latest", async (req, res) => {
  // newest trip ==> in progress or long enough to count
  const trip = await trips.getLatestTrip(req.user.id);
  // nothing to show yet
  if (!trip) return res.status(404).json({ error: "No trips yet" });
  res.json(trip);
});

// shared by the three `/:id` routes
// INFO: 'fetchData' is one of 'getTrip' / 'getTrack' / 'getEvents'
function tripRoute(fetchData) {
  return async (req, res) => {
    // a non-numeric id can never match a row ==> 404 straight away
    if (!isId(req.params.id))
      return res.status(404).json({ error: "Trip not found" });

    const data = await fetchData(req.user.id, req.params.id);
    // `null` ==> the trip does not exist or is not this user's
    if (data === null) return res.status(404).json({ error: "Trip not found" });

    res.json(data);
  };
}

// create our `GET` routes
// summary + the number of harsh events per type
router.get("/:id", tripRoute(trips.getTrip));
// one point per second for the map and the charts
router.get("/:id/track", tripRoute(trips.getTrack));
// where and when each harsh event happened
router.get("/:id/events", tripRoute(trips.getEvents));

// make the `tripRouter` available to other files
module.exports = router;
```

#### Update The `app.js` File

- Update the `server/app.js` file by adding the following lines of code:

```js
// import our trip router
const tripRouter = require("./routes/tripRoutes.js");

// trip routes ==> list / latest / one trip / track / events
// WARNING: needs the JWT token to have access
app.use("/api/trips", tripRouter);
```

### Testing Trip Queries Endpoints

> [!WARNING]
> Make sure that you have the `jq` command line JSON processor installed on your system!
>
> > Download Link: <https://jqlang.org/download/>

> [!TIP]
> Instead of '_copy-pasting_' the token each time, we are instead going to create a Bash / shell variable `TOKEN` that will hold the token string for the current _terminal_ / shell session.
>
> ```bash
> # get the token of the `dev-user` in a variable
> TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
>   -H "Content-Type: application/json" \
>   -d '{"username":"dev-user","password":"<dev-user-password>"}' | jq -r .token)
> ```

#### List All Drives

- Run the following command to all the drives:

> This means that it will include _short_ drives ( _the `null` ones_ )!

```bash
# curl command to list out all the drives
curl -s "http://localhost:5000/api/trips?all=true" \
  -H "Authorization: Bearer $TOKEN" | jq length
```

- The output of the above command is this:

```json
14
```

#### List Real Drives

- Run the following command to list only true drives:

```bash
# curl command to list out drives with scores / rating
curl -s http://localhost:5000/api/trips \
  -H "Authorization: Bearer $TOKEN" | jq
```

- The output of the above command is this:

```json
[
  {
    "id": "14",
    "in_progress": false,
    "started_at": "2026-10-21T16:16:51.000Z",
    "ended_at": "2026-10-21T16:27:24.000Z",
    "distance_km": 5,
    "max_speed_kmh": 56.1,
    "max_accel_g": 0.446,
    "max_brake_g": 0.322,
    "max_right_g": 0.443,
    "max_left_g": 0.595,
    "max_resultant_g": 0.624,
    "score": 0,
    "rating": "Bad",
    "start": {
      "latitude": <redacted>,
      "longitude": <redacted>,
      "label": null
    },
    "end": {
      "latitude": <redacted>,
      "longitude": <redacted>,
      "label": null
    }
  },
  {
    "id": "10",
    "in_progress": false,
    "started_at": "2026-10-21T14:42:17.000Z",
    "ended_at": "2026-10-21T14:54:32.000Z",
    "distance_km": 4.32,
    "max_speed_kmh": 46.4,
    "max_accel_g": 0.414,
    "max_brake_g": 0.835,
    "max_right_g": 0.496,
    "max_left_g": 0.646,
    "max_resultant_g": 1.031,
    "score": 0,
    "rating": "Bad",
    "start": {
      "latitude": <redacted>,
      "longitude": <redacted>,
      "label": null
    },
    "end": {
      "latitude": <redacted>,
      "longitude": <redacted>,
      "label": null
    }
  },
  {
    "id": "5",
    "in_progress": false,
    "started_at": "2026-10-16T12:58:25.000Z",
    "ended_at": "2026-10-16T13:23:03.000Z",
    "distance_km": 5.81,
    "max_speed_kmh": 53.1,
    "max_accel_g": 0.534,
    "max_brake_g": 0.422,
    "max_right_g": 0.263,
    "max_left_g": 0.675,
    "max_resultant_g": 0.727,
    "score": 0,
    "rating": "Bad",
    "start": {
      "latitude": <redacted>,
      "longitude": <redacted>,
      "label": null
    },
    "end": {
      "latitude": <redacted>,
      "longitude": <redacted>,
      "label": null
    }
  }
]
```

#### Mobile Payload

- Run the following command to show what the mobile payload looks like:

```bash
# curl command to display contents of mobile payload
curl -s http://localhost:5000/api/trips/latest \
  -H "Authorization: Bearer $TOKEN" | jq
```

- The output of the above command is this:

```json
{
  "in_progress": false,
  "start": "2026-10-21T16:16:51.000Z",
  "end": "2026-10-21T16:27:24.000Z",
  "start_label": null,
  "end_label": null,
  "distance_km": 5,
  "max_speed_kmh": 56.1,
  "max_g": 0.624,
  "score": 0,
  "label": "Bad"
}
```

#### Detailing A Trip

- Run the following command to get some details about **a** trip:

```bash
# curl command to get details about a single trip
# INFO: this is being done using the `id`
curl -s http://localhost:5000/api/trips/5 \
  -H "Authorization: Bearer $TOKEN" | jq

curl -s http://localhost:5000/api/trips/5/track \
  -H "Authorization: Bearer $TOKEN" | jq length

curl -s http://localhost:5000/api/trips/5/events \
  -H "Authorization: Bearer $TOKEN" | jq
```

- The output of the above command is this:

> First Output

```json
{
  "id": "5",
  "in_progress": false,
  "started_at": "2026-10-16T12:58:25.000Z",
  "ended_at": "2026-10-16T13:23:03.000Z",
  "distance_km": 5.81,
  "max_speed_kmh": 53.1,
  "max_accel_g": 0.534,
  "max_brake_g": 0.422,
  "max_right_g": 0.263,
  "max_left_g": 0.675,
  "max_resultant_g": 0.727,
  "score": 0,
  "rating": "Bad",
  "start": {
    "latitude": <redacted>,
    "longitude": <redacted>,
    "label": null
  },
  "end": {
    "latitude": <redacted>,
    "longitude": <redacted>,
    "label": null
  },
  "events": {
    "accel": 25,
    "brake": 1,
    "corner": 26,
    "total": 52
  }
}
```

> Second Output

```json
1281
```

> Third Output

```json
[
  {
    "type": "accel",
    "started_at": "2026-10-16T12:58:36.000Z",
    "ended_at": "2026-10-16T12:58:38.000Z",
    "duration_s": 3,
    "peak_g": 0.366,
    "speed_kmh": null,
    "latitude": null,
    "longitude": null
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T12:58:40.000Z",
    "ended_at": "2026-10-16T12:58:40.000Z",
    "duration_s": 1,
    "peak_g": 0.314,
    "speed_kmh": null,
    "latitude": null,
    "longitude": null
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T12:58:44.000Z",
    "ended_at": "2026-10-16T12:58:44.000Z",
    "duration_s": 1,
    "peak_g": -0.379,
    "speed_kmh": 20.9,
    "latitude": <redacted>,
    "longitude": <redacted>,
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T12:59:03.000Z",
    "ended_at": "2026-10-16T12:59:04.000Z",
    "duration_s": 2,
    "peak_g": 0.353,
    "speed_kmh": 1.7,
    "latitude": <redacted>,
    "longitude": <redacted>,
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T12:59:04.000Z",
    "ended_at": "2026-10-16T12:59:04.000Z",
    "duration_s": 1,
    "peak_g": -0.367,
    "speed_kmh": 5.1,
    "latitude": <redacted>,
    "longitude": <redacted>,
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T12:59:09.000Z",
    "ended_at": "2026-10-16T12:59:10.000Z",
    "duration_s": 2,
    "peak_g": 0.33,
    "speed_kmh": 9.4,
    "latitude": <redacted>,
    "longitude": <redacted>,
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T12:59:12.000Z",
    "ended_at": "2026-10-16T12:59:13.000Z",
    "duration_s": 2,
    "peak_g": -0.339,
    "speed_kmh": 12.7,
    "latitude": <redacted>,
    "longitude": <redacted>,
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:00:04.000Z",
    "ended_at": "2026-10-16T13:00:08.000Z",
    "duration_s": 2,
    "peak_g": 0.427,
    "speed_kmh": 16.6,
    "latitude": <redacted>,
    "longitude": <redacted>,
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:00:08.000Z",
    "ended_at": "2026-10-16T13:00:11.000Z",
    "duration_s": 4,
    "peak_g": -0.675,
    "speed_kmh": 16.6,
    "latitude": <redacted>,
    "longitude": <redacted>,
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:00:27.000Z",
    "ended_at": "2026-10-16T13:00:27.000Z",
    "duration_s": 1,
    "peak_g": 0.306,
    "speed_kmh": 36.5,
    "latitude": <redacted>,
    "longitude": <redacted>,
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:00:44.000Z",
    "ended_at": "2026-10-16T13:00:44.000Z",
    "duration_s": 1,
    "peak_g": -0.315,
    "speed_kmh": 33.2,
    "latitude": <redacted>,
    "longitude": <redacted>,
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:00:55.000Z",
    "ended_at": "2026-10-16T13:00:59.000Z",
    "duration_s": 5,
    "peak_g": 0.43,
    "speed_kmh": 0.4,
    "latitude": <redacted>,
    "longitude": <redacted>,
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:00:55.000Z",
    "ended_at": "2026-10-16T13:00:56.000Z",
    "duration_s": 2,
    "peak_g": -0.488,
    "speed_kmh": 0.4,
    "latitude": <redacted>,
    "longitude": <redacted>,
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:00:58.000Z",
    "ended_at": "2026-10-16T13:01:04.000Z",
    "duration_s": 7,
    "peak_g": -0.595,
    "speed_kmh": 8.7,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:01:04.000Z",
    "ended_at": "2026-10-16T13:01:12.000Z",
    "duration_s": 2,
    "peak_g": 0.357,
    "speed_kmh": 31.4,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:01:54.000Z",
    "ended_at": "2026-10-16T13:01:56.000Z",
    "duration_s": 3,
    "peak_g": 0.483,
    "speed_kmh": 9.5,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:01:56.000Z",
    "ended_at": "2026-10-16T13:01:57.000Z",
    "duration_s": 2,
    "peak_g": -0.394,
    "speed_kmh": 16.8,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:02:01.000Z",
    "ended_at": "2026-10-16T13:02:01.000Z",
    "duration_s": 1,
    "peak_g": 0.343,
    "speed_kmh": 13.9,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:02:14.000Z",
    "ended_at": "2026-10-16T13:02:14.000Z",
    "duration_s": 1,
    "peak_g": -0.307,
    "speed_kmh": 2.6,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:02:18.000Z",
    "ended_at": "2026-10-16T13:02:18.000Z",
    "duration_s": 1,
    "peak_g": 0.304,
    "speed_kmh": 13.8,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:03:13.000Z",
    "ended_at": "2026-10-16T13:03:13.000Z",
    "duration_s": 1,
    "peak_g": 0.321,
    "speed_kmh": 35.9,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:03:32.000Z",
    "ended_at": "2026-10-16T13:03:32.000Z",
    "duration_s": 1,
    "peak_g": 0.336,
    "speed_kmh": 23.6,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:03:55.000Z",
    "ended_at": "2026-10-16T13:03:55.000Z",
    "duration_s": 1,
    "peak_g": 0.306,
    "speed_kmh": 13.6,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:06:20.000Z",
    "ended_at": "2026-10-16T13:06:21.000Z",
    "duration_s": 2,
    "peak_g": 0.335,
    "speed_kmh": 43.3,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:06:23.000Z",
    "ended_at": "2026-10-16T13:06:27.000Z",
    "duration_s": 4,
    "peak_g": 0.399,
    "speed_kmh": 44.9,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:06:29.000Z",
    "ended_at": "2026-10-16T13:06:30.000Z",
    "duration_s": 2,
    "peak_g": 0.359,
    "speed_kmh": 42.8,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:06:43.000Z",
    "ended_at": "2026-10-16T13:06:44.000Z",
    "duration_s": 2,
    "peak_g": 0.372,
    "speed_kmh": 44.3,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:15:48.000Z",
    "ended_at": "2026-10-16T13:15:49.000Z",
    "duration_s": 2,
    "peak_g": 0.534,
    "speed_kmh": 13.6,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:16:02.000Z",
    "ended_at": "2026-10-16T13:16:07.000Z",
    "duration_s": 4,
    "peak_g": 0.435,
    "speed_kmh": 36,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:16:13.000Z",
    "ended_at": "2026-10-16T13:16:16.000Z",
    "duration_s": 4,
    "peak_g": 0.394,
    "speed_kmh": 20.5,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:17:24.000Z",
    "ended_at": "2026-10-16T13:17:24.000Z",
    "duration_s": 1,
    "peak_g": 0.424,
    "speed_kmh": 4.6,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:17:24.000Z",
    "ended_at": "2026-10-16T13:17:40.000Z",
    "duration_s": 15,
    "peak_g": -0.662,
    "speed_kmh": 4.6,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:18:21.000Z",
    "ended_at": "2026-10-16T13:18:21.000Z",
    "duration_s": 1,
    "peak_g": -0.317,
    "speed_kmh": 2.2,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:18:58.000Z",
    "ended_at": "2026-10-16T13:18:58.000Z",
    "duration_s": 1,
    "peak_g": -0.301,
    "speed_kmh": 2.7,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:19:03.000Z",
    "ended_at": "2026-10-16T13:19:03.000Z",
    "duration_s": 1,
    "peak_g": -0.361,
    "speed_kmh": 5.6,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:19:07.000Z",
    "ended_at": "2026-10-16T13:19:08.000Z",
    "duration_s": 2,
    "peak_g": -0.342,
    "speed_kmh": 9.1,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:19:16.000Z",
    "ended_at": "2026-10-16T13:19:18.000Z",
    "duration_s": 3,
    "peak_g": -0.337,
    "speed_kmh": 9.9,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:19:23.000Z",
    "ended_at": "2026-10-16T13:19:23.000Z",
    "duration_s": 1,
    "peak_g": -0.303,
    "speed_kmh": 7.4,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:19:26.000Z",
    "ended_at": "2026-10-16T13:19:26.000Z",
    "duration_s": 1,
    "peak_g": -0.304,
    "speed_kmh": 4.1,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:19:31.000Z",
    "ended_at": "2026-10-16T13:19:35.000Z",
    "duration_s": 5,
    "peak_g": -0.458,
    "speed_kmh": 0.4,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:19:38.000Z",
    "ended_at": "2026-10-16T13:19:42.000Z",
    "duration_s": 5,
    "peak_g": -0.441,
    "speed_kmh": 10.1,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:19:48.000Z",
    "ended_at": "2026-10-16T13:19:48.000Z",
    "duration_s": 1,
    "peak_g": -0.305,
    "speed_kmh": 6.2,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:19:52.000Z",
    "ended_at": "2026-10-16T13:19:53.000Z",
    "duration_s": 2,
    "peak_g": -0.421,
    "speed_kmh": 10.6,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:20:01.000Z",
    "ended_at": "2026-10-16T13:20:12.000Z",
    "duration_s": 8,
    "peak_g": -0.472,
    "speed_kmh": 8.5,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:20:22.000Z",
    "ended_at": "2026-10-16T13:20:23.000Z",
    "duration_s": 2,
    "peak_g": -0.324,
    "speed_kmh": 22.6,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:20:24.000Z",
    "ended_at": "2026-10-16T13:20:24.000Z",
    "duration_s": 1,
    "peak_g": 0.335,
    "speed_kmh": 19.5,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:20:32.000Z",
    "ended_at": "2026-10-16T13:20:39.000Z",
    "duration_s": 8,
    "peak_g": -0.339,
    "speed_kmh": 19.4,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:20:36.000Z",
    "ended_at": "2026-10-16T13:20:37.000Z",
    "duration_s": 2,
    "peak_g": 0.307,
    "speed_kmh": 18.7,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:20:49.000Z",
    "ended_at": "2026-10-16T13:20:51.000Z",
    "duration_s": 3,
    "peak_g": -0.348,
    "speed_kmh": 15.6,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "accel",
    "started_at": "2026-10-16T13:21:28.000Z",
    "ended_at": "2026-10-16T13:21:28.000Z",
    "duration_s": 1,
    "peak_g": 0.323,
    "speed_kmh": 18.2,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "corner",
    "started_at": "2026-10-16T13:21:48.000Z",
    "ended_at": "2026-10-16T13:21:53.000Z",
    "duration_s": 6,
    "peak_g": -0.337,
    "speed_kmh": 25.4,
    "latitude": <redacted>,
    "longitude": <redacted>
  },
  {
    "type": "brake",
    "started_at": "2026-10-16T13:22:01.000Z",
    "ended_at": "2026-10-16T13:22:03.000Z",
    "duration_s": 3,
    "peak_g": -0.422,
    "speed_kmh": 37.7,
    "latitude": <redacted>,
    "longitude": <redacted>
  }
]
```

> [!WARNING]
> Given that `testuser` does **not** have any device... We should see that we get _no output_ or errors when we use his `TOKEN` ( _while running the same `curl` commands_ ):

## Device Service and Routes

### Device Service

Given that the we are going to have multiple users and also we don't really know if the user is technologically savvy.

I think its much better to have a 'User Settings' / profile page in order for the user to set confidential stuff like ThingSpeak 'Channel ID', 'read API Key' and other sensitive information.

Therefore, we are going to have to create a "device" service in order to set and encrypt these confidential data.

- Create a `server/services/deviceService.js` file:

```js
// check if ThingSpeak is responding by asking for 1 row
// WARNING: never log the actual URL as it contains the `channelId` and `readKey`
async function verifyChannel(channelId, readKey) {
  // build the "base" URL
  const url =
    `https://api.thingspeak.com/channels/${channelId}/feeds.json` +
    `?results=1&api_key=${encodeURIComponent(readKey)}`;

  // try to make a request and get a response from ThingSpeak
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (response.ok) return { ok: true };

    // return the following JS object if all okay
    return {
      ok: false,
      reason: "ThingSpeak rejected the channel ID or read key",
    };
  } catch {
    // return the following JS object if failed
    return { ok: false, reason: "Could not reach ThingSpeak, try again" };
  }
}

// DB row ==> API JS object ( the encrypted key never leaves the server )
function toPublic(device) {
  return {
    id: device.id,
    label: device.label,
    thingspeak_channel_id: device.thingspeak_channel_id,
    has_read_key: Boolean(device.read_key_encrypted),
    created_at: device.created_at,
  };
}

// make these functions available to other files
module.exports = { verifyChannel, toPublic };
```

### Routes For Device

- Create the `server/routes/deviceRoutes.js` file:

```js
// import the 'express' library
const express = require("express");
// create the database connection
const db = require("../db/knex");
// import the `authenticate` function from the `middleware/auth.js` file
const { authenticate } = require("../middleware/auth");
// import the `encrypt` function from the `server/encryption.js` file
const { encrypt } = require("../services/encryption");
// import all the required functions from the `services/deviceService.js` file
const { verifyChannel, toPublic } = require("../services/deviceService");

// router holding every '/api/deviceRouter' route
const router = express.Router();

// this route needs the user to be authenticated in order to access
// INFO: it also sets `req.user.id` from the token ==> every route below can use it
router.use(authenticate);

// check for positive integer numbers ==> valid positive number for `id`
const isId = (value) => /^\d+$/.test(value);
// a ThingSpeak channel ID ==> whole number bigger than zero
const isChannelId = (value) => Number.isInteger(value) && value > 0;
// a text field ==> not empty and not longer than 'max' characters
const isText = (value, max) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= max;

// the user's device / undefined ==> a device of someone else looks like it does not exist
const findOwned = (userId, id) =>
  db("devices").where({ id, user_id: userId }).first();

// `GET /api/devices`
router.get("/", async (req, res) => {
  // only this user's devices ==> the 'user_id' comes from the token, not from the body
  const devices = await db("devices")
    .where({ user_id: req.user.id })
    .orderBy("id");
  // 'toPublic' hides the read key ==> the client only gets the safe fields
  res.json(devices.map(toPublic));
});

// `POST /api/devices` ==> { label, thingspeak_channel_id, read_key }
router.post("/", async (req, res) => {
  // take the body apart ==> the API names are shorter than the column names
  const {
    label,
    thingspeak_channel_id: channelId,
    read_key: readKey,
  } = req.body;

  // check every field ==> each failure comes back as a '400' with a message for the user
  if (!isText(label, 50))
    return res
      .status(400)
      .json({ error: "Label is required (max 50 characters)" });
  if (!isChannelId(channelId))
    return res
      .status(400)
      .json({ error: "Channel ID must be a positive number" });
  if (!isText(readKey, 100))
    return res.status(400).json({ error: "Read key is required" });

  // prove the channel works ==> a broken channel ID or key never reaches the database
  const check = await verifyChannel(channelId, readKey.trim());
  if (!check.ok) return res.status(400).json({ error: check.reason });

  try {
    // store the device ==> the read key is encrypted before it touches the database
    // INFO: `returning("*")` gives the new row back --> `toPublic` needs it for the answer
    const [device] = await db("devices")
      .insert({
        user_id: req.user.id,
        label: label.trim(),
        thingspeak_channel_id: channelId,
        read_key_encrypted: encrypt(readKey.trim()),
      })
      .returning("*");

    // the sync loop picks it up on its next tick
    res.status(201).json(toPublic(device));
  } catch (error) {
    // channel IDs are unique ==> one channel cannot belong to two accounts
    if (error.code === "23505")
      return res
        .status(409)
        .json({ error: "This channel is already registered" });
    // any other error ==> the global handler in 'app.js' turns it into a 500
    throw error;
  }
});

// `PATCH /api/devices/:id` ==> { label, thingspeak_channel_id, read_key }
router.patch("/:id", async (req, res) => {
  // a non-numeric `id` can never match a row ==> '404' response
  if (!isId(req.params.id))
    return res.status(404).json({ error: "Device not found" });

  // the device does not exist or belongs to someone else ==> `404 response again
  const device = await findOwned(req.user.id, req.params.id);
  if (!device) return res.status(404).json({ error: "Device not found" });

  // take the body apart ==> only the fields that were sent end up in "changes"
  const {
    label,
    thingspeak_channel_id: channelId,
    read_key: readKey,
  } = req.body;

  // the changes start empty --> field that was not sent is simply not updated
  const changes = {};

  // check every field that was sent --> each one is validated before it is stored
  if (label !== undefined) {
    if (!isText(label, 50))
      return res.status(400).json({ error: "Label must be 1-50 characters" });
    changes.label = label.trim();
  }

  if (channelId !== undefined) {
    if (!isChannelId(channelId))
      return res
        .status(400)
        .json({ error: "Channel ID must be a positive number" });
    changes.thingspeak_channel_id = channelId;
  }

  if (readKey !== undefined) {
    if (!isText(readKey, 100))
      return res.status(400).json({ error: "Read key cannot be empty" });
    changes.read_key_encrypted = encrypt(readKey.trim());
  }

  // empty patch ==> there is nothing to save
  if (Object.keys(changes).length === 0)
    return res.status(400).json({ error: "Nothing to update" });

  // channel ID / 'read' API key changed ==> test the final combination
  // INFO: an old key does not work with a new channel, and the reverse
  if (changes.thingspeak_channel_id !== undefined || readKey !== undefined) {
    // NOTE: the old key is decrypted here ==> it only lives in memory
    const { decrypt } = require("../services/encryption");
    // the combination that will be stored ==> the new channel or the old one
    const finalChannel =
      changes.thingspeak_channel_id ?? device.thingspeak_channel_id;
    const finalKey =
      readKey !== undefined
        ? readKey.trim()
        : decrypt(device.read_key_encrypted);

    const check = await verifyChannel(finalChannel, finalKey);
    if (!check.ok) return res.status(400).json({ error: check.reason });
  }

  try {
    // write the changes ==> only the columns inside "changes" are touched
    const [updated] = await db("devices")
      .where({ id: device.id })
      .update(changes)
      .returning("*");
    // the client gets the updated device --> still without the read key
    res.json(toPublic(updated));
  } catch (error) {
    // channel IDs are unique ==> one channel cannot belong to two accounts
    if (error.code === "23505")
      return res
        .status(409)
        .json({ error: "This channel is already registered" });
    // handled by the `server/app.js` file
    throw error;
  }
});

// `DELETE /api/devices/:id``
// NOTE: deletes its samples and trips --> `ON DELETE CASCADE`
router.delete("/:id", async (req, res) => {
  // a non-numeric `id` can never match a row ==> '404' response
  if (!isId(req.params.id))
    return res.status(404).json({ error: "Device not found" });

  // the delete is scoped to the user ==> nobody can delete someone else's device
  const deleted = await db("devices")
    .where({ id: req.params.id, user_id: req.user.id })
    .del();

  // nothing was deleted ==> the device does not exist or belongs to someone else
  if (deleted === 0) return res.status(404).json({ error: "Device not found" });
  // no content ==> the device is gone
  res.status(204).end();
});

// make the `deviceRouter` available to other files
module.exports = router;
```

#### Update The `app.js` File

- Update the `server/app.js` file by adding the following lines of code:

```js
// import our device router
const deviceRouter = require("./routes/deviceRoutes.js");

// device routes ==> list / add / change / remove
// WARNING: needs the JWT token to have access
app.use("/api/devices", deviceRouter);
```

### Testing Device Endpoints

> [!WARNING]
> So instead of using the `dev-user` user to test in this case... We are going to be using the `testuser` user so that we don't mess our original device.

> [!TIP]
> Instead of '_copy-pasting_' the token each time, we are instead going to create a Bash / shell variable `TOKEN` that will hold the token string for the current _terminal_ / shell session.
>
> ```bash
> # get the token of the `testuser` in a variable
> TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
>   -H "Content-Type: application/json" \
>   -d '{"username":"testuser","password":"<testuser-password>"}' | jq -r .token)
> ```
>
> Additionally given that we are going to be using the `THINGSPEAK_CHANNEL_ID` and `THINGSPEAK_READ_KEY`.
>
> I am simply going to add them to a Bash / shell variable similar to how we did for the `TOKEN`.
>
> > Therefore, head over to your `server/.env` file or the ThingSpeak channel online to get these 2 data.

#### Check User Devices

- Run the following command to check `testuser`'s devices:

```bash
# curl command to check devices of `testuser` user
curl -s http://localhost:5000/api/devices \
  -H "Authorization: Bearer $TOKEN" | jq
```

- The output of the above command is this:

```json
[]
```

#### Using Wrong API ( Read ) Key

- Run the following command to list all the devices with wrong API key:

```bash
# curl command to list devices for `testuser`
# WARNING: this should throw an error ==> wrong key!
curl -s -X POST http://localhost:5000/api/devices \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"label":"Test","thingspeak_channel_id":'"$THINGSPEAK_CHANNEL_ID"',"read_key":"WRONGKEY"}' | jq
```

- The output of the above command is this:

```json
{
  "error": "ThingSpeak rejected the channel ID or read key"
}
```

#### Using `dev-user`'s Channel ID

- Run the following command to check if we can access `dev-user`'s devices:

```bash
# curl command to check if we can access other people's devices
curl -s -X POST http://localhost:5000/api/devices \
  -H "Authorization: Bearer $TOKEN2" -H "Content-Type: application/json" \
  -d '{"label":"Test","thingspeak_channel_id":'"$THINGSPEAK_CHANNEL_ID"',"read_key":"'"$THINGSPEAK_READ_KEY"'"}' | jq
```

- The output of the above command is this:

```json
{
  "error": "Missing token"
}
```

#### Check Ownership

- Run the following command to check if `testuser` has access to `dev-user` devices:

```bash
# curl command to check if testuser has access to other user's devices
curl -s -X PATCH http://localhost:5000/api/devices/1 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"label":"Hacked"}' | jq
```

- The output of the above command is this:

```json
{
  "error": "Device not found"
}
```

#### Delete `dev-user` Device(s)

- Run the following command to delete the `dev-user`'s device(s)s:

```bash
# curl command to try to delete other user's device(s)
curl -s -X DELETE http://localhost:5000/api/devices/1 \
  -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code}\n"
```

- The output of the above command is this:

```json
404
```

> [!TIP]
>
> - Running the following command as the `dev-user` user ( _meaning using `TOKEN` for `dev-user`_ ):
>
> ```bash
> # curl command to list all the devices for `dev-user`
>
> ```
>
> - I do see the following output:
>
> ```json
> [
>   {
>     "id": "1",
>     "label": "Mazda 3",
>     "thingspeak_channel_id": 1234567,
>     "has_read_key": true,
>     "created_at": "2026-10-19T15:53:04.187Z"
>   }
> ]
> ```
>
> > Very nice!

## Status Bits

- Update the `server/config/index.js` file to add the following 'status bits' ( _constant_ ) data:

```js
  // ThingSpeak `field6` ==> status bit flags
  // WARNING: must match the firmware
  statusBits: { gpsTalking: 1, gpsFix: 2, imu: 4 },
```

### Status Bits Queries

- Create the `server/services/statusQueries.js` file:

```js
// import the `knex.js` file to create database connection
const db = require("../db/knex");
// import all the data that we have inside the `config` directory ==> `index.js` "constants" file
const config = require("../config");

// `status_bits` number to booleans
function decodeStatus(bits) {
  // JS object --> one bit per sensor ( set bit ==> `true` )
  return {
    gpsTalking: (bits & config.statusBits.gpsTalking) !== 0,
    gpsFix: (bits & config.statusBits.gpsFix) !== 0,
    imu: (bits & config.statusBits.imu) !== 0,
  };
}

// booleans to the light colours
// NOTE:
// 1. grey = unknown
// 2. orange = problem
// 3. green = ok
function sensorStates(bits, online) {
  // offline / no row yet ==> we cannot say anything about the sensors
  if (!online || bits === null || bits === undefined) {
    return {
      gps: { state: "unknown", message: "No recent data" },
      imu: { state: "unknown", message: "No recent data" },
    };
  }

  // unpack the bitfield into the three sensor flags
  const { gpsTalking, gpsFix, imu } = decodeStatus(bits);

  // best case first ==> a fix --> then talking-but-no-fix --> then silent
  let gps;
  if (gpsFix) gps = { state: "ok", message: "GPS fix" };
  else if (gpsTalking) gps = { state: "warning", message: "No GPS fix yet" };
  else gps = { state: "warning", message: "GPS not responding" };

  // same light shape for the IMU sensor
  return {
    gps,
    imu: imu
      ? { state: "ok", message: "IMU working" }
      : { state: "warning", message: "IMU not responding" },
  };
}

// status of ONE device ==> online flag / last seen / the sensor lights / the last GPS fix
async function getDeviceStatus(device, now) {
  // newest sample of this device ==> tells us if it is still alive
  const latest = await db("samples")
    .where({ device_id: device.id })
    .orderBy("created_at", "desc")
    .first("created_at", "status_bits");

  // newest row WITH a position ( the latest row may be a no-fix row )
  const lastFix = await db("samples")
    .where({ device_id: device.id })
    .whereNotNull("latitude")
    .whereNotNull("longitude")
    .orderBy("created_at", "desc")
    .first("created_at", "latitude", "longitude");

  // how old the newest sample is ==> `null` when the device never sent anything
  const ageMs = latest ? now - latest.created_at.getTime() : null;
  // online while the newest sample is younger than 'offlineAfterMs'
  const online = ageMs !== null && ageMs <= config.offlineAfterMs;

  return {
    device_id: device.id,
    label: device.label,
    online,
    last_seen: latest ? latest.created_at : null,
    // age in whole seconds ( `null` when there is no row at all )
    data_age_s: ageMs === null ? null : Math.round(ageMs / 1000),
    // spread the two sensor lights into 'gps' and 'imu'
    ...sensorStates(latest ? latest.status_bits : null, online),
    // newest position with a GPS fix, or `null` when the device never had one
    last_position: lastFix
      ? {
          latitude: lastFix.latitude,
          longitude: lastFix.longitude,
          time: lastFix.created_at,
        }
      : null,
  };
}

// all devices of this user
// NOTE: "now" is taken ONCE and passed down ==> every device is judged against the same clock
async function getStatus(userId) {
  // one timestamp for the whole response
  const now = Date.now();
  // the devices that belong to this user ( oldest first )
  const devices = await db("devices")
    .where({ user_id: userId })
    .orderBy("id")
    .select("id", "label");

  return {
    // when this snapshot was taken
    checked_at: new Date(now).toISOString(),
    // one status object per device ( the queries run in parallel )
    devices: await Promise.all(
      devices.map((device) => getDeviceStatus(device, now)),
    ),
  };
}

// make these functions available to other files
module.exports = { getStatus, decodeStatus, sensorStates };
```

### Routes For Status Bits

- Create the `server/routes/statusRoutes.js` file:

```js
// import the 'express' library
const express = require("express");
// import the `authenticate` function from the `middleware/auth.js` file
const { authenticate } = require("../middleware/auth");
// import the `getStatus` function from the `services/statusQueries.js` file
const { getStatus } = require("../services/statusQueries");

// router holding every '/api/statusRouter' route
const router = express.Router();

// this route needs the user to be authenticated in order to access
// INFO: it also sets `req.user.id` from the token ==> every route below can use it
router.use(authenticate);

// `GET /api/status`
router.get("/", async (req, res) => {
  res.json(await getStatus(req.user.id));
});

// make the `statusRouter` available to other files
module.exports = router;
```

#### Update The `app.js` File

- Update the `server/app.js` file by adding the following lines of code:

```js
// import our status router
const statusRouter = require("./routes/statusRoutes.js");

// status routes ==> ESP32 online / GPS and IMU colours / data age / last known position
// WARNING: needs the JWT token to have access
app.use("/api/status", statusRouter);
```

### Testing Status Bits Endpoints

> [!TIP]
> Instead of '_copy-pasting_' the tokens each time, we are instead going to create 2 Bash / shell variables, `TOKEN` and `TOKEN_DEV` which will hold the token string for the current _terminal_ / shell session.
>
> - `testuser` Token:
>
> ```bash
> # get the token of the `testuser` in a variable
> TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
>   -H "Content-Type: application/json" \
>   -d '{"username":"testuser","password":"<testuser-password>"}' | jq -r .token)
> ```
>
> - `dev-user` Token:
>
> ```bash
> # get the token of the `testuser` in a variable
> TOKEN_DEV=$(curl -s -X POST http://localhost:5000/api/auth/login \
>   -H "Content-Type: application/json" \
>   -d '{"username":"dev-user","password":"<dev-user-password>"}' | jq -r .token)
> ```

#### Check Status of `dev-user` Device

- Run the following command to check device status of `dev-user`:

```bash
# curl command to check the ESP32-D status of `dev-user` user
curl -s http://localhost:5000/api/status \
  -H "Authorization: Bearer $TOKEN_DEV" | jq
```

- The output of the above command is this:

```json
{
  "checked_at": "2026-10-23T08:28:19.538Z",
  "devices": [
    {
      "device_id": "1",
      "label": "Mazda 3",
      "online": false,
      "last_seen": "2026-10-21T16:27:24.000Z",
      "data_age_s": 144056,
      "gps": {
        "state": "unknown",
        "message": "No recent data"
      },
      "imu": {
        "state": "unknown",
        "message": "No recent data"
      },
      "last_position": {
        "latitude": <redacted>,
        "longitude": <redacted>,
        "time": "2026-10-21T16:27:24.000Z"
      }
    }
  ]
}
```

#### Check Status of `testuser` Device

- Run the following command to check device status of `testuser`:

```bash
# curl command to check the ESP32-D status of `testuser` user
curl -s http://localhost:5000/api/status \
  -H "Authorization: Bearer $TOKEN" | jq
```

- The output of the above command is this:

```json
{
  "checked_at": "2026-10-23T08:29:38.760Z",
  "devices": []
}
```

#### Missing Token

- Run the following command to check device status **without** token:

```bash
# curl command to check device status
# WARNING: this should throw an error ==> no token!
curl -s http://localhost:5000/api/status | jq
```

- The output of the above command is this:

```json
{
  "error": "Missing token"
}
```

## Geographic - Places Location

- Update the `server/config/index.js` file to add the following constants:

```js
  // geographic places and labels
  defaultPlaceRadiusM: 150,
  placeRadiusMinM: 20,
  placeRadiusMaxM: 2000,
  // INFO: further than this from every town ==> show raw coordinates
  townMaxDistanceM: 6000,
```

### Geographic Location Fallback

- Create the `server/config/towns.js` file:

```js
// INFO: fallback geographic location coordinates

// allow other files to access the location objects for different towns in Mauritius
// WARNING: given the that this repository is public ==> DO NOT ADD YOUR 'Home' coordinates
module.exports = [
  { name: "Port Louis", latitude: -20.1609, longitude: 57.5012 },
  { name: "Pamplemousses", latitude: -20.1067, longitude: 57.5742 },
  { name: "Grand Baie", latitude: -20.0114, longitude: 57.58 },
  { name: "Cap Malheureux", latitude: -19.9833, longitude: 57.6167 },
  { name: "Grand Gaube", latitude: -20.0069, longitude: 57.6636 },
  { name: "Goodlands", latitude: -20.0356, longitude: 57.6427 },
  { name: "Triolet", latitude: -20.0553, longitude: 57.5453 },
  { name: "Pointe aux Piments", latitude: -20.0633, longitude: 57.5133 },
  { name: "Centre de Flacq", latitude: -20.1903, longitude: 57.7133 },
  { name: "Quartier Militaire", latitude: -20.2373, longitude: 57.5545 },
  { name: "Moka", latitude: -20.2271, longitude: 57.5047 },
  { name: "Saint Pierre", latitude: -20.2186, longitude: 57.5236 },
  { name: "Beau Bassin", latitude: -20.23, longitude: 57.465 },
  { name: "Rose Hill", latitude: -20.2381, longitude: 57.4705 },
  { name: "Quatre Bornes", latitude: -20.2651, longitude: 57.4793 },
  { name: "Phoenix", latitude: -20.2756, longitude: 57.4939 },
  { name: "Vacoas", latitude: -20.2987, longitude: 57.4783 },
  { name: "Curepipe", latitude: -20.3162, longitude: 57.5166 },
  { name: "Albion", latitude: -20.2111, longitude: 57.4047 },
  { name: "Bambous", latitude: -20.2542, longitude: 57.403 },
  { name: "Flic en Flac", latitude: -20.2747, longitude: 57.3656 },
  { name: "Tamarin", latitude: -20.325, longitude: 57.3722 },
  { name: "Rose Belle", latitude: -20.3944, longitude: 57.5967 },
  { name: "Mahebourg", latitude: -20.4081, longitude: 57.7 },
  { name: "Plaine Magnien", latitude: -20.429, longitude: 57.656 },
  { name: "Souillac", latitude: -20.517, longitude: 57.517 },
];
```

### Geolocation Calculations

- Create the `server/services/geo.js` file:

```js
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
```

### Geographic Location - Places Queries

- Create the `server/services/placeQueries.js` file:

```js
// import the `knex.js` file to create database connection
const db = require("../db/knex");
// import the `labelFor` function from the `services/geo.js` file
const { labelFor } = require("./geo");

// DB row ==> API JS object ==> hides `user_id` from the client
// NOTE: `Number(...)` because 'bigserial' comes back from PostgreSQL as a string
const toPublic = (place) => ({
  id: Number(place.id),
  label: place.label,
  latitude: place.latitude,
  longitude: place.longitude,
  radius_m: place.radius_m,
});

// every place that belongs to this user ==> oldest first
async function listPlaces(userId) {
  const places = await db("places").where({ user_id: userId }).orderBy("id");
  return places.map(toPublic);
}

// insert a new place for this user ==> returns it in API shape
async function createPlace(userId, data) {
  // 'returning' gives an array ==> destructure the single inserted row
  const [place] = await db("places")
    .insert({ user_id: userId, ...data })
    .returning("*");
  return toPublic(place);
}

// update one of this user's places
// NOTE: undefined when the place does not exist / belongs to someone else
async function updatePlace(userId, id, changes) {
  const [place] = await db("places")
    // filter on 'user_id' too ==> you can only change your own places
    .where({ id, user_id: userId })
    .update(changes)
    .returning("*");
  return place ? toPublic(place) : undefined;
}

// delete one of this user's places ==> `true` when a row was actually removed
async function deletePlace(userId, id) {
  // 'del()' returns the number of deleted rows ==> '> 0' means it existed
  return (await db("places").where({ id, user_id: userId }).del()) > 0;
}

// `start_label` / `end_label` of one trip ==> called when a trip is finalized
// NOTE: open trips and trips without a GPS fix are left alone
async function labelTrip(tripId) {
  // read the coordinates of the trip and the owner --> joined through `devices`
  const trip = await db("trips")
    .join("devices", "devices.id", "trips.device_id")
    .where("trips.id", tripId)
    .first(
      "trips.ended_at",
      "trips.start_latitude",
      "trips.start_longitude",
      "trips.end_latitude",
      "trips.end_longitude",
      "devices.user_id",
    );

  // unknown trip or still running ==> nothing to label
  if (!trip || trip.ended_at === null) return;

  // the user's saved places ==> all the labels we can match against
  const places = await db("places")
    .where({ user_id: trip.user_id })
    .select("label", "latitude", "longitude", "radius_m");

  // only label the ends that have a GPS fix
  const changes = {};
  if (trip.start_latitude !== null && trip.start_longitude !== null) {
    changes.start_label = labelFor(
      trip.start_latitude,
      trip.start_longitude,
      places,
    );
  }
  if (trip.end_latitude !== null && trip.end_longitude !== null) {
    changes.end_label = labelFor(trip.end_latitude, trip.end_longitude, places);
  }

  // one update for both labels ( skip it when there is nothing to write )
  if (Object.keys(changes).length > 0)
    await db("trips").where({ id: tripId }).update(changes);
}

// old trips keep their old labels when a place is added ==> this rewrites all of the user's finished trips
async function relabelUserTrips(userId) {
  // every finished trip of this user ( open ones get labelled when they close )
  const trips = await db("trips")
    .join("devices", "devices.id", "trips.device_id")
    .where("devices.user_id", userId)
    .whereNotNull("trips.ended_at")
    .select("trips.id");

  // label them one by one, then report how many were touched
  for (const trip of trips) await labelTrip(trip.id);
  return trips.length;
}

// make these functions available to other files
module.exports = {
  listPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  labelTrip,
  relabelUserTrips,
};
```

### Routes For Geographic Locations

- Create the `server/routes/placeRoutes.js` file:

```js
// import the 'express' library
const express = require("express");
// import the `authenticate` from `middleware/auth.js` file
const { authenticate } = require("../middleware/auth");
// import everything from `config/` directory in order to have access to constants
const config = require("../config");
// import all the required functions from the `services/placeQueries.js` file
const places = require("../services/placeQueries");

// router holding every '/api/placeRouter' route
const router = express.Router();

// this route needs the user to be authenticated in order to access
// INFO: it also sets `req.user.id` from the token ==> every route below can use it
router.use(authenticate);

// guard for the route parameter ==> only a positive whole number is a valid id
const isId = (value) => /^\d+$/.test(value);
// label ==> a non-empty string of at most 60 characters
const isLabel = (value) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= 60;
// latitude ==> a real number between -90 and 90
const isLatitude = (value) =>
  Number.isFinite(value) && value >= -90 && value <= 90;
// longitude ==> a real number between -180 and 180
const isLongitude = (value) =>
  Number.isFinite(value) && value >= -180 && value <= 180;
// radius ==> a whole number of metres inside the limits from 'config'
const isRadius = (value) =>
  Number.isInteger(value) &&
  value >= config.placeRadiusMinM &&
  value <= config.placeRadiusMaxM;

// never accept a 0 / 0 position ==> it means "no fix" --> not a place
const isRealPosition = (latitude, longitude) =>
  !(latitude === 0 && longitude === 0);

// `GET /api/places`
router.get("/", async (req, res) => {
  // every saved place of this user
  res.json(await places.listPlaces(req.user.id));
});

// `POST /api/places/relabel` ==> rewrite the labels of all finished trips ( run after adding or changing a place )
router.post("/relabel", async (req, res) => {
  // report how many trips were relabelled
  res.json({ relabelled_trips: await places.relabelUserTrips(req.user.id) });
});

// `POST /api/places` ==> body: label / latitude / longitude / radius_m ( optional )
router.post("/", async (req, res) => {
  const { label, latitude, longitude } = req.body;
  // radius is optional ==> fall back to the default from 'config'
  const radius = req.body.radius_m ?? config.defaultPlaceRadiusM;

  // validate everything BEFORE touching the database
  if (!isLabel(label))
    return res
      .status(400)
      .json({ error: "Label is required (max 60 characters)" });
  if (!isLatitude(latitude))
    return res
      .status(400)
      .json({ error: "Latitude must be between -90 and 90" });
  if (!isLongitude(longitude))
    return res
      .status(400)
      .json({ error: "Longitude must be between -180 and 180" });
  if (!isRealPosition(latitude, longitude))
    return res.status(400).json({ error: "0,0 is not a real position" });
  if (!isRadius(radius)) {
    return res.status(400).json({
      error: `Radius must be a whole number between ${config.placeRadiusMinM} and ${config.placeRadiusMaxM} metres`,
    });
  }

  // store the trimmed label + the validated numbers
  const place = await places.createPlace(req.user.id, {
    label: label.trim(),
    latitude,
    longitude,
    radius_m: radius,
  });
  // 201 = created ==> send the new place back
  res.status(201).json(place);
});

// `PATCH /api/places/:id` ==> any of: label / latitude / longitude / radius_m
router.patch("/:id", async (req, res) => {
  // a non-numeric id can never match a row ==> 404 straight away
  if (!isId(req.params.id))
    return res.status(404).json({ error: "Place not found" });

  // any of these fields may be sent ==> 'radius_m' is renamed to 'radius'
  const { label, latitude, longitude, radius_m: radius } = req.body;
  // only the fields that were actually sent end up in 'changes'
  const changes = {};

  // label was sent ==> check it then queue the trimmed value
  if (label !== undefined) {
    if (!isLabel(label))
      return res.status(400).json({ error: "Label must be 1-60 characters" });
    changes.label = label.trim();
  }
  // latitude was sent ==> check it then queue it
  if (latitude !== undefined) {
    if (!isLatitude(latitude))
      return res
        .status(400)
        .json({ error: "Latitude must be between -90 and 90" });
    changes.latitude = latitude;
  }
  // longitude was sent ==> check it then queue it
  if (longitude !== undefined) {
    if (!isLongitude(longitude))
      return res
        .status(400)
        .json({ error: "Longitude must be between -180 and 180" });
    changes.longitude = longitude;
  }
  // radius was sent ==> check it then queue it
  if (radius !== undefined) {
    if (!isRadius(radius))
      return res.status(400).json({ error: "Radius is out of range" });
    changes.radius_m = radius;
  }

  // empty body ==> nothing was sent --> nothing to update
  if (Object.keys(changes).length === 0)
    return res.status(400).json({ error: "Nothing to update" });

  const place = await places.updatePlace(req.user.id, req.params.id, changes);
  // `undefined` ==> the place does not exist or is not this user's
  if (!place) return res.status(404).json({ error: "Place not found" });
  // send the updated place back
  res.json(place);
});

// `DELETE /api/places/:id`
router.delete("/:id", async (req, res) => {
  // a non-numeric id can never match a row ==> 404 straight away
  if (!isId(req.params.id))
    return res.status(404).json({ error: "Place not found" });

  const deleted = await places.deletePlace(req.user.id, req.params.id);
  // 'false' ==> the place does not exist or is not this user's
  if (!deleted) return res.status(404).json({ error: "Place not found" });
  // 204 = deleted ==> no body to send
  res.status(204).end();
});

// make the `placeRouter` available to other files
module.exports = router;
```

#### Update The `app.js` File

- Update the `server/app.js` file by adding the following lines of code:

```js
// import our place router
const placeRouter = require("./routes/placeRoutes.js");

// place routes ==> personal places ( home, university, ... ) --> relabel finished trips
// WARNING: needs the JWT token to have access
app.use("/api/places", placeRouter);
```

#### Update The `trips.js` File

- Update the `server/services/trips.js` file by adding the following lines of code:

```js
// at the top of the file
const { labelTrip } = require("./placeQueries");

// add the following line at the end of `finalizeTrip` function
await labelTrip(tripId);
```

### Testing and Testing Geographic Endpoints

- Create the `test-js-files/test-geo.js` file to check distances and other locations:

```js
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
```

- Run the following command to check if the geographic stuff is correct:

```bash
# run the `test-geo.js` file to check if data is correct
node test-js-files/test-geo.js
geo tests passed
```

- You should see that we have the following output like so:

```console
geo tests passed
```

---

> [!TIP]
> Instead of '_copy-pasting_' the tokens each time, we are instead going to create 2 Bash / shell variables, `TOKEN` and `TOKEN_DEV` which will hold the token string for the current _terminal_ / shell session.
>
> - `testuser` Token:
>
> ```bash
> # get the token of the `testuser` in a variable
> TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
>   -H "Content-Type: application/json" \
>   -d '{"username":"testuser","password":"<testuser-password>"}' | jq -r .token)
> ```
>
> - `dev-user` Token:
>
> ```bash
> # get the token of the `testuser` in a variable
> TOKEN_DEV=$(curl -s -X POST http://localhost:5000/api/auth/login \
>   -H "Content-Type: application/json" \
>   -d '{"username":"dev-user","password":"<dev-user-password>"}' | jq -r .token)
> ```

#### Labelling Trips With Town Names

- Run the following command to label the drives / trips completed:

```bash
# curl command to label each trip inside the 'trip' database table
curl -s -X POST http://localhost:5000/api/places/relabel \
  -H "Authorization: Bearer $TOKEN_DEV" | jq
```

- The output of the above command is this:

```js
{
  "relabelled_trips": 14
}
```

#### Find Start and End Location For Single Trip

- Run the following command to:

```bash
# curl command to find start and end coordinates
curl -s http://localhost:5000/api/trips/5 \
  -H "Authorization: Bearer $TOKEN_DEV" | jq '.start, .end'
```

- The output of the above command is this:

```js
{
  "latitude": <redacted>,
  "longitude": <redacted>,
  "label": "Port Louis"
}
{
  "latitude": <redacted>,
  "longitude": <redacted>,
  "label": "Port Louis"
}
```

#### Add Place Specific Trip Above Started

- Run the following command to add a name to the start location:

```bash
# first get the longitude and latitude data
LAT=$(
 curl -s http://localhost:5000/api/trips/5 \
   -H "Authorization: Bearer $TOKEN_DEV" | jq -r .start.latitude
)

LON=$(
 curl -s http://localhost:5000/api/trips/5 \
   -H "Authorization: Bearer $TOKEN_DEV" | jq -r .start.longitude
)

# curl command to add a name to the start location of trip above
curl -s -X POST http://localhost:5000/api/places \
  -H "Authorization: Bearer $TOKEN_DEV" -H "Content-Type: application/json" \
  -d '{"label":"United Bus Service Ltd","latitude":'"$LAT"',"longitude":'"$LON"',"radius_m":200}' | jq
```

- The output of the above command is this:

```js
{
  "id": 1,
  "label": "United Bus Service Ltd",
  "latitude": <redacted>,
  "longitude": <redacted>,
  "radius_m": 200
}
```

#### Relabel Again To Check New Start Location

- Run the following command to relabel the locations again:

```bash
# curl command to check if the new location has been applied
curl -s -X POST http://localhost:5000/api/places/relabel \
  -H "Authorization: Bearer $TOKEN_DEV" | jq
```

- The output of the above command is this:

```js
{
  "relabelled_trips": 14
}
```

#### Check Location Again

- Run the following command to check for new start location:

```bash
# curl command to check for the new start location for specific trip above
curl -s http://localhost:5000/api/trips/5 \
  -H "Authorization: Bearer $TOKEN_DEV" | jq '.start'
```

- The output of the above command is this:

```js
{
  "latitude": <redacted>,
  "longitude": <redacted>,
  "label": "United Bus Service Ltd"
}
```

#### Test Coordinates (0, 0)

- Run the following command to check if coordinates (0,0) is rejected:

```bash
# curl command to check rejection of invalid coordinates
curl -s -X POST http://localhost:5000/api/places \
  -H "Authorization: Bearer $TOKEN_DEV" \
  -H "Content-Type: application/json" \
  -d '{"label":"Nowhere","latitude":0,"longitude":0}' | jq
```

- The output of the above command is this:

```js
{
  "error": "0,0 is not a real position"
}
```

#### Reject Extreme Radius Value

- Run the following command to check if large radius values are rejected:

```bash
# curl command to reject extremely large radius value
curl -s -X POST http://localhost:5000/api/places \
  -H "Authorization: Bearer $TOKEN_DEV" \
  -H "Content-Type: application/json" \
  -d '{"label":"Huge","latitude":'"$LAT"',"longitude":'"$LAT"',"radius_m":99999}' | jq
```

- The output of the above command is this:

```js
{
  "error": "Radius must be a whole number between 20 and 2000 metres"
}
```

#### Check List Of Places For `testuser`

- Run the following command to list out all the places for `testuser`:

```bash
# curl command to check list of places for `testuser`
curl -s http://localhost:5000/api/places \
  -H "Authorization: Bearer $TOKEN" | jq
```

- The output of the above command is this:

```js
[];
```

#### Check If `testuser` Can Access `dev-user` places

- Run the following command to access `dev-user`'s places:

```bash
# curl command to check if `testuser` can see `dev-user`'s data
curl -s -X PATCH http://localhost:5000/api/places/5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"Hacked"}' | jq
```

- The output of the above command is this:

```js
{
  "error": "Place not found"
}
```

#### Delete `dev-user` Place From `testuser`

- Run the following command to try to delete `dev-user`'s place:

```bash
# curl command to delete `dev-user` starting location for above trip
# WARNING: this should throw an error ==> unauthorised!
curl -s -X DELETE http://localhost:5000/api/places/1 \
  -H "Authorization: Bearer $TOKEN" \
  -o /dev/null \
  -w "%{http_code}\n"
```

- The output of the above command is this:

```js
404;
```

#### Delete `dev-user` Place

- Run the following command to delete created place by `dev-user`:

```bash
# curl command to delete the created starting location by `dev-user`
curl -s -X DELETE http://localhost:5000/api/places/1 \
  -H "Authorization: Bearer $TOKEN_DEV" \
  -o /dev/null \
  -w "%{http_code}\n"
```

- The output of the above command is this:

```js
204;
```

#### Relabel Again To Clean Data

- Run the following command to clean up everything:

```bash
# curl command to relabel the data again after deleting the above starting location
curl -s -X POST http://localhost:5000/api/places/relabel \
  -H "Authorization: Bearer $TOKEN_DEV" | jq

```

- The output of the above command is this:

```js
{
  "relabelled_trips": 14
}
```

> [!TIP]
> You can use the following `curl` command to check that we are now using our fallback `towns.js` file locations
>
> - Run the following `curl` command to check:
>
> ```bash
> curl -s http://localhost:5000/api/trips/5 \
>   -H "Authorization: Bearer $TOKEN_DEV" | jq '.start
> ```
>
> - Therefore, we should get something like this:
>
> ```console
> {
>   "latitude": <redacted>,
>   "longitude": <redacted>,
>   "label": "Port Louis"
> }
> ```

## Rebuild Trips Script

- Create the following `server/scripts/rebuild-trips.js` file:

```js
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
```

### Update `package.json` File

```json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "nodemon app.js",
    "start": "node app.js",
    "rebuild": "node scripts/rebuild-trips.js"
  },
```

### Test Rebuild Script

1. Stop / Kill `dev` server ( _kill `npm run dev` command_ )
2. Run the `scripts/rebuild-trips.js` file using: `node scripts/rebuild-trips.js 1`
3. Start the development server using: `npm run dev`
4. Run the following `curl` command: `curl -s "http://localhost:5000/api/trips?all=true" -H "Authorization: Bearer $TOKEN_DEV" | jq length`
5. Check the database for the start and end labels or using the `curl` command ( _see above_ )

## Update Error Handler

- Update the error handling in `app.js`:

> Replace the end with this!

```js
// error handler --> must come after the routes
// NOTE: Express.js 5 sends errors thrown inside 'async' handlers here automatically
app.use((err, req, res, next) => {
  // malformed JSON in the request body is the client's mistake not ours
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

// start the server
// NOTE: '0.0.0.0' ==> listen on all network interfaces so the mobile app can reach it not only 'localhost'
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on 'http://localhost:${PORT}'`);
  startSync();
});
```

> [!TIP]
> We can test it using the following `curl` command.
>
> ```bash
> # curl command to check for malformed 'JSON' data
> curl -s -X POST http://localhost:5000/api/places \
>   -H "Authorization: Bearer $TOKEN_DEV" \
>   -H "Content-Type: application/json" \
>   -d '{"label":' | jq
> ```
>
> - You should see that we have the following output:
>
> ```json
> {
>   "error": "Invalid JSON body"
> }
> ```

# Client

Given that the back-end is now complete; we are going to move onto working on the front-end whereby the user will be able to interact with the application.

> [!WARNING]
> Given that the lecturer(s) said that AI was allowed...
>
> Instead of manually doing everything from scratch; I am basically going to use [opencode](https://opencode.ai/) and then guide it through in order make the front-end.
>
> Nevertheless, the lecturer told us to include our prompt. Hence, below you are going to find the prompt that we used in order to the agentic tool to work on the front-end.

## Prompt Used

Here is the prompt that has been used in order to allow agentic tools like 'opencode' to make the front-end of the website:

```console
You are building the web frontend for "Car Tracker and Driver Rater" in the existing folder `client/` at the root of this repository. The backend (`server/`) is finished and running at http://localhost:5000. Do NOT modify anything outside `client/`.

READ FIRST (in this order, before writing any code)
1. ARCHITECTURE.md (repo root), especially section 10 (Web app) and section 14 (Guide for AI agents / invariants). If the code and that file disagree, tell me and do not change either.
2. The server code, which is the API contract (there is no separate API doc): `server/app.js`, `server/routes/*.js`, `server/services/tripQueries.js`, `statusQueries.js`, `deviceService.js`, `placeQueries.js`, `scoring.js`, `server/config/index.js`. Read the exact response shapes and error messages from the code; do not guess field names.

STACK (fixed, do not substitute)
- Vite + React in plain JavaScript/JSX. No TypeScript anywhere.
- Tailwind CSS (v4, @tailwindcss/vite plugin), shadcn/ui (generated as JS, `@/` alias to `src/` via jsconfig.json), Recharts through shadcn's chart component, react-leaflet + OpenStreetMap tiles, react-router-dom.
- If `client/` already contains files, keep them. Configure the API URL through `VITE_API_URL` (default http://localhost:5000) in `client/.env`, add `client/.env.example`, and make sure `.env` is git-ignored. Never put a secret in a VITE_ variable.

RULES (from the architecture invariants)
- The API sends and stores UTC. Convert to Mauritius time (Indian/Mauritius, UTC+4) only for display.
- Lateral G is positive when turning right (car direction). Use this rule everywhere: labels say "Right turn" / "Left turn", "Accelerating" / "Braking".
- Never score or rate speed. Speed is only displayed.
- Rating comes from the API (`score`, and the label derived from it). Do not recompute scores or ratings in the client.
- Do not call any geocoding API. Place names come from the API labels.
- Never display or log a ThingSpeak read key. It is write-only in the settings form; the API only returns `has_read_key`.
- Every API request goes through ONE helper (`src/lib/api.js`) that adds `Authorization: Bearer <token>`, turns `{ error: "..." }` responses into thrown errors with that message, and on a 401 (except on the login request) clears the token and sends the user to the login page. Wrap every localStorage access in try/catch and make the app work without it.
- Use the exact error messages the server returns; do not invent new ones.
- Do not edit server code. If you find that the API lacks something you need, list it in your final report instead of working around it silently. (Known gap: the 0.30 g event threshold is not exposed by the API, so define it as a clearly named constant in `src/lib/constants.js` with a comment that it must match `server/config/index.js`.)

CODE STYLE
- I am a student and must be able to explain every file. One component per file, small components, readable names, no clever abstractions.
- Short lowercase comments in this style: `// what this does ==> why`. Comment the non-obvious parts only.
- Responsive (works at phone width, no horizontal page scroll), accessible (labels on inputs, colour never the only signal: badges and status dots always have text), and supports light and dark mode through shadcn's theme tokens.
- Keep the look clean and consistent: shadcn Card/Table/Badge/Button/Dialog/Tabs, one page layout with a top navigation bar (Trips, Status, Settings, username, Log out).

MILESTONES (do them in this order; run `npm run build` and the linter after each one and fix everything before moving on)

1. Setup and authentication
   - Scaffold into `client/`, install the stack, configure the alias and shadcn.
   - `AuthContext` (user, loading, login, register, logout), `ProtectedRoute`, and one `AuthPage` component for /login and /register.
   - Register takes username, email, password. Login takes username and password. After login or register, call GET /api/auth/me to get the user. Show the server's error text under the form.
   - Logged-in users who open /login are redirected to /.

2. Past trips page (route "/")
   - Table from GET /api/trips: date and time (Mauritius), duration, distance in km, max speed, score, rating badge (colour AND text), start label to end label. Click a row to open the trip view.
   - A switch "Show short sessions" that calls the API with `?all=true`. By default only rated trips (>= 1 km) are shown, which is the API default.
   - A "last 5 trips" comparison: average score of the 5 newest finished trips next to a hardcoded baseline defined in `src/lib/constants.js` (placeholder value, clearly commented as such).
   - Loading, empty ("No trips yet") and error states.

3. Trip view (route "/trips/:id") - the main page
   - Header: score and rating badge, date, duration, distance, max speed, start and end labels. If the trip is still in progress, say so and show no rating. If the score is null, explain it is under the minimum distance.
   - Event counts per type (accelerating, braking, cornering) next to the score, from GET /api/trips/:id.
   - Route map from GET /api/trips/:id/track: Leaflet + OpenStreetMap, with the "© OpenStreetMap contributors" credit visible. Keep the map in ONE `TripMap` component so the library could be swapped. Draw only points that have latitude/longitude and a speed above ~3 km/h (skips GPS scribble while stopped). Colour the route by resultant G in three buckets (below half the threshold = green, up to the threshold = amber, above it = red) and merge consecutive same-colour segments into one polyline; enable `preferCanvas`. Fit the map to the route. Start and end markers. Pins for the harsh events from GET /api/trips/:id/events (icon or colour per type, popup with type, time, peak G and speed).
   - Use CircleMarker or divIcon for markers, NOT Leaflet's default image icons (they break under Vite's bundling).
   - Charts (Recharts via shadcn chart): speed over time, and longitudinal G and lateral G over time with a reference line at +/- the threshold constant. The track can have thousands of points: downsample to about 600 points for the charts, keeping the peak value per bucket so spikes are not hidden. Hovering a chart moves a dot on the route (shared timestamps).
   - Direction-meter (priority): radar chart with axes Accelerating, Braking, Left turn, Right turn, plotting the trip's max G per direction (max_accel_g, max_brake_g, max_left_g, max_right_g) on a FIXED scale of 0 to 0.6 g so trips are comparable. Show the threshold ring. Optionally overlay the average of the last 5 trips from GET /api/trips.
   - Stretch (only if everything else works): G-meter scatter of lateral G (x) against longitudinal G (y) with rings at 0.1, 0.2 and 0.3 g.
   - 404 state when the API says "Trip not found".

4. Hardware status page (route "/status")
   - From GET /api/status, refreshed every 10 seconds (clear the timer on unmount). For each device: label, ONLINE/OFFLINE badge, data age ("12 s ago"), GPS and IMU indicators using the API's `state` values: "unknown" = grey, "warning" = orange, "ok" = green, each with its text `message`. Last known position on a small map (use the same `TripMap` approach or a tiny separate map) with its timestamp. Empty state when there are no devices, with a link to Settings.

5. Settings page (route "/settings"), two sections
   - Devices: list from GET /api/devices (label, channel ID, "read key saved"). Add form (label, ThingSpeak channel ID as a number, read key as a password field) via POST; edit label, channel ID, and optionally a new read key via PATCH (an empty key field means "keep the current key"); delete via DELETE behind a confirmation dialog that clearly warns it also deletes that device's samples and trips. Show the server's error messages (for example when ThingSpeak rejects the key, or the channel is already registered).
   - Places: list from GET /api/places. Add and edit with: name, a Leaflet map where clicking drops the pin, a radius slider from 20 to 2000 m (default 150) with a circle drawn on the map at that radius, and a number display of the radius. Delete with confirmation. After every add, edit or delete, call POST /api/places/relabel so existing trips get the new names, and tell the user it was done. Include a short privacy note: places stay in your own account and are never shared.

TESTING
- Start the API if it is not running (`cd server && npm run dev` in a separate terminal). Do not print or store any password or token in files or in the chat.
- Create a throwaway user through the UI (username `uitest`) to test everything, and tell me at the end to delete it from the database. I will provide my real login if you need to see real trip data; ask me for it only when you reach milestone 2, and never write it to any file.
- Verify each page against the running API, not only that it compiles. If a page needs data I do not have (an in-progress trip, a trip with no GPS fix), say what you could not verify.

WHEN YOU FINISH
- Do not commit anything. Leave the changes for me to review.
- Give a short report: what was built per milestone, how to run it, what you could not verify, any API gaps or surprises you found in the server code, and any decision you made that I should know about.
```

---

# Socials

- **Instagram**: <https://www.instagram.com/s.sunhaloo>
- **YouTube**: <https://www.youtube.com/channel/UCMkQZsuW6eHMhdUObLPSpwg>
- **GitHub**: <https://www.github.com/Sunhaloo>

---

S.Sunhaloo
Thank You!
