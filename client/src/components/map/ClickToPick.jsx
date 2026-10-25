import { useMapEvents } from "react-leaflet"

// calls `onPick(latitude, longitude)` wherever the map is clicked
export function ClickToPick({ onPick }) {
  useMapEvents({
    click(event) {
      // `wrap()` ==> keeps the longitude between -180 and 180 even on a repeated copy of the world map
      const { lat, lng } = event.latlng.wrap()
      onPick(lat, lng)
    },
  })
  return null
}
