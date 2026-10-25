// numbers the client needs but the API does not send

// harsh-event threshold in g ( acceleration, braking and cornering )
// WARNING: must match `eventThresholdG` in `server/config/index.js` ==> the API does not expose it
export const EVENT_THRESHOLD_G = 0.3

// score the "last 5 trips" average is compared against
// WARNING: placeholder value ==> replace it once the scoring is calibrated on clean drives
export const BASELINE_SCORE = 7

// every time is stored and sent in UTC ==> converted to Mauritius time ( UTC+4 ) only for display
export const TIME_ZONE = "Indian/Mauritius"
