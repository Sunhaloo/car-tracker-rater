import { useEffect } from "react"
import { useMap } from "react-leaflet"

// smoothly moves the map to `target` ( `[latitude, longitude]` ) every time a new target is given
// NOTE: only used for searched coordinates ==> clicking the map drops the pin without moving the view
export function FlyTo({ target }) {
  const map = useMap()

  useEffect(() => {
    // zoom 17 ==> close enough to see individual houses
    if (target) map.flyTo(target, 17)
  }, [map, target])

  return null
}
