import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { TraceTooltip } from "@/components/trip/TraceTooltip"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { formatTime } from "@/lib/format"

const CHART_CONFIG = {
  speed: { label: "Speed", theme: { light: "#2a78d6", dark: "#3987e5" } },
}

// speed over the trip ==> only shown, never scored
// `data` ==> downsampled rows `{ time, speed, ... }`, `onHover(index)` ==> which row the mouse is on ( or `null` )
export function SpeedChart({ data, onHover }) {
  return (
    <ChartContainer config={CHART_CONFIG} className="aspect-auto h-56 w-full">
      <LineChart
        data={data}
        // same `syncId` on both charts ==> hovering one shows the tooltip on the other at the same moment
        syncId="trip-traces"
        onMouseMove={(state) => onHover(state.activeTooltipIndex ?? null)}
        onMouseLeave={() => onHover(null)}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="time" tickFormatter={(time) => formatTime(time).slice(0, 5)} minTickGap={40} />
        <YAxis width={32} tickFormatter={(value) => Math.round(value)} />
        <ChartTooltip
          content={<TraceTooltip labels={{ speed: "Speed" }} formatValue={(_, value) => `${Math.round(value)} km/h`} />}
        />
        <Line dataKey="speed" stroke="var(--color-speed)" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  )
}
