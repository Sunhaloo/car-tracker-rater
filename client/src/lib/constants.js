// numbers the client needs but the API does not send

// harsh-event threshold in g ( acceleration, braking and cornering )
// WARNING: must match `eventThresholdG` in `server/config/index.js` ==> the API does not expose it
export const EVENT_THRESHOLD_G = 0.3

// trips shorter than this get no score
// WARNING: must match `minTripDistanceKm` in `server/config/index.js` ==> only used for the explanation text
export const MIN_TRIP_DISTANCE_KM = 1

// fixed outer edge of the direction-meter in g ==> the same scale on every trip so they can be compared
export const DIRECTION_METER_MAX_G = 0.6

// map drawing ==> points at or below this speed are skipped ( the GPS position jitters while stopped )
export const MIN_MAP_SPEED_KMH = 3

// map drawing ==> two drawn points further apart than this ( GPS lost ) are not joined by a line
export const MAX_ROUTE_GAP_S = 10

// charts ==> a long track is shrunk to about this many points ( keeping the peaks )
export const CHART_POINTS = 600

// names of the three harsh event types sent by the API
export const EVENT_LABELS = {
  accel: "Hard accelerating",
  brake: "Hard braking",
  corner: "Hard cornering",
}

// personal places ==> radius limits in metres
// WARNING: must match `placeRadiusMinM` / `placeRadiusMaxM` / `defaultPlaceRadiusM` in `server/config/index.js`
export const PLACE_RADIUS_MIN_M = 20
export const PLACE_RADIUS_MAX_M = 2000
export const PLACE_RADIUS_DEFAULT_M = 150

// where the place picker opens when there is no pin yet ==> the whole of Mauritius
export const MAURITIUS_CENTER = [-20.25, 57.55]

// score the "last 5 trips" average is compared against
// WARNING: placeholder value ==> replace it once the scoring is calibrated on clean drives
export const BASELINE_SCORE = 7

// every time is stored and sent in UTC ==> converted to Mauritius time ( UTC+4 ) only for display
export const TIME_ZONE = "Indian/Mauritius"
