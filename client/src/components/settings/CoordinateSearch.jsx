import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { parseCoordinates } from "@/lib/coordinates"

// box for pasting "latitude, longitude" ==> `onFound(latitude, longitude)` when it is valid
// NOTE: coordinates only, no place names --> searching names would send the address to a geocoding service
export function CoordinateSearch({ onFound }) {
  const [text, setText] = useState("")
  const [invalid, setInvalid] = useState(false)

  function handleSearch() {
    const result = parseCoordinates(text)
    setInvalid(result === null)
    if (result) onFound(result.latitude, result.longitude)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="place-coordinates">Go to coordinates</Label>
      <div className="flex gap-2">
        <Input
          id="place-coordinates"
          placeholder="-20.23296, 57.49735"
          value={text}
          aria-invalid={invalid}
          aria-describedby="place-coordinates-hint"
          onChange={(e) => {
            setText(e.target.value)
            setInvalid(false)
          }}
          onKeyDown={(e) => {
            // inside the place form ==> Enter must search here, not save the place
            if (e.key === "Enter") {
              e.preventDefault()
              handleSearch()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={handleSearch}>
          Go
        </Button>
      </div>
      <p id="place-coordinates-hint" className={invalid ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
        {invalid
          ? "Use latitude, longitude, for example -20.2345, 57.4987"
          : "Tip: right-click a spot in Google Maps to copy its coordinates, then paste them here."}
      </p>
    </div>
  )
}
