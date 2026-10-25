import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatAge, formatDateTime } from "@/lib/format"

// the ESP32 itself ==> online / offline is decided by the server from how old the newest data is
// `device` ==> one item of `devices` from `GET /api/status`
export function EspCard({ device }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ESP32</CardTitle>
        <CardDescription>Sends the data</CardDescription>
        <CardAction>
          {device.online ? (
            <Badge className="bg-green-600/15 text-green-700 dark:text-green-400">ONLINE</Badge>
          ) : (
            <Badge variant="outline">OFFLINE</Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="text-sm text-muted-foreground">Data age</dt>
            <dd className="text-2xl font-semibold">{formatAge(device.data_age_s)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Last data received</dt>
            <dd>{formatDateTime(device.last_seen)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
