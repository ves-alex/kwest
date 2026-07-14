import { supabase } from './supabase'
import { PLAYER_KEY, SESSIONS_KEY } from '../storage/keys'

let pushSyncTimer = null

async function doPush() {
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

// Pousse localStorage → Supabase, debounce 2s pour éviter un appel réseau par action UI.
// `immediate` court-circuite le debounce — indispensable pour la fin de séance : si
// l'app est tuée pendant le délai, la séance n'atteint jamais le cloud.
export function pushSync({ immediate = false } = {}) {
  clearTimeout(pushSyncTimer)
  if (immediate) {
    doPush()
    return
  }
  pushSyncTimer = setTimeout(doPush, 2000)
}

// Fusionne le player cloud et le player local : union des possessions, max des
// compteurs. Les totaux runes/XP sont recalculés depuis les sessions par loadPlayer.
function mergePlayer(cloud, local) {
  if (!local) return cloud
  return {
    ...cloud,
    cosmeticsOwned: Array.from(
      new Set([...(cloud.cosmeticsOwned ?? []), ...(local.cosmeticsOwned ?? [])]),
    ),
    badgesUnlocked: Array.from(
      new Set([...(cloud.badgesUnlocked ?? []), ...(local.badgesUnlocked ?? [])]),
    ),
    runesSpent: Math.max(cloud.runesSpent ?? 0, local.runesSpent ?? 0),
    prestigeStars: Math.max(cloud.prestigeStars ?? 0, local.prestigeStars ?? 0),
  }
}

// Charge les données depuis Supabase et les FUSIONNE avec localStorage.
// Jamais d'écrasement aveugle : une séance locale absente du cloud (push raté à la
// salle, app tuée pendant le debounce…) est conservée et renvoyée au cloud.
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
    try {
      const cloudSessions = data.sessions ?? []
      const localSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]')
      const cloudIds = new Set(cloudSessions.map((s) => s.id))
      const localOnly = localSessions.filter((s) => !cloudIds.has(s.id))
      const mergedSessions = [...cloudSessions, ...localOnly]

      const localPlayer = JSON.parse(localStorage.getItem(PLAYER_KEY) ?? 'null')
      const mergedPlayer = mergePlayer(data.player ?? {}, localPlayer)

      localStorage.setItem(PLAYER_KEY, JSON.stringify(mergedPlayer))
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(mergedSessions))

      // Le local avait de l'avance sur le cloud → on répare le cloud tout de suite
      if (
        localOnly.length > 0 ||
        JSON.stringify(mergedPlayer) !== JSON.stringify(data.player)
      ) {
        console.log(
          `[kwest] loadFromCloud : fusion (${localOnly.length} séance(s) locale(s) réinjectée(s))`,
        )
        await saveToCloud(userId, mergedPlayer, mergedSessions)
      }
    } catch (err) {
      // En cas de pépin de fusion, on garde le comportement historique (copie cloud)
      console.error('[kwest] loadFromCloud merge failed', err)
      localStorage.setItem(PLAYER_KEY, JSON.stringify(data.player))
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(data.sessions))
    }
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
