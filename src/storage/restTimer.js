import { REST_TIMER_KEY } from './keys'

// Minuteur de repos en cours, gardé hors de l'écran Séance : il survit à
// « Ajouter un exercice », au changement d'onglet et à l'app tuée.
export function loadRestTimer() {
  try {
    return JSON.parse(localStorage.getItem(REST_TIMER_KEY) ?? 'null')
  } catch {
    return null
  }
}

export function saveRestTimer(timer) {
  try {
    localStorage.setItem(REST_TIMER_KEY, JSON.stringify(timer))
  } catch {
    /* best-effort — perdre le minuteur n'est pas grave */
  }
}

export function clearRestTimer() {
  try {
    localStorage.removeItem(REST_TIMER_KEY)
  } catch {
    /* best-effort */
  }
}
