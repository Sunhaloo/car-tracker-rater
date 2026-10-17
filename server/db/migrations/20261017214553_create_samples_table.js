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
