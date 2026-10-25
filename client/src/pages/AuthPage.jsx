import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"

// one page for `/login` and `/register` ==> `mode` decides the title, the email field and which call is made
export function AuthPage({ mode }) {
  const isRegister = mode === "register"
  const { user, loading, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // already logged in ==> nothing to do here
  if (!loading && user) return <Navigate to="/" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      if (isRegister) await register(username, email, password)
      else await login(username, password)
      // back to the page they first asked for ( set by `ProtectedRoute` )
      navigate(location.state?.from ?? "/", { replace: true })
    } catch (err) {
      // the server's own message ==> e.g. "Invalid username or password"
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{isRegister ? "Create an account" : "Log in"}</CardTitle>
          <CardDescription>Car Tracker and Driver Rater</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            {isRegister && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {/* `role="alert"` ==> screen readers announce the error as soon as it appears */}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>

          <CardFooter className="mt-6 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Please wait…" : isRegister ? "Register" : "Log in"}
            </Button>
            <p className="text-sm text-muted-foreground">
              {isRegister ? "Already have an account? " : "No account yet? "}
              <Link to={isRegister ? "/login" : "/register"} className="underline underline-offset-4">
                {isRegister ? "Log in" : "Register"}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
