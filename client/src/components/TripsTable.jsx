import { Link, useNavigate } from "react-router-dom"
import { RatingBadge } from "@/components/RatingBadge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateTime, formatDuration, formatKm, formatPlace, formatScore, formatSpeed } from "@/lib/format"

// one row per trip ==> clicking anywhere on a row opens that trip
export function TripsTable({ trips }) {
  const navigate = useNavigate()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date and time</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="text-right">Distance</TableHead>
          <TableHead className="text-right">Max speed</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Route</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {trips.map((trip) => (
          <TableRow key={trip.id} className="cursor-pointer" onClick={() => navigate(`/trips/${trip.id}`)}>
            <TableCell>
              {/* a real link too ==> keyboard users can tab to it, and it can open in a new tab */}
              <Link to={`/trips/${trip.id}`} className="font-medium hover:underline">
                {formatDateTime(trip.started_at)}
              </Link>
            </TableCell>
            <TableCell>{formatDuration(trip.started_at, trip.ended_at)}</TableCell>
            <TableCell className="text-right">{formatKm(trip.distance_km)}</TableCell>
            <TableCell className="text-right">{formatSpeed(trip.max_speed_kmh)}</TableCell>
            <TableCell className="text-right">{formatScore(trip.score)}</TableCell>
            <TableCell>
              <RatingBadge rating={trip.rating} />
            </TableCell>
            <TableCell>
              {formatPlace(trip.start.label)} → {formatPlace(trip.end.label)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
