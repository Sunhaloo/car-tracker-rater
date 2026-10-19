// encrypts and decrypts the users' ThingSpeak read keys using 'AES-256-GCM'

// import the built-in 'crypto' library
const crypto = require("crypto");

// define the encryption ALGORITHM to be used ==> again in this case --> 'AES-256-GCM'
const ALGORITHM = "aes-256-gcm";

// NOTE: GCM "mode" works best with a 12-byte 'Initialisation Vector' ( IV )
const IV_LENGTH = 12;

// read the master key from '.env'
function getKey() {
  const hex = process.env.ENCRYPTION_KEY;

  // check if the length of encryption key generated is 64 characters in length
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters ( 32 bytes )");
  }

  // simply return the actual encryption key ( to be used by other functions )
  return Buffer.from(hex, "hex");
}

// encryption of plain text data to cipther text
function encrypt(plainText) {
  // create a new random IV each time
  // INFO: this is done to randomise the output for same text
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  // encrypt the plain text string with AES
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  // cryptographic fingerprint acting as tamper-detection system
  // INFO: this is done in order to verify data has not been changed
  const authTag = cipher.getAuthTag();

  // return the required data ( to be used by other functions )
  return [iv, authTag, encrypted]
    .map((part) => part.toString("base64"))
    .join(":");
}

// decryption of cipher text data to plain text
function decrypt(payload) {
  // split the data individually
  const [ivB64, tagB64, dataB64] = payload.split(":");

  // try to find the IV in order to create correct output
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64"),
  );

  // check for tampering of data
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  // decrypt the cipher text into plain text
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);

  // simply return the plain text to the program
  return decrypted.toString("utf8");
}

// make the 2 functions available to other files
module.exports = { encrypt, decrypt };
