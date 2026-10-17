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
  uint32_t ts;
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
