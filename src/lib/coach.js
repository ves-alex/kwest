import { loadSessions } from '../storage/sessions'
import { buildCoachSummary } from '../domain/coachSummary'

// Envoie le fil de discussion + le résumé des séances au serveur du Forgeron.
// `messages` : [{ role: 'user' | 'assistant', content }]. Renvoie le texte de
// la réponse, ou lève une erreur lisible pour l'utilisateur.
export async function askCoach(messages) {
  const summary = buildCoachSummary(loadSessions())

  let res
  try {
    res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, messages }),
    })
  } catch {
    throw new Error('Connexion impossible. Vérifie ton réseau et réessaie.')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Le Forgeron est indisponible pour le moment.')
  }
  return data.reponse
}
