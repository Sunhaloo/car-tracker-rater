import { useCallback, useEffect, useState } from "react"
import { ConfirmDeleteDialog } from "@/components/settings/ConfirmDeleteDialog"
import { PlaceFormDialog } from "@/components/settings/PlaceFormDialog"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiRequest } from "@/lib/api"

// personal named places ( "Home", "University" ) ==> used for the start / end names of trips
export function PlacesSection() {
  const [places, setPlaces] = useState(null)
  const [error, setError] = useState("")
  // what happened after the last change ==> e.g. "Place added. Place names were refreshed on 13 finished trips."
  const [notice, setNotice] = useState("")
  // `undefined` ==> form closed, `null` ==> adding, a place ==> editing that place
  const [formPlace, setFormPlace] = useState(undefined)
  const [deletePlace, setDeletePlace] = useState(null)

  const loadPlaces = useCallback(() => {
    apiRequest("/api/places")
      .then((data) => {
        setPlaces(data)
        setError("")
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    loadPlaces()
  }, [loadPlaces])

  // after every add / edit / delete ==> old trips keep their old names until the server relabels them
  async function afterChange(message) {
    setFormPlace(undefined)
    loadPlaces()
    setNotice(`${message} Updating trip names…`)
    try {
      const { relabelled_trips } = await apiRequest("/api/places/relabel", { method: "POST" })
      setNotice(`${message} Place names were refreshed on ${relabelled_trips} finished trips.`)
    } catch (err) {
      setNotice(`${message} The trip names could not be refreshed: ${err.message}`)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* only mounted while open ==> every opening starts with a fresh form */}
      {formPlace !== undefined && (
        <PlaceFormDialog place={formPlace} onCancel={() => setFormPlace(undefined)} onSaved={afterChange} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Places</CardTitle>
          <CardDescription>
            Trips starting or ending inside a place get its name instead of the nearest town. Your places stay in
            your own account and are never shared.
          </CardDescription>
          <CardAction>
            <Button onClick={() => setFormPlace(null)}>Add place</Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* `role="status"` ==> screen readers announce the relabel result */}
          {notice && (
            <p role="status" className="text-sm">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {!error && places === null && <p className="text-muted-foreground">Loading places…</p>}
          {places?.length === 0 && <p className="text-muted-foreground">No places yet.</p>}

          {places?.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Radius</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {places.map((place) => (
                  <TableRow key={place.id}>
                    <TableCell className="font-medium">{place.label}</TableCell>
                    <TableCell className="text-right">{place.radius_m} m</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setFormPlace(place)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeletePlace(place)}>
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
      </Card>

      <ConfirmDeleteDialog
        open={deletePlace !== null}
        onOpenChange={(open) => !open && setDeletePlace(null)}
        title={`Delete “${deletePlace?.label}”?`}
        description="Trips that started or ended here will be renamed to the nearest town or to their coordinates."
        onConfirm={async () => {
          await apiRequest(`/api/places/${deletePlace.id}`, { method: "DELETE" })
          // not awaited ==> the dialog closes now, the relabel result appears on the page
          afterChange("Place deleted.")
        }}
      />
    </div>
  )
}
