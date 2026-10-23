// import the `knex.js` file to create database connection
const db = require("../db/knex");
// import all the data that we have inside the `config` directory ==> `index.js` "constants" file
const config = require("../config");

// `status_bits` number to booleans
function decodeStatus(bits) {
  // JS object --> one bit per sensor ( set bit ==> `true` )
  return {
    gpsTalking: (bits & config.statusBits.gpsTalking) !== 0,
    gpsFix: (bits & config.statusBits.gpsFix) !== 0,
    imu: (bits & config.statusBits.imu) !== 0,
  };
}

// booleans to the light colours
// NOTE:
// 1. grey = unknown
// 2. orange = problem
// 3. green = ok
function sensorStates(bits, online) {
  // offline / no row yet ==> we cannot say anything about the sensors
  if (!online || bits === null || bits === undefined) {
    return {
      gps: { state: "unknown", message: "No recent data" },
      imu: { state: "unknown", message: "No recent data" },
    };
  }

  // unpack the bitfield into the three sensor flags
  const { gpsTalking, gpsFix, imu } = decodeStatus(bits);

  // best case first ==> a fix --> then talking-but-no-fix --> then silent
  let gps;
  if (gpsFix) gps = { state: "ok", message: "GPS fix" };
  else if (gpsTalking) gps = { state: "warning", message: "No GPS fix yet" };
  else gps = { state: "warning", message: "GPS not responding" };

  // same light shape for the IMU sensor
  return {
    gps,
    imu: imu
      ? { state: "ok", message: "IMU working" }
      : { state: "warning", message: "IMU not responding" },
  };
}

// status of ONE device ==> online flag / last seen / the sensor lights / the last GPS fix
async function getDeviceStatus(device, now) {
  // newest sample of this device ==> tells us if it is still alive
  const latest = await db("samples")
    .where({ device_id: device.id })
    .orderBy("created_at", "desc")
    .first("created_at", "status_bits");

  // newest row WITH a position ( the latest row may be a no-fix row )
  const lastFix = await db("samples")
    .where({ device_id: device.id })
    .whereNotNull("latitude")
    .whereNotNull("longitude")
    .orderBy("created_at", "desc")
    .first("created_at", "latitude", "longitude");

  // how old the newest sample is ==> `null` when the device never sent anything
  const ageMs = latest ? now - latest.created_at.getTime() : null;
  // online while the newest sample is younger than 'offlineAfterMs'
  const online = ageMs !== null && ageMs <= config.offlineAfterMs;

  return {
    device_id: device.id,
    label: device.label,
    online,
    last_seen: latest ? latest.created_at : null,
    // age in whole seconds ( `null` when there is no row at all )
    data_age_s: ageMs === null ? null : Math.round(ageMs / 1000),
    // spread the two sensor lights into 'gps' and 'imu'
    ...sensorStates(latest ? latest.status_bits : null, online),
    // newest position with a GPS fix, or `null` when the device never had one
    last_position: lastFix
      ? {
          latitude: lastFix.latitude,
          longitude: lastFix.longitude,
          time: lastFix.created_at,
        }
      : null,
  };
}

// all devices of this user
// NOTE: "now" is taken ONCE and passed down ==> every device is judged against the same clock
async function getStatus(userId) {
  // one timestamp for the whole response
  const now = Date.now();
  // the devices that belong to this user ( oldest first )
  const devices = await db("devices")
    .where({ user_id: userId })
    .orderBy("id")
    .select("id", "label");

  return {
    // when this snapshot was taken
    checked_at: new Date(now).toISOString(),
    // one status object per device ( the queries run in parallel )
    devices: await Promise.all(
      devices.map((device) => getDeviceStatus(device, now)),
    ),
  };
}

// make these functions available to other files
module.exports = { getStatus, decodeStatus, sensorStates };
