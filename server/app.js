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

// test route ==> proves the server is running
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
// NOTE: '0.0.0.0' ==> listen on all network interfaces so the mobile app can reach it, not only 'localhost'
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on 'http://localhost:${PORT}'`);
});
