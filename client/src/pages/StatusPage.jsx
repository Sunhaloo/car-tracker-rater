import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DeviceStatusSection } from "@/components/status/DeviceStatusSection"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { apiRequest } from "@/lib/api"
import { formatTime } from "@/lib/format"

// how often the page asks the API again
const REFRESH_MS = 10 * 1000

// hardware status ==> is each ESP32 sending data, and are its GPS and IMU working
export function StatusPage() {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    function load() {
      apiRequest("/api/status")
        .then((data) => {
          setStatus(data)
          setError("")
        })
        // keep the last good answer on screen ==> only add the error above it
        .catch((err) => setError(err.message))
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    // leaving the page ==> stop asking
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Hardware status</h1>
        {status && (
          <p className="text-sm text-muted-foreground">
            Checked at {formatTime(status.checked_at)} · refreshes every {REFRESH_MS / 1000} s
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Could not refresh the status</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!status && !error && <p className="text-muted-foreground">Loading status…</p>}

      {status?.devices.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground">
            No devices yet.{" "}
            <Link to="/settings" className="text-foreground underline underline-offset-4">
              Add your ThingSpeak channel in Settings
            </Link>{" "}
            to see its status here.
          </CardContent>
        </Card>
      )}

      {status?.devices.length > 0 && (
        <div className="flex flex-col gap-10">
          {status.devices.map((device) => (
            <DeviceStatusSection key={device.device_id} device={device} />
          ))}
        </div>
      )}
    </div>
  )
}
