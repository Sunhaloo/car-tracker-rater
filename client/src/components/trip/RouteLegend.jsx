import { ROUTE_BUCKETS } from "@/lib/track"

// what the route colours and event letters mean ==> written out, so the map never relies on colour alone
export function RouteLegend() {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(ROUTE_BUCKETS).map(([name, bucket]) => (
          <li key={name} className="flex items-center gap-2">
            <span className="h-1.5 w-5 rounded-full" style={{ background: bucket.colour }} aria-hidden="true" />
            {bucket.label}
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground">Pins: A = hard accelerating, B = hard braking, C = hard cornering</p>
    </div>
  )
}
