import { RatingBadge } from "@/components/RatingBadge"
import { Badge } from "@/components/ui/badge"
import { MIN_TRIP_DISTANCE_KM } from "@/lib/constants"
import { formatScore } from "@/lib/format"

// the three cases ==> still driving / too short for a score / a real score
export function TripScore({ trip }) {
  if (trip.in_progress) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Badge variant="outline">In progress</Badge>
        <p className="text-sm text-muted-foreground">
          This trip is still being recorded. It gets its score and rating once it has ended.
        </p>
      </div>
    )
  }

  if (trip.score === null) {
    return (
      <div className="flex flex-col items-start gap-2">
        <RatingBadge rating={trip.rating} />
        <p className="text-sm text-muted-foreground">
          No score: this trip is shorter than the {MIN_TRIP_DISTANCE_KM} km needed for a rating.
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-4xl font-semibold">
        {formatScore(trip.score)}
        <span className="text-lg font-normal text-muted-foreground"> / 10</span>
      </p>
      <RatingBadge rating={trip.rating} />
    </div>
  )
}
