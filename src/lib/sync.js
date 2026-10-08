import { supabase } from './supabase'
import {
  PLAYER_KEY,
  SESSIONS_KEY,
  ROUTINES_KEY,
  DELETED_KEY,
  DELETED_ROUTINES_KEY,
  PENDING_KEY,
  OWNER_KEY,
} from '../storage/keys'

// ============================================================================
// Modèle cloud : une ligne par élément.
// - tables `sessions` et `routines` : PK (user_id, id), data JSONB — upserts/
//   deletes unitaires, plus jamais de blob complet sur le réseau.
// - table `deletions` : trace des suppressions, pour qu'un autre appareil ne
//   renvoie pas au cloud ce qui a été supprimé ailleurs.
// - table `user_data` : player JSONB uniquement. Le champ historique `sessions`
//   (blob) est migré vers la table au premier lancement, puis remis à null.
// localStorage reste la source de vérité locale ; le cloud est un miroir.
// Ce qui n'a pas encore atteint le cloud est noté dans une file persistante
// (éléments modifiés, profil modifié, suppressions) : elle survit à l'app tuée,
// et la fusion au démarrage ne l'écrase jamais.
// ============================================================================

// Collections synchronisées ligne par ligne
const COLLECTIONS = {
  sessions: { table: 'sessions', key: SESSIONS_KEY, deletedKey: DELETED_KEY, kind: 'session' },
  routines: { table: 'routines', key: ROUTINES_KEY, deletedKey: DELETED_ROUTINES_KEY, kind: 'routine' },
}
const NAMES = Object.keys(COLLECTIONS)

let playerTimer = null
let inflight = 0

// --- File d'attente persistante ---
// sessions / routines : ids des éléments modifiés ici et pas encore confirmés
// player              : profil modifié ici et pas encore confirmé
// (les suppressions ont leur propre file : les tombstones, plus bas)
function loadPending() {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null')
    return { sessions: p?.sessions ?? [], routines: p?.routines ?? [], player: !!p?.player }
  } catch {
    return { sessions: [], routines: [], player: false }
  }
}
function savePending(p) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(p)) } catch { /* best-effort */ }
}
function markPending(name, ids) {
  const p = loadPending()
  savePending({ ...p, [name]: [...new Set([...p[name], ...ids])] })
}
function unmarkPending(name, ids) {
  const done = new Set(ids)
  const p = loadPending()
  savePending({ ...p, [name]: p[name].filter((id) => !done.has(id)) })
}
function setPlayerPending(value) {
  savePending({ ...loadPending(), player: value })
}

function loadLocal(name) {
  try { return JSON.parse(localStorage.getItem(COLLECTIONS[name].key) ?? '[]') } catch { return [] }
}

// Retire de la file les éléments confirmés par le cloud — sauf ceux modifiés
// de nouveau pendant l'envoi : leur nouvelle version reste à envoyer.
function confirmRows(name, pushed) {
  const local = new Map(loadLocal(name).map((x) => [x.id, JSON.stringify(x)]))
  const done = pushed.filter((x) => !local.has(x.id) || local.get(x.id) === JSON.stringify(x))
  unmarkPending(name, done.map((x) => x.id))
}

// Quelque chose attend-il encore le cloud ?
export function hasPendingSync() {
  const p = loadPending()
  return p.player || NAMES.some((name) => p[name].length > 0 || loadTombstones(name).length > 0)
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

function rowOf(userId, x) {
  return { user_id: userId, id: x.id, data: x, updated_at: new Date().toISOString() }
}

// --- Tombstones : suppressions cloud à rejouer ---
// Un élément supprimé hors-ligne resterait au cloud et « ressusciterait » à la
// fusion suivante. On note l'id jusqu'à confirmation du DELETE.
function loadTombstones(name) {
  try { return JSON.parse(localStorage.getItem(COLLECTIONS[name].deletedKey) ?? '[]') } catch { return [] }
}
function saveTombstones(name, ids) {
  try { localStorage.setItem(COLLECTIONS[name].deletedKey, JSON.stringify(ids)) } catch { /* best-effort */ }
}
function addTombstones(name, ids) {
  saveTombstones(name, [...new Set([...loadTombstones(name), ...ids])])
}
function removeTombstones(name, ids) {
  const gone = new Set(ids)
  saveTombstones(name, loadTombstones(name).filter((x) => !gone.has(x)))
}

async function flushTombstones(name, userId) {
  const ids = loadTombstones(name)
  if (ids.length === 0) return true
  const { table, kind } = COLLECTIONS[name]
  // D'abord la trace (pour les autres appareils), puis la ligne. La trace est
  // un bonus : son échec n'empêche pas la suppression elle-même.
  const { error: traceErr } = await supabase
    .from('deletions')
    .upsert(ids.map((id) => ({ user_id: userId, kind, id })))
  if (traceErr) console.error('[kwest] trace des suppressions ratée', traceErr)
  const { error } = await supabase.from(table).delete().eq('user_id', userId).in('id', ids)
  if (error) {
    console.error(`[kwest] suppression ${table} ratée`, error)
    return false
  }
  removeTombstones(name, ids)
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

// Upsert d'un ou plusieurs éléments (une ligne chacun). Fire-and-forget côté
// appelant ; tant que le cloud n'a pas confirmé, ils restent dans la file.
function pushRows(name, list) {
  if (!list?.length) return Promise.resolve(true)
  markPending(name, list.map((x) => x.id))
  return track(async () => {
    const userId = await getUserId()
    // Pas de session lisible (jeton expiré hors ligne) : la file attend le retour du réseau
    if (!userId) return false
    const { table } = COLLECTIONS[name]
    const { error } = await supabase.from(table).upsert(list.map((x) => rowOf(userId, x)))
    if (error) {
      console.error(`[kwest] envoi ${table} raté`, error)
      return false
    }
    confirmRows(name, list)
    return true
  })
}

// Suppression définitive au cloud. En cas d'échec (offline…), la tombstone
// reste posée et sera rejouée par resyncAll / loadFromCloud.
function deleteRowCloud(name, id) {
  addTombstones(name, [id])
  unmarkPending(name, [id]) // la suppression remplace un éventuel envoi en attente
  return track(async () => {
    const userId = await getUserId()
    // Pas de session lisible (jeton expiré hors ligne, l'app tourne sur ses
    // données locales) : la tombstone attend le retour du réseau. Une vraie
    // déconnexion vide le stockage, tombstones comprises.
    if (!userId) return false
    return flushTombstones(name, userId)
  })
}

export const pushSessions = (list) => pushRows('sessions', list)
export const deleteSessionCloud = (id) => deleteRowCloud('sessions', id)
export const pushRoutines = (list) => pushRows('routines', list)
export const deleteRoutineCloud = (id) => deleteRowCloud('routines', id)

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
// éléments modifiés). Déclenchée au retour du réseau / au premier plan.
export async function resyncAll() {
  return track(async () => {
    const userId = await getUserId()
    if (!userId) return false
    for (const name of NAMES) await flushTombstones(name, userId)
    const pending = loadPending()
    if (pending.player) await doPushPlayer()
    for (const name of NAMES) {
      const ids = new Set(pending[name])
      const dirty = loadLocal(name).filter((x) => ids.has(x.id))
      // Ids en attente qui n'existent plus en local : plus rien à envoyer
      unmarkPending(name, [...ids].filter((id) => !dirty.some((x) => x.id === id)))
      if (dirty.length > 0) await pushRows(name, dirty)
    }
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

// Fusionne une collection : cloud prioritaire par id, SAUF les éléments
// modifiés ici et pas encore confirmés (file d'attente) ; locaux absents du
// cloud renvoyés ; supprimés (ici ou sur un autre appareil) écartés.
async function mergeCollection(name, userId, cloudItems, deletedElsewhere) {
  const byId = new Map(cloudItems.map((x) => [x.id, x]))

  // Supprimés sur un autre appareil : jamais gardés ni renvoyés. Une ligne
  // remise au cloud entre-temps (ancienne version de l'app) est re-supprimée.
  const resurrected = [...byId.keys()].filter((id) => deletedElsewhere.has(id))
  if (resurrected.length > 0) addTombstones(name, resurrected)
  unmarkPending(name, [...deletedElsewhere])

  // Suppressions en attente : rejouées avant la fusion pour qu'un élément
  // supprimé hors-ligne ne revienne pas
  const tombstones = new Set(loadTombstones(name))
  if (tombstones.size > 0) await flushTombstones(name, userId)
  for (const id of [...tombstones, ...deletedElsewhere]) byId.delete(id)

  const pending = new Set(loadPending()[name])
  const local = loadLocal(name).filter((x) => !deletedElsewhere.has(x.id))
  const dirty = local.filter((x) => pending.has(x.id))
  for (const x of dirty) byId.set(x.id, x)
  const localOnly = local.filter((x) => !byId.has(x.id) && !tombstones.has(x.id))
  localStorage.setItem(COLLECTIONS[name].key, JSON.stringify([...byId.values(), ...localOnly]))

  const toPush = [...dirty, ...localOnly]
  if (toPush.length > 0) {
    console.log(`[kwest] loadFromCloud : ${toPush.length} élément(s) ${name} renvoyé(s)`)
    await pushRows(name, toPush)
  }
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

    // 4. Suppressions faites sur les autres appareils (illisibles = aucune :
    //    on ne bloque pas le chargement pour autant)
    const deleted = { session: new Set(), routine: new Set() }
    const { data: delRows, error: delErr } = await supabase
      .from('deletions')
      .select('kind, id')
      .eq('user_id', userId)
    if (delErr) console.error('[kwest] trace des suppressions illisible', delErr)
    for (const r of delRows ?? []) deleted[r.kind]?.add(r.id)

    // 5. Fusion des séances
    await mergeCollection('sessions', userId, [...blobSessions, ...(rows ?? []).map((r) => r.data)], deleted.session)

    // 6. Fusion des routines (illisibles : on garde les locales telles quelles,
    //    elles partiront au prochain chargement réussi)
    const { data: routineRows, error: rtErr } = await supabase
      .from('routines')
      .select('data')
      .eq('user_id', userId)
    if (rtErr) console.error('[kwest] routines illisibles', rtErr)
    else await mergeCollection('routines', userId, (routineRows ?? []).map((r) => r.data), deleted.routine)

    // 7. Player : union des possessions, max des compteurs (les totaux
    //    runes/XP sont recalculés depuis les sessions par loadPlayer). Profil
    //    modifié ici et pas encore confirmé : ses réglages l'emportent.
    const pending = loadPending()
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

// Supprime le compte pour de bon : données ET identité (fonction SQL
// delete_my_account, voir supabase/routines-suppressions-compte.sql). En cas
// d'erreur rien n'est supprimé et l'erreur remonte à l'écran.
export async function deleteAccount() {
  clearTimeout(playerTimer) // plus aucun envoi du profil après la suppression
  playerTimer = null
  const { error } = await supabase.rpc('delete_my_account')
  if (error) {
    console.error('[kwest] deleteAccount failed', error)
    throw error
  }
  // Le compte n'existe plus : on ferme la session de ce téléphone (les autres
  // sont invalidées côté serveur), puis on vide le stockage
  const { error: outErr } = await supabase.auth.signOut({ scope: 'local' })
  localStorage.clear()
  if (outErr) window.location.reload()
}
