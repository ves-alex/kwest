import { supabase } from './supabase'
import { PLAYER_KEY, SESSIONS_KEY, DELETED_KEY, PENDING_KEY, OWNER_KEY } from '../storage/keys'

// ============================================================================
// Modèle cloud : une ligne par séance.
// - table `sessions`  : PK (user_id, id), data JSONB — upserts/deletes unitaires,
//   plus jamais de blob complet sur le réseau.
// - table `user_data` : player JSONB uniquement. Le champ historique `sessions`
//   (blob) est migré vers la table au premier lancement, puis remis à null.
// localStorage reste la source de vérité locale ; le cloud est un miroir.
// Ce qui n'a pas encore atteint le cloud est noté dans une file persistante
// (séances modifiées, profil modifié, suppressions) : elle survit à l'app tuée,
// et la fusion au démarrage ne l'écrase jamais.
// ============================================================================

let playerTimer = null
let inflight = 0

// --- File d'attente persistante ---
// sessions : ids des séances modifiées ici et pas encore confirmées par le cloud
// player   : profil modifié ici et pas encore confirmé
// (les suppressions ont leur propre file : les tombstones, plus bas)
function loadPending() {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null')
    return { sessions: p?.sessions ?? [], player: !!p?.player }
  } catch {
    return { sessions: [], player: false }
  }
}
function savePending(p) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(p)) } catch { /* best-effort */ }
}
function markSessionsPending(ids) {
  const p = loadPending()
  savePending({ ...p, sessions: [...new Set([...p.sessions, ...ids])] })
}
function unmarkSessions(ids) {
  const done = new Set(ids)
  const p = loadPending()
  savePending({ ...p, sessions: p.sessions.filter((id) => !done.has(id)) })
}
function setPlayerPending(value) {
  savePending({ ...loadPending(), player: value })
}

function loadLocalSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]') } catch { return [] }
}

// Retire de la file les séances confirmées par le cloud — sauf celles modifiées
// de nouveau pendant l'envoi : leur nouvelle version reste à envoyer.
function confirmSessions(pushed) {
  const local = new Map(loadLocalSessions().map((s) => [s.id, JSON.stringify(s)]))
  const done = pushed.filter((s) => !local.has(s.id) || local.get(s.id) === JSON.stringify(s))
  unmarkSessions(done.map((s) => s.id))
}

// Quelque chose attend-il encore le cloud ?
export function hasPendingSync() {
  const p = loadPending()
  return p.sessions.length > 0 || p.player || loadTombstones().length > 0
}

// --- État de synchronisation (dérivé de la file) ---
// 'synced'  : rien en attente
// 'pending' : une opération est programmée ou en vol
// 'error'   : des données attendent le cloud (échec, hors ligne, app relancée)
//             → resyncAll() les renverra (retry auto)
let syncState = 'synced'

function refreshSyncState() {
  const next = inflight > 0 || playerTimer !== null ? 'pending' : hasPendingSync() ? 'error' : 'synced'
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

// Une opération réseau : l'état passe à 'pending' le temps qu'elle tourne, puis
// est recalculé depuis la file (un succès ne masque plus l'échec d'un autre envoi).
async function track(op) {
  inflight++
  refreshSyncState()
  try {
    return await op()
  } catch (err) {
    console.error('[kwest] sync failed', err)
    return false
  } finally {
    inflight--
    refreshSyncState()
  }
}

// --- Pushes unitaires ---

// Upsert d'une ou plusieurs séances (une ligne chacune). Fire-and-forget côté
// appelant ; tant que le cloud n'a pas confirmé, elles restent dans la file.
export async function pushSessions(list) {
  if (!list?.length) return true
  markSessionsPending(list.map((s) => s.id))
  return track(async () => {
    const userId = await getUserId()
    // Pas de session lisible (jeton expiré hors ligne) : la file attend le retour du réseau
    if (!userId) return false
    const { error } = await supabase.from('sessions').upsert(list.map((s) => rowOf(userId, s)))
    if (error) {
      console.error('[kwest] pushSessions failed', error)
      return false
    }
    confirmSessions(list)
    return true
  })
}

// Suppression définitive au cloud. En cas d'échec (offline…), la tombstone
// reste posée et sera rejouée par resyncAll / loadFromCloud.
export async function deleteSessionCloud(id) {
  addTombstone(id)
  unmarkSessions([id]) // la suppression remplace un éventuel envoi en attente
  return track(async () => {
    const userId = await getUserId()
    // Pas de session lisible (jeton expiré hors ligne, l'app tourne sur ses
    // données locales) : la tombstone attend le retour du réseau. Une vraie
    // déconnexion vide le stockage, tombstones comprises.
    if (!userId) return false
    const { error } = await supabase.from('sessions').delete().eq('user_id', userId).eq('id', id)
    if (error) {
      console.error('[kwest] deleteSessionCloud failed', error)
      return false
    }
    removeTombstones([id])
    return true
  })
}

// --- Player (debounce 2 s) ---
export function pushPlayer({ immediate = false } = {}) {
  setPlayerPending(true)
  clearTimeout(playerTimer)
  playerTimer = null
  if (immediate) {
    doPushPlayer()
    return
  }
  playerTimer = setTimeout(() => {
    playerTimer = null
    doPushPlayer()
  }, 2000)
  refreshSyncState()
}

function doPushPlayer() {
  return track(async () => {
    const userId = await getUserId()
    if (!userId) return false
    const raw = localStorage.getItem(PLAYER_KEY) ?? '{}'
    const { error } = await supabase
      .from('user_data')
      .upsert({ id: userId, player: JSON.parse(raw), updated_at: new Date().toISOString() })
    if (error) {
      console.error('[kwest] pushPlayer failed', error)
      return false
    }
    // Profil modifié de nouveau pendant l'envoi : il reste à envoyer
    if ((localStorage.getItem(PLAYER_KEY) ?? '{}') === raw) setPlayerPending(false)
    return true
  })
}

// --- Réparation : renvoie ce qui attend dans la file (suppressions, profil,
// séances modifiées). Déclenchée au retour du réseau / au premier plan.
export async function resyncAll() {
  return track(async () => {
    const userId = await getUserId()
    if (!userId) return false
    await flushTombstones(userId)
    const pending = loadPending()
    if (pending.player) await doPushPlayer()
    const ids = new Set(pending.sessions)
    const dirty = loadLocalSessions().filter((s) => ids.has(s.id))
    // Ids en attente qui n'existent plus en local : plus rien à envoyer
    unmarkSessions([...ids].filter((id) => !dirty.some((s) => s.id === id)))
    if (dirty.length > 0) await pushSessions(dirty)
    return !hasPendingSync()
  })
}

// Relance la sync dès que les conditions redeviennent favorables : retour du
// réseau, ou PWA remise au premier plan (le scénario type : app tuée / gelée à
// la salle, push jamais parti). À appeler une fois. L'état initial reflète la
// file laissée par la session précédente.
export function initSyncRetry() {
  refreshSyncState()
  const retry = () => {
    if (syncState === 'error') resyncAll()
  }
  window.addEventListener('online', retry)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') retry()
  })
}

// Efface toutes les données kwest du téléphone (pas la session Supabase).
export function clearLocalData() {
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i))
    for (const key of keys) {
      if (key?.startsWith('kwest:')) localStorage.removeItem(key)
    }
  } catch { /* best-effort */ }
  refreshSyncState()
}

// --- Chargement au démarrage : migration éventuelle du blob, puis fusion ---
export async function loadFromCloud(userId) {
  // Données locales d'un AUTRE compte (session expirée puis connexion avec un
  // autre Google sur cet appareil) : jamais fusionnées dans ce compte-ci.
  try {
    const owner = localStorage.getItem(OWNER_KEY)
    if (owner && owner !== userId) {
      console.log('[kwest] données locales d\'un autre compte : effacées avant fusion')
      clearLocalData()
    }
    localStorage.setItem(OWNER_KEY, userId)
  } catch { /* best-effort */ }

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

    // 5. Fusion séances : cloud prioritaire par id, SAUF les séances modifiées
    //    ici et pas encore confirmées (file d'attente) ; locales absentes réinjectées
    const pending = loadPending()
    const localSessions = loadLocalSessions()
    const dirty = localSessions.filter((s) => pending.sessions.includes(s.id))
    for (const s of dirty) byId.set(s.id, s)
    const localOnly = localSessions.filter((s) => !byId.has(s.id) && !tombstones.has(s.id))
    const merged = [...byId.values(), ...localOnly]
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(merged))
    const toPush = [...dirty, ...localOnly]
    if (toPush.length > 0) {
      console.log(`[kwest] loadFromCloud : ${toPush.length} séance(s) locale(s) renvoyée(s)`)
      await pushSessions(toPush)
    }

    // 6. Player : union des possessions, max des compteurs (les totaux
    //    runes/XP sont recalculés depuis les sessions par loadPlayer). Profil
    //    modifié ici et pas encore confirmé : ses réglages l'emportent.
    const localPlayer = JSON.parse(localStorage.getItem(PLAYER_KEY) ?? 'null')
    const mergedPlayer = userRow?.player
      ? mergePlayer(userRow.player, localPlayer, { preferLocal: pending.player })
      : localPlayer
    if (mergedPlayer) {
      localStorage.setItem(PLAYER_KEY, JSON.stringify(mergedPlayer))
      if (pending.player || !userRow?.player || JSON.stringify(mergedPlayer) !== JSON.stringify(userRow.player)) {
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
// compteurs. Champs scalaires (gender, weeklyGoal…) : priorité au cloud, sauf si
// le profil local attend encore d'être envoyé (preferLocal).
function mergePlayer(cloud, local, { preferLocal = false } = {}) {
  if (!local) return cloud
  return {
    ...cloud,
    ...(preferLocal ? local : {}),
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
