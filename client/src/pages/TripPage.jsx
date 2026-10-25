import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { TripMap } from "@/components/map/TripMap"
import { DirectionMeter } from "@/components/trip/DirectionMeter"
import { EventCounts } from "@/components/trip/EventCounts"
import { RouteLegend } from "@/components/trip/RouteLegend"
import { TripCharts } from "@/components/trip/TripCharts"
import { TripHeader } from "@/components/trip/TripHeader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiRequest } from "@/lib/api"

// the main page ==> everything about one trip
export function TripPage() {
  const { id } = useParams()
  // `result.id` remembers which trip the data is for ==> a different `id` in the URL means "still loading"
  const [result, setResult] = useState({ id: null, data: null, error: "" })
  // moment under the mouse on a chart ( ms ) ==> the map shows a dot there
  const [hoverTime, setHoverTime] = useState(null)

  useEffect(() => {
    // the user can leave before the answers arrive ==> ignore answers for an old `id`
    let ignore = false

    Promise.all([
      apiRequest(`/api/trips/${id}`),
      apiRequest(`/api/trips/${id}/events`),
      // one point per second ==> the route on the map ( and the charts later )
      apiRequest(`/api/trips/${id}/track`),
      // the 5 newest rated trips ==> the "last 5" overlay on the direction-meter
      apiRequest("/api/trips?limit=5"),
    ])
      .then(([trip, events, track, recentTrips]) => {
        if (!ignore) setResult({ id, data: { trip, events, track, recentTrips }, error: "" })
      })
      .catch((err) => {
        if (!ignore) setResult({ id, data: null, error: err.message })
      })

    return () => {
      ignore = true
    }
  }, [id])

  if (result.id !== id) return <p className="text-muted-foreground">Loading trip…</p>

  // the API gives the same 404 for a trip that does not exist and one that is not yours
  if (result.error === "Trip not found") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trip not found</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/" className="underline underline-offset-4">
            Back to your trips
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (result.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load this trip</AlertTitle>
        <AlertDescription>{result.error}</AlertDescription>
      </Alert>
    )
  }

  const { trip, events, track, recentTrips } = result.data

  return (
    <div className="flex flex-col gap-6">
      <TripHeader trip={trip} />

      <div className="grid gap-6 md:grid-cols-2">
        <EventCounts counts={trip.events} events={events} />
        <DirectionMeter trip={trip} recentTrips={recentTrips} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route</CardTitle>
          <CardDescription>
            Coloured by how hard the car was pushed (resultant G). Click a pin for details, or hover a chart below to
            follow the car.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TripMap track={track} events={events} highlightTime={hoverTime} />
          <RouteLegend />
        </CardContent>
      </Card>

      {/* the charts sit right under the map ==> the hover dot stays in view */}
      <TripCharts track={track} onHoverTime={setHoverTime} />
    </div>
  )
}
