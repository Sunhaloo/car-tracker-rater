import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EVENT_THRESHOLD_G } from "@/lib/constants"

// how many harsh events of each type ==> tells the driver what to work on
// `counts` ==> `trip.events` from `GET /api/trips/:id`, `events` ==> the list from `GET /api/trips/:id/events`
export function EventCounts({ counts, events }) {
  // lateral G is positive when turning right ==> the sign of `peak_g` gives the side of each corner
  const corners = events.filter((event) => event.type === "corner")
  const rightTurns = corners.filter((event) => event.peak_g > 0).length
  const leftTurns = corners.length - rightTurns

  const rows = [
    { label: "Hard accelerating", value: counts.accel },
    { label: "Hard braking", value: counts.brake },
    { label: "Hard cornering", value: counts.corner, detail: `${leftTurns} left, ${rightTurns} right` },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Harsh events</CardTitle>
        <CardDescription>
          Moments above {EVENT_THRESHOLD_G.toFixed(2)} g · {counts.total} in total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {rows.map((row) => (
            <li key={row.label} className="flex items-baseline justify-between gap-4 py-2">
              <span>
                {row.label}
                {row.detail && row.value > 0 && (
                  <span className="block text-sm text-muted-foreground">{row.detail}</span>
                )}
              </span>
              <span className="text-2xl font-semibold">{row.value}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
