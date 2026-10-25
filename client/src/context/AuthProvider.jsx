import { useEffect, useState } from "react"
import { AuthContext } from "@/context/AuthContext"
import { apiRequest } from "@/lib/api"
import { clearToken, getToken, setToken } from "@/lib/storage"

// holds the logged-in user for the whole app
// NOTE: the token is the proof of login --> `user` is the profile we load with it from `GET /api/auth/me`
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // true until we know whether the saved token still works ==> stops a flash of the login page
  const [loading, setLoading] = useState(() => getToken() !== null)

  // on page load ==> check a saved token once
  useEffect(() => {
    if (!getToken()) return
    apiRequest("/api/auth/me")
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  // shared by login and register ==> both answer with a token, then we ask who that token belongs to
  async function startSession(token) {
    setToken(token)
    setUser(await apiRequest("/api/auth/me"))
  }

  async function login(username, password) {
    const { token } = await apiRequest("/api/auth/login", {
      method: "POST",
      body: { username, password },
      skipAuthRedirect: true,
    })
    await startSession(token)
  }

  async function register(username, email, password) {
    const { token } = await apiRequest("/api/auth/register", {
      method: "POST",
      body: { username, email, password },
    })
    await startSession(token)
  }

  // there is no logout route ==> the token is stateless, so forgetting it is the logout
  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
