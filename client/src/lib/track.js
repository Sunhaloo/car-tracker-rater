// turns the track from `GET /api/trips/:id/track` into what the map draws
// NOTE: pure functions ==> plain data in, plain data out, no map library ( easy to test with made-up points )
import { EVENT_THRESHOLD_G, MAX_ROUTE_GAP_S, MIN_MAP_SPEED_KMH } from "@/lib/constants"

// one colour per G bucket ==> also used by the legend
export const ROUTE_BUCKETS = {
  smooth: { colour: "#16a34a", label: `Smooth (below ${(EVENT_THRESHOLD_G / 2).toFixed(2)} g)` },
  firm: { colour: "#f59e0b", label: `Firm (${(EVENT_THRESHOLD_G / 2).toFixed(2)} to ${EVENT_THRESHOLD_G.toFixed(2)} g)` },
  harsh: { colour: "#dc2626", label: `Harsh (above ${EVENT_THRESHOLD_G.toFixed(2)} g)` },
  none: { colour: "#9ca3af", label: "No G reading" },
}

// resultant G ==> bucket name ( "above the threshold" uses `>` like the server's event detection )
export function gBucket(resultantG) {
  if (resultantG === null) return "none"
  if (resultantG > EVENT_THRESHOLD_G) return "harsh"
  if (resultantG >= EVENT_THRESHOLD_G / 2) return "firm"
  return "smooth"
}

// rows worth drawing ==> they need a position, and a speed above the minimum
// NOTE: a row without a speed is skipped too --> we cannot tell whether the car was moving
export function mapPoints(track) {
  return track.filter(
    (point) =>
      point.latitude !== null && point.longitude !== null && point.speed !== null && point.speed > MIN_MAP_SPEED_KMH,
  )
}

// seconds between two points
const secondsBetween = (a, b) => (new Date(b.time) - new Date(a.time)) / 1000

// drawn points ==> a few long lines, one per run of the same colour
// INFO: returns `[{ bucket, positions: [[lat, lng], ...] }, ...]`
export function routeSegments(points) {
  const segments = []
  let current = null

  points.forEach((point, index) => {
    const position = [point.latitude, point.longitude]
    const bucket = gBucket(point.resultant_g)
    const previous = points[index - 1]

    if (!current || secondsBetween(previous, point) > MAX_ROUTE_GAP_S) {
      // first point, or the GPS was lost ==> start a new line instead of drawing a straight jump
      current = { bucket, positions: [position] }
      segments.push(current)
    } else if (bucket !== current.bucket) {
      // colour changes ==> the new line starts at the last point of the old one so there is no hole
      const lastPosition = current.positions[current.positions.length - 1]
      current = { bucket, positions: [lastPosition, position] }
      segments.push(current)
    } else {
      current.positions.push(position)
    }
  })

  // a line needs at least two points ==> a lonely point between two gaps cannot be drawn
  return segments.filter((segment) => segment.positions.length > 1)
}
