import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import { followSystemTheme } from "@/lib/theme"

// set light / dark before the first render ==> no flash of the wrong colours
followSystemTheme()

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
