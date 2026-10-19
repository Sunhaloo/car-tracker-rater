// import the data found in our `.env` file
require("dotenv").config();

// import the `encrypt` and `decrypt` from the `server/encryption.js` file
const { encrypt, decrypt } = require("./services/encryption");

// create the plain text string
const secret = "FAKEREADKEY12345";

// encrypt the plain text using the imported function
const packed = encrypt(secret);

console.log("encrypted:", packed);

// 1. round trip ==> should print true
console.log("round trip ok:", decrypt(packed) === secret);

// 2. random IV ==> encrypting the same text twice should give different output --> so print true
console.log("different each time:", encrypt(secret) !== packed);

// 3. tampering ==> changing one character must make decrypt throw
try {
  const [iv, tag, data] = packed.split(":");
  const broken = [iv, tag, "A" + data.slice(1)].join(":");
  decrypt(broken);
  console.log("tamper test: FAILED ( it decrypted )");
} catch (err) {
  console.log("tamper test ok:", err.message);
}
