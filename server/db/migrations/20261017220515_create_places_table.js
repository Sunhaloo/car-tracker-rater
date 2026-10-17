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
