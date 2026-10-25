import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AuthProvider } from "@/context/AuthProvider"
import { AuthPage } from "@/pages/AuthPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { StatusPage } from "@/pages/StatusPage"
import { TripPage } from "@/pages/TripPage"
import { TripsPage } from "@/pages/TripsPage"

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
              <Route path="/trips/:id" element={<TripPage />} />
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
