// map markers made of HTML ( `divIcon` ) ==> Leaflet's default pin images break under Vite's bundling
import L from "leaflet"

// a letter + a colour per event type ==> the letter means the colour is never the only signal
const EVENT_STYLES = {
  accel: { letter: "A", colour: "#2a78d6" },
  brake: { letter: "B", colour: "#eb6834" },
  corner: { letter: "C", colour: "#6250d6" },
}

// "Start" / "End" pill ==> the anchor is its centre, so it sits on the first / last point
export function labelIcon(text) {
  return L.divIcon({
    className: "",
    html: `<span class="flex h-5 w-11 items-center justify-center rounded-full border-2 border-white bg-neutral-900 text-[11px] font-semibold text-white shadow">${text}</span>`,
    iconSize: [44, 20],
    iconAnchor: [22, 10],
  })
}

// round pin with the event's letter
export function eventIcon(type) {
  const style = EVENT_STYLES[type]
  return L.divIcon({
    className: "",
    html: `<span class="flex size-5.5 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow" style="background:${style.colour}">${style.letter}</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    // popup opens just above the pin
    popupAnchor: [0, -11],
  })
}
