import { Link } from "react-router-dom"

// any URL that matches no route
export function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-2">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/" className="underline underline-offset-4">
        Back to your trips
      </Link>
    </div>
  )
}
