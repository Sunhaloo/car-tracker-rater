import { NavLink, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

const LINKS = [
  // `end` ==> "/" is only active on the trips page itself, not on every page
  { to: "/", label: "Trips", end: true },
  { to: "/status", label: "Status" },
  { to: "/settings", label: "Settings" },
]

// top bar on every logged-in page ==> wraps onto two lines on a phone instead of scrolling sideways
export function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <span className="font-semibold">Car Tracker</span>

        <ul className="flex gap-1">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm hover:bg-accent",
                    isActive ? "bg-accent font-medium" : "text-muted-foreground",
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.username}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </nav>
    </header>
  )
}
