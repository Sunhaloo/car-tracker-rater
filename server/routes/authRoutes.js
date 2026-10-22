// register, login and "who am I"
// NOTE: there is no logout route ==> a token is stateless, so logging out = the client deletes its token

// import the 'express' library
const express = require("express");
// import the `bcryptjs` library
const bcrypt = require("bcryptjs");
// import the `jsonwebtoken` library
const jwt = require("jsonwebtoken");
// create the database connection
const db = require("../db/knex");
// import the `config/index.js` file in order to have access to constants
const config = require("../config");
// import the `authenticate` from `middleware/auth.js` file
const { authenticate } = require("../middleware/auth");

// router holding every '/api/auth' route
const router = express.Router();

// username ==> 3 - 30 characters --> lowercase letters, digits or '_' ( case handled by normalising )
const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
// email ==> basic "xx@yy.zz" check ( not the full email specification )
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// bcrypt only looks at the first 72 bytes of a password
// INFO: refuse longer ones instead of silently cutting them
const MAX_PASSWORD_LENGTH = 72;

// used when the username does not exist ==> so a wrong username and a wrong password take the same time
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", config.bcryptRounds);

// create a login token ==> 'sub' is the JWT standard "subject" claim ( holds the user id )
function signToken(user) {
  return jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, {
    expiresIn: config.jwtExpiresIn,
  });
}

// `POST /api/auth/register` ==> { username, email, password }
router.post("/register", async (req, res) => {
  // normalise once ==> 'Username' and 'username' are the same account
  const username = String(req.body.username ?? "")
    .trim()
    .toLowerCase();
  const email = String(req.body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password ?? "");

  // back-end validation --> validate all three fields before touching the database
  if (!USERNAME_PATTERN.test(username)) {
    return res.status(400).json({
      error: "Username must be 3-30 characters: letters, digits or _",
    });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  if (
    password.length < config.minPasswordLength ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return res.status(400).json({
      error: `Password must be ${config.minPasswordLength}-${MAX_PASSWORD_LENGTH} characters`,
    });
  }

  try {
    // hash the password ==> it is never stored in plain text
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // create the user, returning only the safe columns ( never the hash )
    const [user] = await db("users")
      .insert({ username, email, password_hash: passwordHash })
      .returning(["id", "username"]);

    // 201 = created ==> log them in straight away by returning a token
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    // 23505 = Postgres "unique violation" ( username or email already taken )
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Username or email already in use" });
    }
    // handled by the `server/app.js` file
    throw err;
  }
});

// `POST /api/auth/login` ==>  { username, password }
router.post("/login", async (req, res) => {
  const username = String(req.body.username ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password ?? "");

  // find the user by the normalised username
  const user = await db("users")
    .where({ username })
    .first("id", "username", "password_hash");

  // always run the comparison, even for an unknown username
  const passwordOk = await bcrypt.compare(
    password,
    user ? user.password_hash : DUMMY_HASH,
  );

  // one generic message ==> never reveal which usernames exist
  if (!user || !passwordOk) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  // success ==> return a fresh token and the public user fields
  res.json({
    token: signToken(user),
    user: { id: user.id, username: user.username },
  });
});

// `GET /api/auth/me`` ==> client check that its stored token is still valid
router.get("/me", authenticate, async (req, res) => {
  // load the current user from the id inside the token
  const user = await db("users")
    .where({ id: req.user.id })
    .first("id", "username", "email", "created_at");

  // the account was deleted after the token was issued
  if (!user) return res.status(401).json({ error: "User no longer exists" });

  // return the public fields ( no password hash )
  res.json(user);
});

// make the `router` available to other files
module.exports = router;
