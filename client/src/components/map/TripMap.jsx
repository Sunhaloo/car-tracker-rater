import "leaflet/dist/leaflet.css"
import { useMemo } from "react"
import { CircleMarker, MapContainer, Marker, Popup, Polyline, TileLayer } from "react-leaflet"
import { EventPopup } from "@/components/map/EventPopup"
import { eventIcon, labelIcon } from "@/components/map/markerIcons"
import { mapPoints, nearestPoint, ROUTE_BUCKETS, routeSegments } from "@/lib/track"

// built once ==> the map re-renders on every chart hover, and a new icon object would redraw every pin
const ICONS = {
  start: labelIcon("Start"),
  end: labelIcon("End"),
  accel: eventIcon("accel"),
  brake: eventIcon("brake"),
  corner: eventIcon("corner"),
}

// the route of one trip on OpenStreetMap
// NOTE: the only component pages use for maps ==> swapping the map library only touches `components/map/`
// `track` ==> `GET /api/trips/:id/track`, `events` ==> `GET /api/trips/:id/events`
// `highlightTime` ==> moment hovered on a chart ( ms ), shown as a dot on the route ( or `null` )
export function TripMap({ track, events, highlightTime = null }) {
  // thousands of rows ==> only recompute when the data itself changes
  const points = useMemo(() => mapPoints(track), [track])
  const segments = useMemo(() => routeSegments(points), [points])
  // events during a GPS no-fix have no position ==> they cannot be pinned
  const pinnedEvents = useMemo(
    () => events.filter((event) => event.latitude !== null && event.longitude !== null),
    [events],
  )
  const highlighted = highlightTime === null ? null : nearestPoint(points, highlightTime)

  if (points.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No route to draw: this trip has no GPS positions while the car was moving.
      </p>
    )
  }

  const first = points[0]
  const last = points[points.length - 1]
  const unpinned = events.length - pinnedEvents.length

  return (
    <div className="flex flex-col gap-2">
      {/* `isolate` ==> Leaflet's high z-index layers stay below our dialogs and menus */}
      <MapContainer
        bounds={points.map((point) => [point.latitude, point.longitude])}
        boundsOptions={{ padding: [24, 24] }}
        // draw lines on one canvas instead of thousands of SVG elements
        preferCanvas
        className="isolate h-[420px] w-full rounded-lg"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {segments.map((segment, index) => (
          <Polyline
            key={index}
            positions={segment.positions}
            pathOptions={{ color: ROUTE_BUCKETS[segment.bucket].colour, weight: 5, opacity: 0.9 }}
          />
        ))}

        <Marker position={[first.latitude, first.longitude]} icon={ICONS.start} />
        <Marker position={[last.latitude, last.longitude]} icon={ICONS.end} />

        {pinnedEvents.map((event) => (
          <Marker
            key={`${event.type}-${event.started_at}`}
            position={[event.latitude, event.longitude]}
            icon={ICONS[event.type]}
          >
            <Popup>
              <EventPopup event={event} />
            </Popup>
          </Marker>
        ))}

        {/* where the car was at the moment hovered on a chart */}
        {highlighted && (
          <CircleMarker
            center={[highlighted.latitude, highlighted.longitude]}
            radius={7}
            pathOptions={{ color: "#171717", weight: 3, fillColor: "#ffffff", fillOpacity: 1 }}
          />
        )}
      </MapContainer>

      {unpinned > 0 && (
        <p className="text-sm text-muted-foreground">
          {unpinned} {unpinned === 1 ? "event happened" : "events happened"} without a GPS fix and{" "}
          {unpinned === 1 ? "is" : "are"} not on the map.
        </p>
      )}
    </div>
  )
}
