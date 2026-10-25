// light / dark mode follows the operating system setting
// NOTE: shadcn's dark colours apply when `<html>` has the `dark` class ( see `.dark` in `index.css` )
export function followSystemTheme() {
  const query = window.matchMedia("(prefers-color-scheme: dark)")
  const apply = () => document.documentElement.classList.toggle("dark", query.matches)

  apply()
  // the user switches theme while the page is open ==> follow it straight away
  query.addEventListener("change", apply)
}
