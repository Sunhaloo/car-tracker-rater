import { useEffect } from "react"
import { useMap } from "react-leaflet"

// `MapContainer` only reads `center` once ==> this moves the map when the position changes later
export function KeepCentered({ center }) {
  const map = useMap()
  const [latitude, longitude] = center

  useEffect(() => {
    map.setView([latitude, longitude])
  }, [map, latitude, longitude])

  return null
}
