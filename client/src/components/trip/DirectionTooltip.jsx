import { EVENT_THRESHOLD_G } from "@/lib/constants"

const formatG = (value) => (value === null ? "—" : `${value.toFixed(2)} g`)

// hover box of the direction-meter ==> Recharts passes `active` and `payload` ( the hovered data row )
// NOTE: shows the real values, not the ones cut at the edge of the fixed scale
export function DirectionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium">{row.direction}</p>
      <p className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-(--color-trip)" aria-hidden="true" />
        This trip: {formatG(row.tripValue)}
      </p>
      {row.averageValue !== null && (
        <p className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-(--color-average)" aria-hidden="true" />
          Last 5 average: {formatG(row.averageValue)}
        </p>
      )}
      {row.tripValue > EVENT_THRESHOLD_G && (
        <p className="mt-1 text-muted-foreground">Above the {EVENT_THRESHOLD_G.toFixed(2)} g threshold</p>
      )}
    </div>
  )
}
