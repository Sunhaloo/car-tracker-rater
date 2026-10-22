// make this peice of code available to other files
module.exports = {
  // harsh-event threshold ==> same value for hard acceleration, hard braking and hard cornering
  eventThresholdG: 0.3,

  // trip splitting ==> a gap bigger than this between two rows starts a new trip
  tripGapMs: 5 * 60 * 1000,

  // trip closing ==> a trip is closed when its newest row is older than this
  tripCloseWaitMs: 3 * 60 * 1000,

  // hardware status ==> newest row older than this means the ESP32 is offline
  offlineAfterMs: 60 * 1000,

  // how often 'sync' runs
  syncIntervalMs: 30 * 1000,

  // ThingSpeak returns at most this many rows per read
  thingspeakMaxRows: 8000,

  // scoring ==> event rate ( events per 10 km ) that gives a score of 0
  // WARNING: using placeholder value '5' ==> needs to be calibrated on real drives
  // rough drives = 0-3, good normal drives = 4-7, smooth drives = 8-10
  rBad: 5,

  // rating cut-offs on the 0-10 score
  // INFO:
  // 1. below `badBelow` ==> Bad
  // 2. below `goodFrom``==> Normal
  // 3. else Good )
  badBelow: 4,
  goodFrom: 8,

  // trips shorter than this get the rating "Not enough data"
  minTripDistanceKm: 1,

  // `distance per row = speed * time` since the previous row --> but time is capped at this
  // NOTE: stops a long gap from being counted as driving at the last speed
  maxStepSeconds: 5,
};
