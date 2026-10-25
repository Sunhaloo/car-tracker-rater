// keeps the login token between page reloads
// NOTE: `localStorage` can throw ( private mode, blocked site data ) ==> every access is wrapped in try/catch
// --> when it fails the token only lives in memory, so the app still works until the page is reloaded

const TOKEN_KEY = "car-tracker-token"

// fallback copy ==> used when `localStorage` is not available
let memoryToken = null

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? memoryToken
  } catch {
    return memoryToken
  }
}

export function setToken(token) {
  memoryToken = token
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // storage blocked ==> the memory copy is enough
  }
}

export function clearToken() {
  memoryToken = null
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage blocked ==> nothing was saved there anyway
  }
}
