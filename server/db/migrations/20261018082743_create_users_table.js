/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// creation of 'users' table
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
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
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
