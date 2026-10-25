import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

// wraps every page that needs a login ==> logged out users are sent to `/login`
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // still checking the saved token ==> wait instead of bouncing to the login page
  if (loading) {
    return <p className="p-6 text-muted-foreground">Loading…</p>
  }

  // remember where they wanted to go ==> the login page sends them back there afterwards
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
