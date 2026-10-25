import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// colour + word per `state` from the API ==> grey = unknown, orange = warning, green = ok
const STATES = {
  unknown: { word: "Unknown", dot: "bg-neutral-400" },
  warning: { word: "Warning", dot: "bg-orange-500" },
  ok: { word: "OK", dot: "bg-green-600" },
}

// one sensor of the ESP32 ( GPS or IMU ) ==> its light, the API's message and optional extra content
// `sensor` ==> `{ state, message }` from `GET /api/status`, `children` ==> e.g. the position map
export function SensorCard({ title, description, sensor, children }) {
  const state = STATES[sensor.state]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          {/* the dot is decoration ==> the word carries the meaning */}
          <Badge variant="outline" className="gap-1.5">
            <span className={cn("size-2 rounded-full", state.dot)} aria-hidden="true" />
            {state.word}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-lg font-medium">{sensor.message}</p>
        {children}
      </CardContent>
    </Card>
  )
}
