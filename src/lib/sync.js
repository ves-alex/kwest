import { supabase } from './supabase'

const PLAYER_KEY = 'kwest:player'
const SESSIONS_KEY = 'kwest:sessions'

// Pousse localStorage → Supabase sans bloquer l'appelant
export async function pushSync() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  try {
    const player = JSON.parse(localStorage.getItem(PLAYER_KEY) ?? '{}')
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]')
    await saveToCloud(session.user.id, player, sessions)
  } catch (err) {
    console.error('[kwest] pushSync failed', err)
  }
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

// Appelé après chaque savePlayer() — lit localStorage et pousse vers Supabase
export async function syncPlayer(userId) {
  try {
    const player = JSON.parse(localStorage.getItem(PLAYER_KEY) ?? '{}')
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]')
    await saveToCloud(userId, player, sessions)
  } catch (err) {
    console.error('[kwest] syncPlayer failed', err)
  }
}

// Appelé après saveSession() — même chose
export async function syncSessions(userId) {
  try {
    const player = JSON.parse(localStorage.getItem(PLAYER_KEY) ?? '{}')
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]')
    await saveToCloud(userId, player, sessions)
  } catch (err) {
    console.error('[kwest] syncSessions failed', err)
  }
}
