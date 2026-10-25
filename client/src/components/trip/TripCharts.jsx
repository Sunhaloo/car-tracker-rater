import { memo, useMemo } from "react"
import { GForceChart } from "@/components/trip/GForceChart"
import { SpeedChart } from "@/components/trip/SpeedChart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CHART_POINTS } from "@/lib/constants"
import { downsample } from "@/lib/downsample"

// the speed and G charts of one trip
// `onHoverTime(ms)` ==> the moment under the mouse ( `null` when it leaves ) so the map can show where the car was
// NOTE: `memo` ==> the page re-renders on every mouse move ( map dot ), but these charts only when the track changes
export const TripCharts = memo(function TripCharts({ track, onHoverTime }) {
  // thousands of rows ==> about 600, keeping the peak of each bucket
  const data = useMemo(() => downsample(track, CHART_POINTS, ["speed", "long_g", "lat_g"]), [track])

  // Recharts gives the index of the hovered row ==> turn it into a time
  function handleHover(index) {
    const row = index === null ? null : data[Number(index)]
    onHoverTime(row ? new Date(row.time).getTime() : null)
  }

  if (data.length === 0) return null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Speed (km/h)</CardTitle>
          <CardDescription>Shown for context only, speed is not part of the score</CardDescription>
        </CardHeader>
        <CardContent>
          <SpeedChart data={data} onHover={handleHover} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>G forces (g)</CardTitle>
          <CardDescription>Dashed lines: harsh event threshold</CardDescription>
        </CardHeader>
        <CardContent>
          <GForceChart data={data} onHover={handleHover} />
        </CardContent>
      </Card>
    </div>
  )
})
