import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/cinzel/400.css'
import '@fontsource/cinzel/600.css'

import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Après un déploiement, la version encore ouverte peut réclamer un écran (chargé
// à la demande) dont le fichier n'existe plus : on recharge une fois pour passer
// à la nouvelle version. Pas deux rechargements en 10 s : si ça échoue encore,
// l'ErrorBoundary affiche son bouton au lieu de boucler.
const RELOAD_KEY = 'kwest:preload-reload'
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < 10000) return
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
