import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BASELINE_SCORE } from "@/lib/constants"

// average of the API scores of the 5 newest rated trips, next to the baseline
// NOTE: only averages scores the API already gave ==> no score is computed here
export function LastFiveCard({ trips }) {
  // the list is newest first ==> the first 5 trips with a score are the 5 newest rated ones
  const lastFive = trips.filter((trip) => trip.score !== null).slice(0, 5)
  if (lastFive.length === 0) return null

  const average = lastFive.reduce((sum, trip) => sum + trip.score, 0) / lastFive.length
  const difference = average - BASELINE_SCORE

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last {lastFive.length === 5 ? "5 trips" : `${lastFive.length} rated trips`}</CardTitle>
        <CardDescription>Average score compared with the baseline</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-x-8 gap-y-2">
        <div>
          <p className="text-3xl font-semibold">{average.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">Your average</p>
        </div>
        <div>
          <p className="text-3xl font-semibold text-muted-foreground">{BASELINE_SCORE.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">Baseline</p>
        </div>
        <p className="text-sm">
          {difference >= 0 ? "▲" : "▼"} {Math.abs(difference).toFixed(1)} {difference >= 0 ? "above" : "below"} the
          baseline
        </p>
      </CardContent>
    </Card>
  )
}
