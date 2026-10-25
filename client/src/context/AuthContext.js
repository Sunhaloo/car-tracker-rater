import { createContext } from "react"

// shared login state ==> filled by `AuthProvider`, read with `useAuth()`
export const AuthContext = createContext(null)
