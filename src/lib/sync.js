import { supabase } from './supabase'
import { PLAYER_KEY, SESSIONS_KEY } from '../storage/keys'

let pushSyncTimer = null

// Pousse localStorage → Supabase, debounce 2s pour éviter un appel réseau par action UI
export function pushSync() {
  clearTimeout(pushSyncTimer)
  pushSyncTimer = setTimeout(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try {
      const player = JSON.parse(localStorage.getItem(PLAYER_KEY) ?? '{}')
      const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]')
      await saveToCloud(session.user.id, player, sessions)
    } catch (err) {
      console.error('[kwest] pushSync failed', err)
    }
  }, 2000)
}

// Charge les données depuis Supabase et les écrit dans localStorage
export async function loadFromCloud(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('player, sessions')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[kwest] loadFromCloud failed', error)
    return false
  }

  if (data) {
    localStorage.setItem(PLAYER_KEY, JSON.stringify(data.player))
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(data.sessions))
    return true
  }

  // Première connexion — migrer les données localStorage existantes
  const localPlayer = localStorage.getItem(PLAYER_KEY)
  const localSessions = localStorage.getItem(SESSIONS_KEY)
  if (localPlayer) {
    await saveToCloud(userId, JSON.parse(localPlayer), JSON.parse(localSessions ?? '[]'))
  }
  return true
}

export async function saveToCloud(userId, player, sessions) {
  const { error } = await supabase
    .from('user_data')
    .upsert({ id: userId, player, sessions, updated_at: new Date().toISOString() })

  if (error) console.error('[kwest] saveToCloud failed', error)
}

// Efface la progression cloud + local + déconnecte Google.
// Note : Supabase ne permet pas de supprimer auth.users depuis le client (nécessite
// une Edge Function avec service role). Se reconnecter avec le même Google recréera
// un onboarding vierge (row user_data absente = comme un nouveau compte).
export async function deleteAccount() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const userId = session.user.id
  const { error } = await supabase.from('user_data').delete().eq('id', userId)
  if (error) {
    console.error('[kwest] deleteAccount failed', error)
    throw error
  }
  localStorage.clear()
  await supabase.auth.signOut()
}
