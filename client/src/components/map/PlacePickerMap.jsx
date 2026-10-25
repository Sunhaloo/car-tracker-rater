import "leaflet/dist/leaflet.css"
import { Circle, CircleMarker, MapContainer, TileLayer } from "react-leaflet"
import { ClickToPick } from "@/components/map/ClickToPick"
import { FixMapSize } from "@/components/map/FixMapSize"
import { FlyTo } from "@/components/map/FlyTo"
import { MAURITIUS_CENTER } from "@/lib/constants"

// map for choosing a place ==> click to drop the pin, the circle shows the radius
// `position` ==> `[latitude, longitude]` or `null` before the first click
// `flyTarget` ==> searched coordinates the map should move to ( a new array each search )
export function PlacePickerMap({ position, radius, onPick, flyTarget = null }) {
  return (
    <MapContainer
      // editing ==> start on the place itself, adding ==> start on the whole island
      center={position ?? MAURITIUS_CENTER}
      zoom={position ? 16 : 10}
      className="isolate h-64 w-full cursor-crosshair rounded-lg"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ClickToPick onPick={onPick} />
      <FlyTo target={flyTarget} />
      <FixMapSize />

      {position && (
        <>
          {/* the area that counts as "at this place" */}
          <Circle center={position} radius={radius} pathOptions={{ color: "#2a78d6", weight: 2, fillOpacity: 0.15 }} />
          <CircleMarker
            center={position}
            radius={6}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#2a78d6", fillOpacity: 1 }}
          />
        </>
      )}
    </MapContainer>
  )
}
