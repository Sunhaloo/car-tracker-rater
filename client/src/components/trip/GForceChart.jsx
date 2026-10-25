import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { TraceTooltip } from "@/components/trip/TraceTooltip"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip } from "@/components/ui/chart"
import { EVENT_THRESHOLD_G } from "@/lib/constants"
import { formatTime } from "@/lib/format"

const CHART_CONFIG = {
  long_g: { label: "Longitudinal G (+ accelerating, − braking)", theme: { light: "#2a78d6", dark: "#3987e5" } },
  lat_g: { label: "Lateral G (+ right turn, − left turn)", theme: { light: "#eb6834", dark: "#d95926" } },
}

const LABELS = { long_g: "Longitudinal", lat_g: "Lateral" }

// the sign as a manoeuvre ==> lateral G is positive when turning right ( car-direction rule )
function describeG(key, value) {
  const size = `${Math.abs(value).toFixed(2)} g`
  if (value === 0) return size
  if (key === "long_g") return `${size} ${value > 0 ? "accelerating" : "braking"}`
  return `${size} ${value > 0 ? "right turn" : "left turn"}`
}

// the axis always reaches a bit past the threshold lines ==> they stay visible on a calm trip
const yDomain = [(min) => Math.min(min, -EVENT_THRESHOLD_G - 0.1), (max) => Math.max(max, EVENT_THRESHOLD_G + 0.1)]

// longitudinal and lateral G over the trip, with the harsh-event threshold at + / -
// `data` ==> downsampled rows `{ time, long_g, lat_g, ... }`, `onHover(index)` ==> which row the mouse is on
export function GForceChart({ data, onHover }) {
  return (
    <ChartContainer config={CHART_CONFIG} className="aspect-auto h-64 w-full">
      <LineChart
        data={data}
        syncId="trip-traces"
        onMouseMove={(state) => onHover(state.activeTooltipIndex ?? null)}
        onMouseLeave={() => onHover(null)}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="time" tickFormatter={(time) => formatTime(time).slice(0, 5)} minTickGap={40} />
        <YAxis width={40} domain={yDomain} tickFormatter={(value) => value.toFixed(1)} />
        {/* dashed lines ==> past these the server counts a harsh event */}
        <ReferenceLine y={EVENT_THRESHOLD_G} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
        <ReferenceLine y={-EVENT_THRESHOLD_G} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip content={<TraceTooltip labels={LABELS} formatValue={describeG} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line dataKey="long_g" stroke="var(--color-long_g)" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line dataKey="lat_g" stroke="var(--color-lat_g)" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  )
}
