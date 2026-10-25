import { useState } from "react"
import { PlacePickerMap } from "@/components/map/PlacePickerMap"
import { CoordinateSearch } from "@/components/settings/CoordinateSearch"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { apiRequest } from "@/lib/api"
import { PLACE_RADIUS_DEFAULT_M, PLACE_RADIUS_MAX_M, PLACE_RADIUS_MIN_M } from "@/lib/constants"

// add a place, or edit one ( `place` given ) ==> a name, a pin on the map and a radius
// NOTE: the map inside needs `FixMapSize` ( see `PlacePickerMap` ) because the dialog animates in
export function PlaceFormDialog({ place, onCancel, onSaved }) {
  const isEdit = place !== null
  const [label, setLabel] = useState(place?.label ?? "")
  const [position, setPosition] = useState(place ? [place.latitude, place.longitude] : null)
  const [radius, setRadius] = useState(place?.radius_m ?? PLACE_RADIUS_DEFAULT_M)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  // where the map should fly after a coordinate search ==> clicks only move the pin
  const [flyTarget, setFlyTarget] = useState(null)

  // searched coordinates ==> drop the pin there and move the map to it
  function handleFound(latitude, longitude) {
    setPosition([latitude, longitude])
    setFlyTarget([latitude, longitude])
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    const [latitude, longitude] = position

    let body = { label, latitude, longitude, radius_m: radius }
    if (isEdit) {
      // only send what changed
      body = {}
      if (label !== place.label) body.label = label
      if (latitude !== place.latitude) body.latitude = latitude
      if (longitude !== place.longitude) body.longitude = longitude
      if (radius !== place.radius_m) body.radius_m = radius
      if (Object.keys(body).length === 0) return onCancel()
    }

    setSaving(true)
    try {
      await apiRequest(isEdit ? `/api/places/${place.id}` : "/api/places", {
        method: isEdit ? "PATCH" : "POST",
        body,
      })
      onSaved(isEdit ? "Place updated." : "Place added.")
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      {/* wider than the device dialog for the map ==> scrolls inside on a short phone screen */}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit “${place.label}”` : "Add a place"}</DialogTitle>
            <DialogDescription>
              Click the map to drop the pin, then set how far around it counts as this place.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="place-label">Name</Label>
            <Input id="place-label" placeholder="e.g. Home" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <CoordinateSearch onFound={handleFound} />

          <PlacePickerMap
            position={position}
            radius={radius}
            onPick={(lat, lng) => setPosition([lat, lng])}
            flyTarget={flyTarget}
          />
          <p className="text-sm text-muted-foreground">
            {position
              ? `Pin at ${position[0].toFixed(5)}, ${position[1].toFixed(5)}`
              : "Click the map to drop the pin."}
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="place-radius">Radius</Label>
              {/* the number next to the slider ==> the exact value, not only the slider position */}
              <span className="font-medium">{radius} m</span>
            </div>
            <Slider
              id="place-radius"
              aria-label="Radius in metres"
              min={PLACE_RADIUS_MIN_M}
              max={PLACE_RADIUS_MAX_M}
              step={10}
              value={[radius]}
              onValueChange={([value]) => setRadius(value)}
            />
            <p className="text-sm text-muted-foreground">About 100–200 m for a house, 500–1000 m for a campus.</p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || position === null}>
              {saving ? "Saving…" : isEdit ? "Save" : "Add place"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
