import { Outlet } from "react-router-dom"
import { NavBar } from "@/components/NavBar"

// shared frame of every logged-in page ==> the nav bar on top, the current page below ( `Outlet` )
export function Layout() {
  return (
    <div className="min-h-svh">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
