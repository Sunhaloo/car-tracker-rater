// import the `knex` library and our configuration
const knex = require("knex");

// import the configuration for knex.js found inside `knexfile.js`
const knexconfig = require("../knexfile.js");

// initialise knex with our `knexfile.js` configuration file
const db = knex(knexconfig);

// export the connection ( to be used in other files )
module.exports = db;
