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
