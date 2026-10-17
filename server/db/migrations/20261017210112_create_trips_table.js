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

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// deletion of 'trips' table
exports.down = function (knex) {
  // delete the 'trips' table when `.down` called
  return knex.schema.dropTableIfExists("trips");
};
