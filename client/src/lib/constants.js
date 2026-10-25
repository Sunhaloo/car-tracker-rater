// numbers the client needs but the API does not send

// harsh-event threshold in g ( acceleration, braking and cornering )
// WARNING: must match `eventThresholdG` in `server/config/index.js` ==> the API does not expose it
export const EVENT_THRESHOLD_G = 0.3

// trips shorter than this get no score
// WARNING: must match `minTripDistanceKm` in `server/config/index.js` ==> only used for the explanation text
export const MIN_TRIP_DISTANCE_KM = 1

// fixed outer edge of the direction-meter in g ==> the same scale on every trip so they can be compared
export const DIRECTION_METER_MAX_G = 0.6

// score the "last 5 trips" average is compared against
// WARNING: placeholder value ==> replace it once the scoring is calibrated on clean drives
export const BASELINE_SCORE = 7

// every time is stored and sent in UTC ==> converted to Mauritius time ( UTC+4 ) only for display
export const TIME_ZONE = "Indian/Mauritius"
