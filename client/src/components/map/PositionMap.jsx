import "leaflet/dist/leaflet.css"
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet"
import { KeepCentered } from "@/components/map/KeepCentered"

// small map with one dot ==> the last known position of a device
export function PositionMap({ latitude, longitude }) {
  const center = [latitude, longitude]

  return (
    <MapContainer
      center={center}
      zoom={15}
      // a small map inside a scrolling page ==> the mouse wheel scrolls the page, not the map
      scrollWheelZoom={false}
      className="isolate h-48 w-full rounded-lg"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <CircleMarker
        center={center}
        radius={8}
        pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2a78d6", fillOpacity: 1 }}
      />
      <KeepCentered center={center} />
    </MapContainer>
  )
}
