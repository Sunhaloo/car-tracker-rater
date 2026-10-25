import { useEffect, useState } from "react"
import { LastFiveCard } from "@/components/LastFiveCard"
import { TripsTable } from "@/components/TripsTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { apiRequest } from "@/lib/api"

// home page ==> the finished trips, newest first
export function TripsPage() {
  // off ==> only rated trips ( 1 km or more ), which is the API default
  const [showShort, setShowShort] = useState(false)
  const [trips, setTrips] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    // the switch can change before the previous request answers ==> ignore the old answer
    let ignore = false
    apiRequest(showShort ? "/api/trips?all=true" : "/api/trips")
      .then((data) => !ignore && setTrips(data))
      .catch((err) => !ignore && setError(err.message))

    return () => {
      ignore = true
    }
  }, [showShort])

  // flipping the switch ==> clear the old list so "Loading…" shows while the new one arrives
  function handleShowShortChange(checked) {
    setShowShort(checked)
    setTrips(null)
    setError("")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Past trips</h1>
        <div className="flex items-center gap-2">
          <Switch id="show-short" checked={showShort} onCheckedChange={handleShowShortChange} />
          <Label htmlFor="show-short">Show short sessions</Label>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Could not load your trips</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && trips === null && <p className="text-muted-foreground">Loading trips…</p>}

      {trips?.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground">
            No trips yet.{" "}
            {!showShort && "Trips shorter than 1 km are hidden; turn on “Show short sessions” to see them."}
          </CardContent>
        </Card>
      )}

      {trips?.length > 0 && (
        <>
          <LastFiveCard trips={trips} />
          <Card className="py-0">
            <TripsTable trips={trips} />
          </Card>
        </>
      )}
    </div>
  )
}
