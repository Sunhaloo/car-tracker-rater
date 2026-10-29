---
id: Car Tracker and Driver Rater Planning
aliases: Planning the Car Tracker and Driver Rater for Robotics and IoT Assignment
tags:
  - C
  - microcontroller
  - uni
  - uom
module: ICT 3207Y
author: S.Sunhaloo
date: 2026-10-07
status: Completed
---

> [!INFO] Resource(s)
> 
> - Reading Data:
> 	- https://www.mathworks.com/help/thingspeak/readdata.html
> - Writing Data:
> 	- Bulk Writing: https://www.mathworks.com/help/thingspeak/bulkwritejsondata.html

# Testing ThingSpeak

## Reading Data From API ( Private Channel )

- Going to read data from my 'Combined Sensors' **private** channel:

```console
https://api.thingspeak.com/channels/<CHANNEL_ID>/feeds.json?api_key=<READ_API_KEY>
```

- Hence, either use `curl` or simply paste this in your browser

```bash
curl https://api.thingspeak.com/channels/<CHANNEL_ID>/feeds.json?api_key=<READ_API_KEY>
```

> [!WARNING]
> Given that this is a **private** channel; I am only going use *placeholders* like `CHANNEL_ID` and `READ_API_KEY` in as they should **always** be kept private.

> [!SUCCESS]
> Therefore, you should see that you get all the data captured by the ESP-32D and you should see that the data is **not** lost

> [!NOTE]
> I thought that the data was being lost as the *charts* inside of ThingSpeak as it only show data for the *last hour*.
> 
> Hence, I was thinking that we are going to have to use another service or even create our our little private, local thing in order to log all the data.
> 
> Nevermind, ThingSpeak is actually logging everything in the background and only shows the *last hour* in the charts but that's totally fine then!

> [!TIP]
> If you want to read the **built-in fields** such as *location* and the *status* fields; then use the following API URL:
> 
> > Again, I am thinking that you have your channel set to **private**!
> 
> ```console
> https://api.thingspeak.com/channels/<CHANNEL_ID>/feeds.json?api_key=<READ_API_KEY>&location=true&status=true
> ```

> [!INFO]
> > Ohh you can do that?
> 
> - Display a single chart's data in the browser:
> 
> ```console
> https://api.thingspeak.com/channels/<CHANNEL_ID>/charts/<FIELD_NUMBER>?api_key=<READ_API_KEy>
> ```

## Writing Bulk Data ( Private Channel )

- Create a `data.json` file:

```json
{
  "write_api_key": "YOUR_WRITE_API_KEY",
  "updates": [
    {"created_at": "2026-10-08T10:20:00+04:00", "field1": 0,  "field2": 0.0,  "field3": 0.0,  "field4": 0.0,  "field5": 0.0,  "field6": 3, "field7": 60, "latitude": "<redacted>", "longitude": "<redacted>"},
    {"created_at": "2026-10-08T10:20:02+04:00", "field1": 18, "field2": 0.25, "field3": 0.0,  "field4": 0.05, "field5": 0.0,  "field6": 3, "field7": 62, "latitude": "<redacted>", "longitude": "<redacted>"},
    {"created_at": "2026-10-08T10:20:04+04:00", "field1": 31, "field2": 0.10, "field3": 0.0,  "field4": 0.0,  "field5": 0.30, "field6": 3, "field7": 64, "latitude": "<redacted>", "longitude": "<redacted>"}
  ]
}
```

- Verify that the above JSON data is syntactically correct:

```bash
python -m json.tool data.json
```

> [!NOTE]
> If everything is correct; you should see that you get the content of the `data.json` file as the output itself.
> 
> Else, you are going to see the errors that are found inside the `data.json` file.

- Use `curl` to `POST` the data to ThingSpeak:

```bash
   curl -i -X POST \
     -H "Content-Type: application/json" \
     -d @bulk.json \
     "https://api.thingspeak.com/channels/<CHANNEL_ID>/bulk_update.json"
```

> [!SUCCESS]
> Running the above command that with my correct channel ID; I do see that we get:
> 
> ```console
> HTTP/2 202 
> date: Thu, 08 Oct 2026 06:39:48 GMT
> content-type: application/json; charset=utf-8
> status: 202 Accepted
> cache-control: no-cache
> access-control-allow-origin: *
> access-control-max-age: 1800
> x-request-id: 7c3af823-ecc2-4cbe-85b0-402150b9cb33
> access-control-allow-headers: origin, content-type, X-Requested-With
> access-control-allow-methods: GET, POST, PUT, OPTIONS, DELETE, PATCH
> x-frame-options: SAMEORIGIN
> 
> {"success":true}
> ```

> [!WARNING]
> You now how if our EPS-32D ThingSpeak code we need to have a `delay(15)` seconds... Well this is the reason as to why we need to have that delay.
> 
> - If we go ahead and run the above `curl` command in **fast** succession; we are going to get this instead:
> 
> ```console
> HTTP/2 429 
> date: Thu, 08 Oct 2026 06:45:17 GMT
> content-type: text/plain
> status: 429 Too Many Requests
> cache-control: no-cache
> x-request-id: 918ac471-8877-4df8-a475-b64187450466
> 
> Retry later
> ```

## Age Check

- This is the API for check the **number of seconds** since the *newest entry timestamp*:

```console
https://api.thingspeak.com/channels/<CHANNEL_ID>/feeds/last_data_age.json?api_key=<READ_API_KEY>
```

- Hence, you can simply get the data by using the `curl` command like so:

```bash
curl https://api.thingspeak.com/channels/<CHANNEL_ID>/feeds/last_data_age.json?api_key=<READ_API_KEY>
```

- Hence, you should see something along the lines of this:

```json
{"last_data_age":"2117","last_data_age_units":"s"}
```

> [!INFO]
> Now, wait for some time and then go ahead and run the above `curl` command again:
> 
> You should see that the `last_data_age` has now changed and has increased:
> 
> ```json
> {"last_data_age":"2179","last_data_age_units":"s"}
> ```
> 
> > As you can see it has updated and has increased!

## Drafting Status Bits For Sensors

### Bit Layout

| Bit | Value | Question ( 1 = yes ) |
| --- | ----- | -------------------- |
| 0 | 1 | GPS Talking? |
| 1 | 2 | GPS Fix? |
| 2 | 4 | IMU Responding? |
| 3+ | 8, 16... | Reserved For Future Layout |

### Decode Table

| `field6` | GPS    | IMU   | Meaning                              |
| -------- | ------ | ----- | ------------------------------------ |
| 0        | grey   | grey  | GPS no data, IMU not responding      |
| 1        | orange | grey  | GPS searching (no fix), IMU not responding |
| 3        | green  | grey  | GPS fix, IMU not responding          |
| 4        | grey   | green | GPS no data, IMU OK                  |
| 5        | orange | green | GPS searching (no fix), IMU OK       |
| 7        | green  | green | Everything OK                        |
| 2, 6     | n/a    | n/a   | Invalid: fix without "talking", treat as an error |

## Fields Needed

We are going to be using a single channel for the all the data that we are going to be capturing and here is all the fields that we are going to capture.

### Custom - Numbered Fields

| Field | Name           | Unit | Notes                                   |
| ----- | -------------- | ---- | --------------------------------------- |
| 1     | Speed          | km/h | From GPS                                |
| 2     | Longitudinal G | g    | accelerating: +, braking: -             |
| 3     | Lateral G      | g    | right: +, left: -                       |
| 4     | Yaw rate       | °/s  | turning right: +, turning left: -       |
| 5     | Uptime         | s    | seconds since boot; a drop = new trip   |
| 6     | Status bits    | none | see the status bits table               |
| 7–8   | unused         |      | reserved                                |

### Built-in Fields

| Key       | Content                            | Read it with    |
| --------- | ---------------------------------- | --------------- |
| latitude  | decimal degrees                    | `location=true` |
| longitude | decimal degrees                    | `location=true` |
| elevation | metres (GPS altitude)              | `location=true` |
| status    | text, e.g. `sats:7` (satellites)   | `status=true`   |

---

# To Database Or Not To Database

Let's say that you make a simple web server on the ESP-32D to be able to turn on / off an LED light. Well, you are going to have to access the IP address of the ESP-32D on your phone or computer to be able to access the webpage and therefore, be able to interact with the LED light.

But what if the ESP-32D is not supplied with power; this means that you **won't** be able to access your webpage and therefore, turn on / off the LED light.

This is the reason that we are **going with a database**! The thing is I still want to user to be able to access the *website* and see the **previous data** *for the main page* and the past $x$ records for the comparing and getting the fine-grain data.

Hence, instead of our web application communicating with the ESP-32D; we are instead going to make a small backend that is just going to connect to a database table(s) and therefore, access the required data.

> Well these data that are going to be stored inside come from ThingSpeak and also the Web Application!

Additionally, this will makes our "*Hardware Status*" page makes complete sense as we are able to check when its actually online.

## Tables

### Samples - The Data Table

| Field                 | Type             | Null? | Notes                                                        |
| --------------------- | ---------------- | ----- | ------------------------------------------------------------ |
| `id`                  | bigint, identity | no    | primary key                                                  |
| `created_at`          | timestamptz      | no    | UTC, unique, used for repeatable ingest ( will convert to Mauritian time ) |
| `thingspeak_entry_id` | integer          | yes   | for traceability                                             |
| `speed`               | real             | yes   | km/h                                                         |
| `long_g`              | real             | yes   | accelerating: +, braking: -                                  |
| `lat_g`               | real             | yes   | + right, − left                                              |
| `resultant_g`         | real             | yes   | generated: sqrt($long_{g}^2$ + $lat_{g}^2$); null if either is null |
| `yaw_rate`            | real             | yes   | degree/s, turning right: +, turning left: -                  |
| `uptime`              | integer          | yes   | seconds since boot                                           |
| `status_bits`         | smallint         | yes   | see the status bits table                                    |
| `latitude`            | double precision | yes   | null when there is no fix                                    |
| `longitude`           | double precision | yes   | null when there is no fix                                    |
| `elevation`           | real             | yes   | metres                                                       |
| `sats`                | smallint         | yes   | satellites, parsed from the `sats:N` status text             |
| `step_distance_m`     | real             | yes   | metres since the previous row = speed / 3.6 $\times$ seconds; set by the ingester |
| `trip_id`             | bigint           | yes   | foreign key to `trips.id`, set by the ingester               |

### Trips - The Information Table

| Column            | Type             | Null? | Notes                                          |
| ----------------- | ---------------- | ----- | ---------------------------------------------- |
| `id`              | bigint, identity | no    | primary key                                    |
| `driver`          | text             | yes   | set from the web app after the trip            |
| `started_at`      | timestamptz      | no    | first sample of the trip                       |
| `ended_at`        | timestamptz      | yes   | null while the trip is in progress             |
| `distance_m`      | real             | yes   | sum of `step_distance_m`                       |
| `max_speed`       | real             | yes   | km/h                                           |
| `max_accel_g`     | real             | yes   | max of `long_g`                                |
| `max_brake_g`     | real             | yes   | −(min of `long_g`)                             |
| `max_right_g`     | real             | yes   | max of `lat_g`                                 |
| `max_left_g`      | real             | yes   | −(min of `lat_g`)                              |
| `max_resultant_g` | real             | yes   | max of `resultant_g`                           |
| `score`           | real             | yes   | filled in once the scoring method is decided   |
| `start_latitude`  | double precision | yes   | first sample with a fix                                  |
| `start_longitude` | double precision | yes   | first sample with a fix                                  |
| `end_latitude`    | double precision | yes   | last sample with a fix                                   |
| `end_longitude`   | double precision | yes   | last sample with a fix                                   |
| `start_label`     | text             | yes   | place name from geocoding, looked up once and then saved |
| `end_label`       | text             | yes   | place name from geocoding, looked up once and then saved |

### Places - The Location Table

| Column      | Type             | Notes                                              |
| ----------- | ---------------- | -------------------------------------------------- |
| `id`        | bigint identity  | Primary key                                        |
| `label`     | text, not null   | Name shown to the user, e.g. "Home", "University of Mauritius" |
| `latitude`  | double precision, not null | Centre of the place                      |
| `longitude` | double precision, not null | Centre of the place                      |
| `radius_m`  | integer, not null | How close (in metres) counts as "at" this place, e.g. 200 for a house, 800 for campus |

# Maps

> [!INFO]
> - OpenStreetMap: https://www.openstreetmap.org/
> - React-Leaftlet: https://react-leaflet.js.org/

---

# Code

## Secrets Header File

- Here is the file that we are **not** going to be committing in the repository:

```C
// include the header file only once
// NOTE: this is pretty cool ==> it automates the process of creating header
// files manually so that we don't need to use `#ifndef`, `#define` and `#endif`
#pragma once

// variables for WiFi crendentials
#define WIFI_SSID "<wifi-ssid-here>"
#define WIFI_PASSWORD "<wifi-password-here>"

// variables for ThingSpeak crendentials
#define CHANNEL_ID 0000000UL
#define WRITE_API_KEY "<thingspeak-write-key>"
```

> [!INFO]
> Obviously we are going to have to replace this with the actual *values*!

## Types File

- Here is the file that has some user-defined data types to help us group and find real data:

```C
// include the header file only once
// NOTE: this is pretty cool ==> it automates the process of creating header
// files manually so that we don't need to use `#ifndef`, `#define` and `#endif`
#pragma once

#include <Arduino.h>

// determine which values a row actually has ==> to check for real values
enum RowFlags : uint8_t {
  // bits associated with each field
  HAS_SPEED = 1,
  HAS_LONG = 2,
  HAS_LAT = 4,
  HAS_YAW = 8,
  HAS_POS = 16,
  HAS_ELEV = 32
};

// structure `Row` to keep the data to be uploaded to ThingSpeak
struct Row {
  // for `created_at` field
  uint32_t ts; // UTC seconds since 1970 (becomes created_at)
  // for `field1` field
  float speed;
  // for `field2` field
  float longG;
  // for `field3` field
  float latG;
  // for `field4` field
  float yaw;
  // for `field5` field
  uint32_t uptime;
  // for `field6` field
  uint8_t status;
  // for the built-in `latitude` field
  double lat;
  // for the built-in `longitude` field
  double lng;
  // for the built-in `elevation` / altitude field
  float elev;
  // for the "hidden" built-in `status` field
  // NOTE: unknown = -1
  int8_t sats;
  // to determine which values are actually read ( see `enum` above )
  uint8_t flags;
};

// holds strongest reading of one value during the current second
// INFO: used for fields like speed, Gs and yaw rate
struct Peak {
  // holds the actual maximum value
  float value = 0;
  // check whether any readings have arrived yet
  bool has = false;
};
```

## Main Car Tracker File

- Setup the includes and constants:

```C
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
```

- Initialise further constants for the actual sensors and data gathering:

```C
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
```

- Create objects for our sensors in use:

```C
// create object to talk to with correct sensor on bus line
MPU6500_WE myMPU6500 = MPU6500_WE(MPU6500_ADDR);

// create the GPS object
TinyGPSPlus gps;
```

- Setup the buffer and maximum *real* values for each data gathered:

```C
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
```

- Check statuses for the different sensor on-board:

```C
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
```

- Function to setup GPS sensor and read new data ( *if available* ):

```C
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
```

- Function to try to connect to WiFi and clock sync:

```C
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
```

- Make sure that the clock is still synced up if we ever lose connection:

```C
// clock still synced up after first sync even if WiFi connection is lost
void checkClock() {
  if (!clockSynced && time(nullptr) > CLOCK_VALID_AFTER) {
    clockSynced = true;
    Serial.println("Clock synced, logging starts");
  }
}
```

- Read the data from the IMU and GPS sensors:

```C
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
```

- Check if the GPS sensor is alive and also if receiving communication with satellites:

```C
// to check if the GPS module is alive
bool gpsTalking() {
  return (millis() - lastCharsMs) < GPS_FRESH_MS;
}

// to check if GPS has a "fix" ==> communication to satellites ( minimum 4 needed )
bool gpsHasFix() {
  return gpsTalking() && gps.location.isValid() && gps.location.age() < GPS_FRESH_MS;
}
```

- Turn on the correct LEDs based on the status:

```C
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
```

- Add the new rows to the buffer ( *if completely filled or not* ):

```C
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
```

- Pack all the data together and then push that row to the buffer *at the current second*:

```C
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
```

- Create the JSON data to push to ThingSpeak:

```C
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
```

- Upload the JSON data to ThingSpeak:

```C
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
```

- The main `setup` and `loop` function:

```C
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
```

---

# Socials

- **Instagram**: https://www.instagram.com/s.sunhaloo
- **YouTube**: https://www.youtube.com/channel/UCMkQZsuW6eHMhdUObLPSpwg
- **GitHub**: https://www.github.com/Sunhaloo

---

S.Sunhaloo
Thank You!