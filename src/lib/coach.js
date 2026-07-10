import { loadSessions } from '../storage/sessions'
import { buildCoachSummary } from '../domain/coachSummary'

// Prépare le résumé des séances et le soumet au serveur du Forgeron (api/coach).
// Renvoie le texte du conseil, ou lève une erreur lisible pour l'utilisateur.
export async function askCoach() {
  const summary = buildCoachSummary(loadSessions())

  let res
  try {
    res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary }),
    })
  } catch {
    throw new Error('Connexion impossible. Vérifie ton réseau et réessaie.')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Le Forgeron est indisponible pour le moment.')
  }
  return data.conseil
}
