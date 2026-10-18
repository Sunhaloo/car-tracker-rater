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
    // INFO: `CASCADE` means that deleting a 'user' will delete all related 'devices'
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
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

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
