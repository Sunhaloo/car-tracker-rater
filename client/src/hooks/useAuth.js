import { useContext } from "react"
import { AuthContext } from "@/context/AuthContext"

// `const { user, login, logout } = useAuth()` inside any component below `AuthProvider`
export function useAuth() {
  return useContext(AuthContext)
}
