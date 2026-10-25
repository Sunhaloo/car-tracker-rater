import { useEffect } from "react"
import { useMap } from "react-leaflet"

// Leaflet measures its box once, when it appears ==> inside a dialog that is still animating the size is wrong
// --> grey, half-loaded tiles; measuring again after the animation fixes it
export function FixMapSize() {
  const map = useMap()

  useEffect(() => {
    // the dialog's open animation takes 100 ms ==> 200 ms leaves some margin
    const timer = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(timer)
  }, [map])

  return null
}
