const THEME_KEY = 'kwest:theme'

export function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme) {
  const root = document.documentElement
  root.classList.toggle('theme-light', theme === 'light')
  root.setAttribute('data-theme', theme)
}

export function setTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {}
  applyTheme(theme)
}

export function toggleTheme() {
  const next = loadTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

export function initTheme() {
  applyTheme(loadTheme())
}
