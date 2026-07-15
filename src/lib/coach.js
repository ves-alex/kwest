import { loadSessions } from '../storage/sessions'
import { buildCoachSummary } from '../domain/coachSummary'
import { supabase } from './supabase'

// Envoie le fil de discussion + le résumé des séances au serveur du Forgeron.
// `messages` : [{ role: 'user' | 'assistant', content }]. Renvoie le texte de
// la réponse, ou lève une erreur lisible pour l'utilisateur.
// Le JWT Supabase accompagne chaque appel : le serveur refuse les anonymes
// (l'endpoint consomme des tokens Claude, il n'est pas public).
export async function askCoach(messages) {
  const summary = buildCoachSummary(loadSessions())

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Session expirée. Reconnecte-toi pour parler au Forgeron.')
  }

  let res
  try {
    res = await fetch('/api/coach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
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
