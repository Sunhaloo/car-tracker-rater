#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <time.h>
#include <Wire.h>
#include <MPU6500_WE.h>
#include <TinyGPSPlus.h>

// header file containing confidential data such as API keys and WiFi passwords
// WARNING: this should never be committed to the repository
#include "secrets.h"

// shared types (Row, Peak, RowFlags)
#include "types.h"


// serial bus address for the IMU's MPU6500 board
#define MPU6500_ADDR 0x68

// constant for u-blox GPS pinouts
#define GPS_RX 16
#define GPS_TX 17

// constant for status LEDs pinouts
#define LED_RED_PIN 23
#define LED_GREEN_PIN 25

// timing configuration for each "sensor" including the WiFi retry

// read the IMU sensor 50 times per second
const unsigned long IMU_INTERVAL_MS = 20;
// bulk updates to ThingSpeak every 20 seconds or so
const unsigned long UPLOAD_INTERVAL_MS = 20000;
// stale GPS data after 2 seconds
const unsigned long GPS_FRESH_MS = 2000;
// retry connection to WiFi every 10 seconds
const unsigned long WIFI_RETRY_MS = 10000;
// check if the internal ESP clock is valid ( time after November 2023 - NTP )
const time_t CLOCK_VALID_AFTER = 1700000000;

// need to have at least 15 seconds between each uploads to ThingSpeak
// NOTE: this is because we are on the free-tier version + the line below needs to be 'true'
static_assert(UPLOAD_INTERVAL_MS >= 15000, "ThingSpeak needs >= 15 s between bulk_update calls");

// data buffer configuration
// INFO: again we need to buffer as we can only upload data in bulk to ThingSpeak

// size of the buffer that the ESP can hold in RAM
const int BUF_CAP = 600;
// maximum number of rows that we can upload to ThingSpeak at one time
const int MAX_BATCH_ROWS = 150;

// WARNING: make sure that the (bread) board is positioned correctly ( check IMU )
// 1. y-axis should be pointing forward ==> towards the windshield
// 2. x-axis should be pointing to the right ==> towards the driver seat
// 3. z-axis should be pointing to the upward ==> meaning that you do see the sensor

// function to determine the longitudinal Gs
inline float pickLong(const xyzFloat& g) { 
  // INFO: positive ==> acceleration, negative ==> braking
  return  g.y;
}

// function to determine the lateral Gs
inline float pickLat (const xyzFloat& g) {
  // INFO: positive ==> right turn, negative ==> left turn
  return  g.x;
}

// function to determine the yaw ( where the car's nose is "pointing" )
inline float pickYaw (const xyzFloat& w) {
  // INFO: positive ==> right, negative ==> left
  return -w.z;
}

// create object to talk to with correct sensor on bus line
MPU6500_WE myMPU6500 = MPU6500_WE(MPU6500_ADDR);

// create the GPS object
TinyGPSPlus gps;

// check if IMU has been able to establish connection on boot
bool imuOk = false;
// check if IMU still answers on the right bus
bool imuAlive = false;

// create a user-defined ( struct ) `Row` row data
// INFO: see `types.h` file for more information
Row rows[BUF_CAP];
// number of rows for each bulk of data
int rowCount = 0;


// keep the largest value and preserves the "direction" during the current second
// INFO: see `types.h` file for more information
void updatePeak(Peak& p, float x) {
  // we initially have no values and also set the "sign direction"
  if (!p.has || fabsf(x) > fabsf(p.value)) {
    p.value = x;
    p.has = true;
  }
}

// create user-defined `Peak` data type for rapidly changing variables
Peak pSpeed, pLong, pLat, pYaw;

// function to reset the maximum values
void resetPeaks() {
  pSpeed = Peak();
  pLong = Peak();
  pLat = Peak();
  pYaw = Peak();
}

// check the status for the different sensors, WiFi and ThingSpeak
unsigned long lastImu = 0;
unsigned long lastUpload = 0;
unsigned long lastWifiTry = 0;
unsigned long lastCharsMs = 0;
uint32_t lastChars = 0;
bool lastUploadOk = true;
bool ntpStarted = false;
bool clockSynced = false;
time_t lastRowEpoch = 0;

// feed the GPS parser and remember when bytes last arrived
void feedGps() {
  // check if we have serial communication
  while (Serial2.available()) {
    // feed the raw data bytes and store them for use
    gps.encode(Serial2.read());
  }

  // try to get all the characters from the raw data
  uint32_t chars = gps.charsProcessed();

  // update the characters from the raw data if they are new data
  if (chars != lastChars) {
    lastChars = chars;
    lastCharsMs = millis();
  }
}

// WiFi should be kept alive without blocking
// INFO: this means that the data will continue to log even if offline
void maintainWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    // start NTP once, as soon as we have a connection
    if (!ntpStarted) {
      // do the time syncing as soon as we have WiFi connection
      configTime(0, 0, "pool.ntp.org", "time.google.com");

      // change the status
      ntpStarted = true;

      Serial.println("WiFi connected, NTP started");
    }
    return;
  }

  // retry WiFi connnection if we have lost it
  if (millis() - lastWifiTry >= WIFI_RETRY_MS) {
    lastWifiTry = millis();
    Serial.println("WiFi not connected, retrying...");
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }
}

// clock still synced up after first sync even if WiFi connection is lost
void checkClock() {
  if (!clockSynced && time(nullptr) > CLOCK_VALID_AFTER) {
    clockSynced = true;
    Serial.println("Clock synced, logging starts");
  }
}

// read the IMU and u-blox GPS sensor data
void sampleSensors() {
  // IMU sensor
  Wire.beginTransmission(MPU6500_ADDR);
  imuAlive = (Wire.endTransmission() == 0);

  // get the 'G' values from the IMU sensor
  if (imuOk && imuAlive) {
    xyzFloat g   = myMPU6500.getGValues();
    xyzFloat gyr = myMPU6500.getGyrValues();

    updatePeak(pLong, pickLong(g));
    updatePeak(pLat,  pickLat(g));
    updatePeak(pYaw,  pickYaw(gyr));
  }

  // get the speed from the u-blox GPS sensor
  if (gps.speed.isValid() && gps.speed.age() < GPS_FRESH_MS) {
    updatePeak(pSpeed, gps.speed.kmph());
  }
}

// to check if the GPS module is alive
bool gpsTalking() {
  return (millis() - lastCharsMs) < GPS_FRESH_MS;
}

// to check if GPS has a "fix" ==> communication to satellites ( minimum 4 needed )
bool gpsHasFix() {
  return gpsTalking() && gps.location.isValid() && gps.location.age() < GPS_FRESH_MS;
}

// turn on the green LED when all systems are active and working
void updateLeds() {
  bool allGood = clockSynced
              && WiFi.status() == WL_CONNECTED
              && gpsTalking()
              && gpsHasFix()
              && imuOk && imuAlive
              && lastUploadOk;

  // ternary operator to check for all system alive
  // INFO: green LED ==> all working, red LED ==> one or many not working
  digitalWrite(LED_GREEN_PIN, allGood ? HIGH : LOW);
  digitalWrite(LED_RED_PIN,   allGood ? LOW  : HIGH);
}

// read and buffer the data to the created `rows` buffer
void pushRow(const Row& r) {
  // check if the buffer is currently full
  if (rowCount == BUF_CAP) {
    // if so --> simply remove old data from bufer
    // WARNING: instead of removing everything ==> only oldest row deleted
    // this is not done for computing performance but rather to still have data
    memmove(&rows[0], &rows[1], (BUF_CAP - 1) * sizeof(Row));
    rowCount--;
    Serial.println("Buffer full: dropped oldest row");
  }

  // if buffer not full ==> simply add the new row
  rows[rowCount++] = r;
}

// pack all the gathered data into an actual row
void finalizeRow(time_t ts) {
  // create a simple row structure
  Row r = {};

  // for `created_at` field
  r.ts = (uint32_t)ts;

  // for `field5` field ( get the value in terms of seconds )
  r.uptime = millis() / 1000;

  // status bits
  bool talking = gpsTalking();
  bool fix = gpsHasFix();

  // check the status bits for the GPS
  uint8_t status = 0;
  // bit 0 ==> GPS talking
  if (talking) status |= 1;
  // bit 1 ==> GPS has satellites communication
  if (fix)     status |= 2;
  // bit 2 ==> IMU responds
  if (imuOk && imuAlive) status |= 4;

  // set the status for the current second
  r.status = status;

  // IMU sensor values ==> skip if the IMU sensor did not answer this second
  if (pLong.has) { r.longG = pLong.value; r.flags |= HAS_LONG; }
  if (pLat.has)  { r.latG  = pLat.value;  r.flags |= HAS_LAT; }
  if (pYaw.has)  { r.yaw   = pYaw.value;  r.flags |= HAS_YAW; }

  // GPS values
  if (pSpeed.has) { r.speed = pSpeed.value; r.flags |= HAS_SPEED; }

  // if we do have communication with satellites
  if (fix) {
    r.lat = gps.location.lat();
    r.lng = gps.location.lng();
    r.flags |= HAS_POS;
    if (gps.altitude.isValid() && gps.altitude.age() < GPS_FRESH_MS) {
      r.elev = gps.altitude.meters();
      r.flags |= HAS_ELEV;
    }
  }

  // get the number of satellites from GPS sensor
  r.sats = (talking && gps.satellites.isValid()) ? (int8_t)gps.satellites.value() : -1;

  // call function to add the current row to the buffer
  pushRow(r);

  Serial.printf("row %lu | spd %.1f long %.2f lat %.2f yaw %.1f | st %u sats %d | buf %d\n",
    (unsigned long)r.ts,
    (r.flags & HAS_SPEED) ? r.speed : -1.0f,
    (r.flags & HAS_LONG) ? r.longG : 0.0f,
    (r.flags & HAS_LAT) ? r.latG : 0.0f,
    (r.flags & HAS_YAW) ? r.yaw : 0.0f,
    r.status, r.sats, rowCount);
}

// append one row to the JSON body
void appendRowJson(String& out, const Row& r) {
  char tmp[64];

  // field `created_at` ==> ISO 8601 UTC
  time_t t = (time_t)r.ts;
  struct tm tmv;
  gmtime_r(&t, &tmv);
  strftime(tmp, sizeof(tmp), "{\"created_at\":\"%Y-%m-%dT%H:%M:%SZ\"", &tmv);

  // write the string by adding array of characters
  out += tmp;

  // set field 1 to 4 for ThingSpeak
  if (r.flags & HAS_SPEED) { snprintf(tmp, sizeof(tmp), ",\"field1\":%.1f", r.speed); out += tmp; }
  if (r.flags & HAS_LONG)  { snprintf(tmp, sizeof(tmp), ",\"field2\":%.3f", r.longG); out += tmp; }
  if (r.flags & HAS_LAT)   { snprintf(tmp, sizeof(tmp), ",\"field3\":%.3f", r.latG);  out += tmp; }
  if (r.flags & HAS_YAW)   { snprintf(tmp, sizeof(tmp), ",\"field4\":%.1f", r.yaw);   out += tmp; }

  // set field 5, 6 for ThingSpeak
  snprintf(tmp, sizeof(tmp), ",\"field5\":%lu,\"field6\":%u", (unsigned long)r.uptime, r.status);

  // write the string by adding array of characters
  out += tmp;

  // no fix: latitude and longitude are left out completely (never 0,0)
  if (r.flags & HAS_POS) {
    snprintf(tmp, sizeof(tmp), ",\"latitude\":%.6f,\"longitude\":%.6f", r.lat, r.lng);
    out += tmp;
  }
  if (r.flags & HAS_ELEV) { snprintf(tmp, sizeof(tmp), ",\"elevation\":%.1f", r.elev); out += tmp; }

  if (r.sats >= 0) { snprintf(tmp, sizeof(tmp), ",\"status\":\"sats:%d\"", r.sats); out += tmp; }


  // write the string by adding array of characters
  // INFO: end of first row of data
  out += "}";
}

// upload each batch to rows to ThingSpeak
void uploadBatch() {
  // check if we have any rows inside the buffer
  if (rowCount == 0) return;

  // check if we have WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Upload skipped: no WiFi (rows stay in the buffer)");
    return;
  }

  // check if the current counts of rows is less than maximum rows admissible
  int n = (rowCount < MAX_BATCH_ROWS) ? rowCount : MAX_BATCH_ROWS;

  // add the write API key to the body ==> see documentation
  // INFO: https://www.mathworks.com/help/thingspeak/bulkwritejsondata.html
  String body;
  body.reserve(n * 170 + 120);
  body = "{\"write_api_key\":\"";
  body += WRITE_API_KEY;
  body += "\",\"updates\":[";

  for (int i = 0; i < n; i++) {
    if (i > 0) body += ",";
    appendRowJson(body, rows[i]);
  }

  body += "]}";

  // setup the channel link to write to
  String url = "https://api.thingspeak.com/channels/";
  url += String(CHANNEL_ID);
  url += "/bulk_update.json";

  WiFiClientSecure client;
  // skip the certification checking
  client.setInsecure();

  // setup the 'POST' requests to be able to update recorded data
  HTTPClient http;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(8000);

  unsigned long t0 = millis();
  int code = http.POST(body);
  unsigned long took = millis() - t0;
  http.end();

  // check if we were able to send data to ThingSpeak
  if (code == 202) {
    // if accepted ==> remove the row that has just been uploaded
    memmove(&rows[0], &rows[n], (rowCount - n) * sizeof(Row));
    rowCount -= n;

    lastUploadOk = true;
    Serial.printf("Upload OK: %d rows in %lu ms, %d left in buffer\n", n, took, rowCount);

    // if we try to upload before the 15 seconds delay
  } else if (code == 429) {
    lastUploadOk = false;
    Serial.printf("Upload refused (429, too soon), keeping %d rows\n", rowCount);

    // if we have not been able to upload any data to ThingSpeak
  } else {
    lastUploadOk = false;
    Serial.printf("Upload failed, HTTP code %d after %lu ms, keeping %d rows\n", code, took, rowCount);
  }
}

// setup board LEDs
void setup() {
  // setup the data transfer rate to match ESP boards
  Serial.begin(115200);

  // start the LEDs on 'RED' until everything is setup ( WiFi and sensors )

  // create the digital pins for both LEDs
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);

  // power on the LED with GPIO number 23
  digitalWrite(LED_RED_PIN, HIGH);
  // power off the LED with GPIO number 25
  digitalWrite(LED_GREEN_PIN, LOW);

  // set a bigger GPS receive ( data ) buffer
  Serial2.setRxBufferSize(2048);

  // setup the second data transfer rate for the GPS itself
  Serial2.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  // setup the WiFi connection credentials ( mobile hotspot )
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastWifiTry = millis();

  // IMU sensor --> initialise the bus using the default pins ( see physical connections )
  Wire.begin();

  // create variable for IMU sensor initialisation
  imuOk = myMPU6500.init();

  // IMU is not responding or has not been connected properly
  if (!imuOk) {
    Serial.println("MPU6500 does not respond - check wiring/address");

    // if IMU sensor is online
  } else {
    Serial.println("MPU6500 is connected");
    Serial.println("Keep the board flat and still - calibrating...");

    delay(1000);

    // calibrate the IMU sensor
    myMPU6500.autoOffsets();
    Serial.println("Calibration done!");

    // configure the IMU sensor ( accuarcy range for accelerometer and gyroscope )
    myMPU6500.setAccRange(MPU6500_ACC_RANGE_4G);
    myMPU6500.setGyrRange(MPU6500_GYRO_RANGE_500);
    myMPU6500.enableAccDLPF(true);
    myMPU6500.setAccDLPF(MPU6500_DLPF_6);
  }

  // find the time for the last upload
  lastUpload = millis();
}

// main function loop
void loop() {
  // always feed the GPS parser first
  feedGps();

  // WiFi and clock housekeeping ( non-blocking )
  maintainWifi();
  checkClock();

  // LEDs are updated on every pass ( even before the clock is synced )
  updateLeds();

  // rows are not logged until the clock is synced
  if (!clockSynced) return;

  // sample the sensors on their own timer
  if (millis() - lastImu >= IMU_INTERVAL_MS) {
    lastImu = millis();

    // call function to read the data from the sensors
    sampleSensors();
  }

  // when the UTC second changes --> close the finished second as one row
  time_t now = time(nullptr);
  if (lastRowEpoch == 0) {
    lastRowEpoch = now;
    resetPeaks();
  } else if (now > lastRowEpoch) {
    finalizeRow(lastRowEpoch);
    lastRowEpoch = now;
    resetPeaks();
  } else if (now < lastRowEpoch) {
    lastRowEpoch = now;
    resetPeaks();
  }

  // upload the buffer around every 20 s
  if (millis() - lastUpload >= UPLOAD_INTERVAL_MS) {
    lastUpload = millis();
    uploadBatch();
  }
}
