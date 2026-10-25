// turns API values into display text
// NOTE: `null` means "no data" in the API ==> it is shown as "—", never as 0
import { TIME_ZONE } from "@/lib/constants"

const NO_DATA = "—"

// "25 Oct 2026, 14:03" in Mauritius time
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatDateTime(isoString) {
  return isoString ? dateTimeFormat.format(new Date(isoString)) : NO_DATA
}

// "14:03:27" in Mauritius time ==> for moments inside a trip
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

export function formatTime(isoString) {
  return isoString ? timeFormat.format(new Date(isoString)) : NO_DATA
}

// "1 h 05 min" / "24 min" / "45 s"
export function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return NO_DATA
  const seconds = Math.round((new Date(endIso) - new Date(startIso)) / 1000)
  if (seconds < 60) return `${seconds} s`

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`
}

// how long ago, from a number of seconds ==> "12 s ago" / "5 min ago" / "3 h ago" / "2 days ago"
export function formatAge(seconds) {
  if (seconds === null) return "Never"
  if (seconds < 60) return `${seconds} s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`
  const days = Math.floor(seconds / 86400)
  return `${days} ${days === 1 ? "day" : "days"} ago`
}

export function formatKm(km) {
  return km === null ? NO_DATA : `${km.toFixed(2)} km`
}

export function formatSpeed(kmh) {
  return kmh === null ? NO_DATA : `${Math.round(kmh)} km/h`
}

export function formatScore(score) {
  return score === null ? NO_DATA : score.toFixed(1)
}

// a trip end without a GPS fix has no label ==> the API sends `null`
export function formatPlace(label) {
  return label ?? "Unknown place"
}
