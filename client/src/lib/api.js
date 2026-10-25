// the ONE helper every API request goes through
// 1. adds `Authorization: Bearer <token>` when we have a token
// 2. turns the server's `{ error: "..." }` answers into thrown errors with that exact message
// 3. on a 401 ( except the login request ) ==> forgets the token and goes back to the login page
import { clearToken, getToken } from "@/lib/storage"

// default to the local API ==> set `VITE_API_URL` in `client/.env` to change it
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

// `skipAuthRedirect` ==> the login form shows "Invalid username or password" instead of reloading the page
export async function apiRequest(path, { method = "GET", body, skipAuthRedirect = false } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers["Content-Type"] = "application/json"

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // no answer at all ==> the API is not running or the network is down ( the server has no message to give )
    throw new Error("Could not reach the server")
  }

  // 204 = no content ( a delete ) ==> there is no JSON body to read
  const data = response.status === 204 ? null : await response.json().catch(() => null)

  if (response.status === 401 && !skipAuthRedirect) {
    // expired or invalid token ==> drop it and start again from the login page
    clearToken()
    if (window.location.pathname !== "/login") window.location.assign("/login")
  }

  if (!response.ok) {
    // use the server's own message --> a non-JSON answer ( e.g. an unknown route ) only has the status code
    throw new Error(data?.error ?? `Request failed (${response.status})`)
  }

  return data
}
