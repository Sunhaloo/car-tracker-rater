import { PositionMap } from "@/components/map/PositionMap"
import { EspCard } from "@/components/status/EspCard"
import { SensorCard } from "@/components/status/SensorCard"
import { formatDateTime } from "@/lib/format"

// one device split into its parts ==> the ESP32, its GPS and its IMU, side by side
// `device` ==> one item of `devices` from `GET /api/status`
export function DeviceStatusSection({ device }) {
  const position = device.last_position

  return (
    <section className="flex flex-col gap-3" aria-labelledby={`device-${device.device_id}`}>
      <h2 id={`device-${device.device_id}`} className="text-lg font-semibold">
        {device.label}
      </h2>

      {/* offline ==> the server cannot know how the sensors are doing, so it reports them as unknown */}
      {!device.online && (
        <p className="text-sm text-muted-foreground">
          The ESP32 is offline, so the sensor states below are unknown until it sends data again.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <EspCard device={device} />

        <SensorCard title="GPS" description="Position and speed" sensor={device.gps}>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {device.online ? "Latest position" : "Last known position"}
              {position && ` · ${formatDateTime(position.time)}`}
            </p>
            {position ? (
              <PositionMap latitude={position.latitude} longitude={position.longitude} />
            ) : (
              <p className="text-sm text-muted-foreground">No GPS position recorded yet.</p>
            )}
          </div>
        </SensorCard>

        <SensorCard title="IMU" description="Acceleration, braking and cornering" sensor={device.imu} />
      </div>
    </section>
  )
}
