import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AuthProvider } from "@/context/AuthProvider"
import { AuthPage } from "@/pages/AuthPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { StatusPage } from "@/pages/StatusPage"
import { TripsPage } from "@/pages/TripsPage"

// the trip page carries the chart and map libraries ==> only download them when a trip is opened
const TripPage = lazy(() => import("@/pages/TripPage").then((module) => ({ default: module.TripPage })))

// every URL of the web app
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* `key` ==> switching between login and register starts with an empty form */}
          <Route path="/login" element={<AuthPage key="login" mode="login" />} />
          <Route path="/register" element={<AuthPage key="register" mode="register" />} />

          {/* everything inside needs a login and shares the nav bar */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<TripsPage />} />
              <Route
                path="/trips/:id"
                element={
                  <Suspense fallback={<p className="text-muted-foreground">Loading trip…</p>}>
                    <TripPage />
                  </Suspense>
                }
              />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
