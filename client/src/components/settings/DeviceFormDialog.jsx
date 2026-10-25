import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiRequest } from "@/lib/api"

// add a ThingSpeak channel, or edit one ( `device` given )
// NOTE: the read key is write-only ==> the API never sends it back, so the field always starts empty
// --> when editing, an empty key field means "keep the current key"
export function DeviceFormDialog({ device, onOpenChange, onSaved }) {
  const isEdit = device !== null
  const [label, setLabel] = useState(device?.label ?? "")
  const [channelId, setChannelId] = useState(device ? String(device.thingspeak_channel_id) : "")
  const [readKey, setReadKey] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  // the server tests the channel with ThingSpeak whenever the channel or the key changes ==> can take a few seconds
  const checksThingSpeak = !isEdit || readKey !== "" || Number(channelId) !== device.thingspeak_channel_id

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")

    // the server wants the channel ID as a number ==> an empty field becomes 0 and the server explains why it is wrong
    let body = { label, thingspeak_channel_id: Number(channelId), read_key: readKey }

    if (isEdit) {
      // only send what changed ==> an unchanged channel would be re-tested with ThingSpeak for nothing
      body = {}
      if (label !== device.label) body.label = label
      if (Number(channelId) !== device.thingspeak_channel_id) body.thingspeak_channel_id = Number(channelId)
      if (readKey !== "") body.read_key = readKey
      if (Object.keys(body).length === 0) return onOpenChange(false)
    }

    setSaving(true)
    try {
      await apiRequest(isEdit ? `/api/devices/${device.id}` : "/api/devices", {
        method: isEdit ? "PATCH" : "POST",
        body,
      })
      onSaved()
      onOpenChange(false)
    } catch (err) {
      // e.g. "ThingSpeak rejected the channel ID or read key" / "This channel is already registered"
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit device" : "Add a device"}</DialogTitle>
            <DialogDescription>
              The ThingSpeak channel your ESP32 uploads to. The read key is checked with ThingSpeak, stored
              encrypted and never shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="device-label">Label</Label>
            <Input id="device-label" placeholder="e.g. Mazda 3" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="device-channel">ThingSpeak channel ID</Label>
            <Input
              id="device-channel"
              type="number"
              inputMode="numeric"
              min="1"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="device-key">{isEdit ? "New read key (optional)" : "Read key"}</Label>
            <Input
              id="device-key"
              type="password"
              // stop the browser offering to save it as a password
              autoComplete="off"
              placeholder={isEdit ? "Leave empty to keep the current key" : ""}
              value={readKey}
              onChange={(e) => setReadKey(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (checksThingSpeak ? "Checking with ThingSpeak…" : "Saving…") : isEdit ? "Save" : "Add device"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
