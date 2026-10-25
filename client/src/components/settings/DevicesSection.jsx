import { useCallback, useEffect, useState } from "react"
import { ConfirmDeleteDialog } from "@/components/settings/ConfirmDeleteDialog"
import { DeviceFormDialog } from "@/components/settings/DeviceFormDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiRequest } from "@/lib/api"

// the user's ThingSpeak channels ==> list, add, edit, delete
export function DevicesSection() {
  const [devices, setDevices] = useState(null)
  const [error, setError] = useState("")
  // `undefined` ==> form closed, `null` ==> adding, a device ==> editing that device
  const [formDevice, setFormDevice] = useState(undefined)
  const [deleteDevice, setDeleteDevice] = useState(null)

  const loadDevices = useCallback(() => {
    apiRequest("/api/devices")
      .then((data) => {
        setDevices(data)
        setError("")
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Devices</CardTitle>
        <CardDescription>Each device is one ThingSpeak channel. New data is copied every 30 seconds.</CardDescription>
        <CardAction>
          <Button onClick={() => setFormDevice(null)}>Add device</Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!error && devices === null && <p className="text-muted-foreground">Loading devices…</p>}
        {devices?.length === 0 && <p className="text-muted-foreground">No devices yet. Add your ThingSpeak channel.</p>}

        {devices?.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Channel ID</TableHead>
                <TableHead>Read key</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.label}</TableCell>
                  <TableCell>{device.thingspeak_channel_id}</TableCell>
                  {/* the API only says whether a key is saved ==> the key itself never reaches the browser */}
                  <TableCell>
                    {device.has_read_key ? <Badge variant="outline">Read key saved</Badge> : "Missing"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setFormDevice(device)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteDevice(device)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* only mounted while open ==> every opening starts with a fresh form */}
      {formDevice !== undefined && (
        <DeviceFormDialog
          device={formDevice}
          onOpenChange={(open) => !open && setFormDevice(undefined)}
          onSaved={loadDevices}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteDevice !== null}
        onOpenChange={(open) => !open && setDeleteDevice(null)}
        title={`Delete “${deleteDevice?.label}”?`}
        description="This also deletes every sample and every trip recorded by this device. This cannot be undone."
        onConfirm={async () => {
          await apiRequest(`/api/devices/${deleteDevice.id}`, { method: "DELETE" })
          loadDevices()
        }}
      />
    </Card>
  )
}
