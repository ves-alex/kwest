import { supabase } from './supabase'
import { PLAYER_KEY, SESSIONS_KEY, DELETED_KEY } from '../storage/keys'

// ============================================================================
// Modèle cloud : une ligne par séance.
// - table `sessions`  : PK (user_id, id), data JSONB — upserts/deletes unitaires,
//   plus jamais de blob complet sur le réseau.
// - table `user_data` : player JSONB uniquement. Le champ historique `sessions`
//   (blob) est migré vers la table au premier lancement, puis remis à null.
// localStorage reste la source de vérité locale ; le cloud est un miroir.
// ============================================================================

let playerTimer = null

// --- État de synchronisation ---
// 'synced'  : rien en attente, dernière opération réussie
// 'pending' : une opération est programmée ou en vol
// 'error'   : une opération a échoué → resyncAll() rejouera tout (retry auto)
let syncState = 'synced'

function setSyncState(next) {
  if (syncState === next) return
  syncState = next
  window.dispatchEvent(new Event('kwest:sync-change'))
}

export function getSyncState() {
  return syncState
}

async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

function rowOf(userId, s) {
  return { user_id: userId, id: s.id, data: s, updated_at: new Date().toISOString() }
}

// --- Tombstones : suppressions cloud à rejouer ---
// Une séance supprimée hors-ligne resterait au cloud et « ressusciterait » à la
// fusion suivante. On note l'id jusqu'à confirmation du DELETE.
function loadTombstones() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) ?? '[]') } catch { return [] }
}
function saveTombstones(ids) {
  try { localStorage.setItem(DELETED_KEY, JSON.stringify(ids)) } catch { /* best-effort */ }
}
function addTombstone(id) {
  saveTombstones([...new Set([...loadTombstones(), id])])
}
function removeTombstones(ids) {
  const gone = new Set(ids)
  saveTombstones(loadTombstones().filter((x) => !gone.has(x)))
}

async function flushTombstones(userId) {
  const ids = loadTombstones()
  if (ids.length === 0) return true
  const { error } = await supabase.from('sessions').delete().eq('user_id', userId).in('id', ids)
  if (error) {
    console.error('[kwest] flushTombstones failed', error)
    return false
  }
  removeTombstones(ids)
  return true
}

// --- Pushes unitaires ---

// Upsert d'une ou plusieurs séances (une ligne chacune). Fire-and-forget côté
// appelant ; l'état de sync reflète le résultat.
export async function pushSessions(list) {
  if (!list?.length) return true
  setSyncState('pending')
  const userId = await getUserId()
  if (!userId) { setSyncState('synced'); return true } // déconnecté : rien à pousser
  const { error } = await supabase.from('sessions').upsert(list.map((s) => rowOf(userId, s)))
  if (error) console.error('[kwest] pushSessions failed', error)
  setSyncState(error ? 'error' : 'synced')
  return !error
}

// Suppression définitive au cloud. En cas d'échec (offline…), la tombstone
// reste posée et sera rejouée par resyncAll / loadFromCloud.
export async function deleteSessionCloud(id) {
  addTombstone(id)
  setSyncState('pending')
  const userId = await getUserId()
  if (!userId) { removeTombstones([id]); setSyncState('synced'); return true }
  const { error } = await supabase.from('sessions').delete().eq('user_id', userId).eq('id', id)
  if (error) {
    console.error('[kwest] deleteSessionCloud failed', error)
    setSyncState('error')
    return false
  }
  removeTombstones([id])
  setSyncState('synced')
  return true
}

// --- Player (debounce 2 s, comme l'historique pushSync) ---
export function pushPlayer({ immediate = false } = {}) {
  clearTimeout(playerTimer)
  setSyncState('pending')
  if (immediate) {
    doPushPlayer()
    return
  }
  playerTimer = setTimeout(doPushPlayer, 2000)
}

async function doPushPlayer() {
  const userId = await getUserId()
  // Pas de session = rien à pousser nulle part : retour au repos pour ne pas
  // laisser un 'pending' fantôme (badge affiché + retry en boucle).
  if (!userId) { setSyncState('synced'); return }
  try {
    const player = JSON.parse(localStorage.getItem(PLAYER_KEY) ?? '{}')
    const { error } = await supabase
      .from('user_data')
      .upsert({ id: userId, player, updated_at: new Date().toISOString() })
    if (error) console.error('[kwest] pushPlayer failed', error)
    setSyncState(error ? 'error' : 'synced')
  } catch (err) {
    console.error('[kwest] pushPlayer failed', err)
    setSyncState('error')
  }
}

// --- Réparation : repousse tout l'état local (player + séances + tombstones).
// Déclenchée par le retry quand une opération unitaire a échoué : on ne sait
// pas laquelle, donc on réaligne le miroir complet — c'est le cas rare.
export async function resyncAll() {
  const userId = await getUserId()
  if (!userId) { setSyncState('synced'); return }
  setSyncState('pending')
  try {
    const player = JSON.parse(localStorage.getItem(PLAYER_KEY) ?? '{}')
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]')
    const okDeletes = await flushTombstones(userId)
    const { error: playerErr } = await supabase
      .from('user_data')
      .upsert({ id: userId, player, updated_at: new Date().toISOString() })
    let sessionsErr = null
    if (sessions.length > 0) {
      ;({ error: sessionsErr } = await supabase
        .from('sessions')
        .upsert(sessions.map((s) => rowOf(userId, s))))
    }
    setSyncState(okDeletes && !playerErr && !sessionsErr ? 'synced' : 'error')
  } catch (err) {
    console.error('[kwest] resyncAll failed', err)
    setSyncState('error')
  }
}

// Relance la sync dès que les conditions redeviennent favorables : retour du
// réseau, ou PWA remise au premier plan (le scénario type : app tuée / gelée à
// la salle, push jamais parti). À appeler une fois.
export function initSyncRetry() {
  const retry = () => {
    if (syncState !== 'synced') resyncAll()
  }
  window.addEventListener('online', retry)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') retry()
  })
}

// --- Chargement au démarrage : migration éventuelle du blob, puis fusion ---
export async function loadFromCloud(userId) {
  try {
    // 1. Player + éventuel blob historique
    const { data: userRow, error: userErr } = await supabase
      .from('user_data')
      .select('player, sessions')
      .eq('id', userId)
      .maybeSingle()
    if (userErr) {
      console.error('[kwest] loadFromCloud failed', userErr)
      return false
    }

    // 2. Migration one-shot du blob → table sessions (idempotente : tant que
    //    le blob n'est pas nul, on retente ; l'upsert par id ne duplique rien)
    let blobSessions = userRow?.sessions ?? []
    if (blobSessions.length > 0) {
      const { error: migErr } = await supabase
        .from('sessions')
        .upsert(blobSessions.map((s) => rowOf(userId, s)))
      if (!migErr) {
        // Ne JAMAIS avaler cette erreur : un blob qui refuse de se vider
        // (ex : colonne NOT NULL historique) doit se voir dans la console.
        const { error: clearErr } = await supabase
          .from('user_data')
          .update({ sessions: null })
          .eq('id', userId)
        if (clearErr) console.error('[kwest] vidage du blob raté (retentera)', clearErr)
        console.log(`[kwest] migration blob → table sessions : ${blobSessions.length} séance(s)`)
        blobSessions = []
      }
      // migErr → le blob reste source pour cette session, retentera au prochain lancement
    }

    // 3. Séances côté cloud (+ reliquat de blob si la migration vient d'échouer)
    const { data: rows, error: sesErr } = await supabase
      .from('sessions')
      .select('data')
      .eq('user_id', userId)
    if (sesErr) {
      console.error('[kwest] loadFromCloud failed', sesErr)
      return false
    }
    const byId = new Map()
    for (const s of blobSessions) byId.set(s.id, s)
    for (const r of rows ?? []) byId.set(r.data.id, r.data)

    // 4. Suppressions en attente : rejouées avant la fusion pour qu'une séance
    //    supprimée hors-ligne ne revienne pas
    const tombstones = new Set(loadTombstones())
    if (tombstones.size > 0) {
      await flushTombstones(userId)
      for (const id of tombstones) byId.delete(id)
    }

    // 5. Fusion séances : cloud prioritaire par id, locales absentes réinjectées
    const localSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]')
    const localOnly = localSessions.filter((s) => !byId.has(s.id) && !tombstones.has(s.id))
    const merged = [...byId.values(), ...localOnly]
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(merged))
    if (localOnly.length > 0) {
      console.log(`[kwest] loadFromCloud : ${localOnly.length} séance(s) locale(s) réinjectée(s)`)
      await pushSessions(localOnly)
    }

    // 6. Player : union des possessions, max des compteurs (les totaux
    //    runes/XP sont recalculés depuis les sessions par loadPlayer)
    const localPlayer = JSON.parse(localStorage.getItem(PLAYER_KEY) ?? 'null')
    const mergedPlayer = userRow?.player ? mergePlayer(userRow.player, localPlayer) : localPlayer
    if (mergedPlayer) {
      localStorage.setItem(PLAYER_KEY, JSON.stringify(mergedPlayer))
      if (!userRow?.player || JSON.stringify(mergedPlayer) !== JSON.stringify(userRow.player)) {
        pushPlayer({ immediate: true })
      }
    }

    return true
  } catch (err) {
    console.error('[kwest] loadFromCloud failed', err)
    return false
  }
}

// Fusionne le player cloud et le player local : union des possessions, max des
// compteurs. Champs scalaires (gender, weeklyGoal…) : priorité au cloud.
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

// Efface la progression cloud + local + déconnecte Google.
// Note : Supabase ne permet pas de supprimer auth.users depuis le client (nécessite
// une Edge Function avec service role). Se reconnecter avec le même Google recréera
// un onboarding vierge (rows absentes = comme un nouveau compte).
export async function deleteAccount() {
  const userId = await getUserId()
  if (!userId) return
  const { error: sesErr } = await supabase.from('sessions').delete().eq('user_id', userId)
  const { error: userErr } = await supabase.from('user_data').delete().eq('id', userId)
  if (sesErr || userErr) {
    console.error('[kwest] deleteAccount failed', sesErr ?? userErr)
    throw sesErr ?? userErr
  }
  localStorage.clear()
  await supabase.auth.signOut()
}
