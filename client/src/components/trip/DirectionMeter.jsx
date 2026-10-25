import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DIRECTION_METER_MAX_G, EVENT_THRESHOLD_G } from "@/lib/constants"

// one axis per manoeuvre ==> this order puts Accelerating at the top, Right turn on the right,
// Braking at the bottom and Left turn on the left ( Recharts goes clockwise from the top )
const AXES = [
  { key: "max_accel_g", label: "Accelerating" },
  { key: "max_right_g", label: "Right turn" },
  { key: "max_brake_g", label: "Braking" },
  { key: "max_left_g", label: "Left turn" },
]

// colours with a light and a dark version ==> shadcn writes them as `--color-trip` etc.
const CHART_CONFIG = {
  trip: { label: "This trip", theme: { light: "#2a78d6", dark: "#3987e5" } },
  average: { label: "Average of last 5 trips", theme: { light: "#eb6834", dark: "#d95926" } },
  threshold: { label: `Threshold (${EVENT_THRESHOLD_G.toFixed(2)} g)`, color: "var(--muted-foreground)" },
}

// average of one direction over the given trips ==> trips without that value ( `null` ) are skipped
function averageOf(trips, key) {
  const values = trips.map((trip) => trip[key]).filter((value) => value !== null)
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

// the scale is fixed ==> a value past the edge is drawn on the edge ( the table shows the real number )
const toScale = (value) => Math.min(value ?? 0, DIRECTION_METER_MAX_G)

const formatG = (value) => (value === null ? "—" : `${value.toFixed(2)} g`)

// radar of the trip's strongest G per direction, on the same 0 - 0.6 g scale for every trip
// `recentTrips` ==> newest rated trips from `GET /api/trips`, used for the "last 5" overlay
export function DirectionMeter({ trip, recentTrips }) {
  const lastFive = recentTrips.slice(0, 5)

  const rows = AXES.map((axis) => ({
    direction: axis.label,
    tripValue: trip[axis.key],
    averageValue: lastFive.length > 0 ? averageOf(lastFive, axis.key) : null,
  }))

  const chartData = rows.map((row) => ({
    direction: row.direction,
    trip: toScale(row.tripValue),
    average: toScale(row.averageValue),
    threshold: EVENT_THRESHOLD_G,
  }))

  const showAverage = lastFive.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Direction-meter</CardTitle>
        <CardDescription>Strongest G in each direction, 0 to {DIRECTION_METER_MAX_G} g</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={CHART_CONFIG} className="mx-auto aspect-square w-full max-w-sm">
          <RadarChart data={chartData} outerRadius="70%">
            <PolarGrid />
            <PolarAngleAxis dataKey="direction" />
            <PolarRadiusAxis
              domain={[0, DIRECTION_METER_MAX_G]}
              tickCount={4}
              angle={90}
              axisLine={false}
              tickFormatter={(value) => `${value} g`}
            />
            {/* dashed ring ==> anything outside it counts as a harsh event */}
            <Radar dataKey="threshold" stroke="var(--color-threshold)" strokeDasharray="4 4" fill="none" />
            {showAverage && (
              <Radar
                dataKey="average"
                stroke="var(--color-average)"
                strokeWidth={2}
                fill="var(--color-average)"
                fillOpacity={0.1}
              />
            )}
            <Radar dataKey="trip" stroke="var(--color-trip)" strokeWidth={2} fill="var(--color-trip)" fillOpacity={0.3} />
            <ChartLegend content={<ChartLegendContent />} />
          </RadarChart>
        </ChartContainer>

        {/* the same numbers as text ==> exact values, readable without the colours */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Direction</TableHead>
              <TableHead className="text-right">This trip</TableHead>
              {showAverage && <TableHead className="text-right">Last 5 average</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.direction}>
                <TableCell>{row.direction}</TableCell>
                <TableCell className="text-right">{formatG(row.tripValue)}</TableCell>
                {showAverage && <TableCell className="text-right">{formatG(row.averageValue)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
