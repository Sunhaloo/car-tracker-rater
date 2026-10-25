import { EVENT_LABELS } from "@/lib/constants"
import { formatSpeed, formatTime } from "@/lib/format"

// how strong the event was, in words ==> `peak_g` is signed ( braking < 0, left turn < 0 )
function describePeak(event) {
  const size = `${Math.abs(event.peak_g).toFixed(2)} g`
  if (event.type !== "corner") return size
  // lateral G is positive when turning right ( car-direction rule )
  return `${size}, ${event.peak_g > 0 ? "right" : "left"} turn`
}

// what the user sees when clicking an event pin
export function EventPopup({ event }) {
  return (
    <div className="flex flex-col gap-0.5">
      <strong>{EVENT_LABELS[event.type]}</strong>
      <span>
        {formatTime(event.started_at)} · lasted {event.duration_s} s
      </span>
      <span>Peak: {describePeak(event)}</span>
      <span>Speed: {formatSpeed(event.speed_kmh)}</span>
    </div>
  )
}
