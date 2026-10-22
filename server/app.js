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
const tripRouter = require("./routes/tripRoutes.js");
const deviceRouter = require("./routes/deviceRoutes.js");

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

// authentication routes ==>  register / login / me
app.use("/api/auth", authRouter);

// trip routes ==> list / latest / one trip / track / events
// WARNING: needs the JWT token to have access
app.use("/api/trips", tripRouter);

// device routes ==> list / add / change / remove
// WARNING: needs the JWT token to have access
app.use("/api/devices", deviceRouter);

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
