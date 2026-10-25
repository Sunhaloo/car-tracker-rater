import { TripScore } from "@/components/trip/TripScore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime, formatDuration, formatKm, formatPlace, formatSpeed } from "@/lib/format"

// top of the trip page ==> when / where, the score and the main numbers
export function TripHeader({ trip }) {
  const stats = [
    { label: "Duration", value: trip.in_progress ? "In progress" : formatDuration(trip.started_at, trip.ended_at) },
    { label: "Distance", value: formatKm(trip.distance_km) },
    // speed is only displayed ==> it is never part of the score
    { label: "Max speed", value: formatSpeed(trip.max_speed_kmh) },
  ]

  return (
    <Card>
      <CardHeader>
        <CardDescription>{formatDateTime(trip.started_at)}</CardDescription>
        <CardTitle className="text-xl">
          {formatPlace(trip.start.label)} → {trip.in_progress ? "…" : formatPlace(trip.end.label)}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <TripScore trip={trip} />

        <dl className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="text-lg font-medium">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
