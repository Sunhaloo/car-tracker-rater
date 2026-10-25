import { useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

// "are you sure?" before deleting a device or a place
// `onConfirm` ==> async delete; the dialog only closes when it worked, otherwise it shows the server's message
export function ConfirmDeleteDialog({ open, onOpenChange, title, description, onConfirm }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  // closing ==> forget the old error so it is not shown next time
  function handleOpenChange(nextOpen) {
    if (!nextOpen) setError("")
    onOpenChange(nextOpen)
  }

  async function handleDelete() {
    setDeleting(true)
    setError("")
    try {
      await onConfirm()
      handleOpenChange(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          {/* a plain button, not `AlertDialogAction` ==> that one closes the dialog before we know the result */}
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
