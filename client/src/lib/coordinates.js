// "latitude, longitude" typed or pasted by the user ==> `{ latitude, longitude }`, or `null` when it is not valid
// NOTE: parsed in the browser ==> nothing is sent to any service ( no geocoding )
// INFO: accepts what Google Maps copies on right-click, e.g. "-20.23456789, 57.49876543" ( comma or space between )
export function parseCoordinates(text) {
  const parts = text.trim().split(/[\s,]+/)
  if (parts.length !== 2) return null

  const latitude = Number(parts[0])
  const longitude = Number(parts[1])

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  // 0,0 means "no GPS fix" in this project ==> never a real place
  if (latitude === 0 && longitude === 0) return null

  return { latitude, longitude }
}
