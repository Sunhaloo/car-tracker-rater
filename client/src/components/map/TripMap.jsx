import "leaflet/dist/leaflet.css"
import { useMemo } from "react"
import { MapContainer, Marker, Popup, Polyline, TileLayer } from "react-leaflet"
import { EventPopup } from "@/components/map/EventPopup"
import { eventIcon, labelIcon } from "@/components/map/markerIcons"
import { mapPoints, ROUTE_BUCKETS, routeSegments } from "@/lib/track"

// the route of one trip on OpenStreetMap
// NOTE: the only component pages use for maps ==> swapping the map library only touches `components/map/`
// `track` ==> `GET /api/trips/:id/track`, `events` ==> `GET /api/trips/:id/events`
export function TripMap({ track, events }) {
  // thousands of rows ==> only recompute when the data itself changes
  const points = useMemo(() => mapPoints(track), [track])
  const segments = useMemo(() => routeSegments(points), [points])
  // events during a GPS no-fix have no position ==> they cannot be pinned
  const pinnedEvents = events.filter((event) => event.latitude !== null && event.longitude !== null)

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

        <Marker position={[first.latitude, first.longitude]} icon={labelIcon("Start")} />
        <Marker position={[last.latitude, last.longitude]} icon={labelIcon("End")} />

        {pinnedEvents.map((event) => (
          <Marker
            key={`${event.type}-${event.started_at}`}
            position={[event.latitude, event.longitude]}
            icon={eventIcon(event.type)}
          >
            <Popup>
              <EventPopup event={event} />
            </Popup>
          </Marker>
        ))}
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
