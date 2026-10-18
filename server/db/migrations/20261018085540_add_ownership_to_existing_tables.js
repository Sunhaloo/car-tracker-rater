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
