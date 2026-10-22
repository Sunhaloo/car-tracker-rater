// import the `jsonwebtoken` library
const jwt = require("jsonwebtoken");

// Express.js middleware ==> runs before the route handler it protects
function authenticate(req, res, next) {
  // split the "Authorization" header into its scheme and its token
  // INFO: a missing header falls back to "" ==> `split` yields [''] so both parts are undefined
  const [scheme, token] = (req.headers.authorization || "").split(" ");

  // reject a missing header --> a wrong scheme or an empty token early
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    // check the signature and the expiry against the secret ==> throws when invalid or expired
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // the token holds the user's id ( not the `username` which could change )
    // INFO: `sub` is the JWT standard "subject" claim
    req.user = { id: payload.sub };

    // token is valid ==> hand control to the route handler
    next();
  } catch {
    // deliberately no error detail ==> a bad signature, expired or malformed all give the same 401
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// make the function available to other files
module.exports = { authenticate };
