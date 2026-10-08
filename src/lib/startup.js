import { isAuthRetryableFetchError } from '@supabase/supabase-js'
import { PLAYER_KEY } from '../storage/keys'

// Le joueur a-t-il déjà son profil sur ce téléphone ? (lecture brute, sans le
// recalcul des totaux de loadPlayer)
export function hasLocalProfile() {
  try {
    return !!JSON.parse(localStorage.getItem(PLAYER_KEY) ?? 'null')?.gender
  } catch {
    return false
  }
}

// getSession() n'a pas rendu de session. Si c'est faute de réseau (jeton expiré,
// renouvellement impossible), un joueur qui a son profil sur le téléphone garde
// l'app : ses données sont là, et le SDK renouvellera le jeton au retour du
// réseau. Sinon (jamais connecté, session révoquée) : écran de connexion.
export function canStayOffline(error, localProfile) {
  return localProfile && isAuthRetryableFetchError(error)
}
