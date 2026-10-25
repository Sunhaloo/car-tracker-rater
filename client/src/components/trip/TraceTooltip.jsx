import { formatTime } from "@/lib/format"

// hover box of the speed and G charts ==> the time, then one line per series
// `labels` ==> series name per data key, `formatValue(key, value)` ==> the value as text
export function TraceTooltip({ active, payload, labels, formatValue }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium">{formatTime(payload[0].payload.time)}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: item.color }} aria-hidden="true" />
          {labels[item.dataKey]}: {item.value === null ? "—" : formatValue(item.dataKey, item.value)}
        </p>
      ))}
    </div>
  )
}
