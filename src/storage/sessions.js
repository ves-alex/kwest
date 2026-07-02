import { pushSync } from '../lib/sync'
import { SESSIONS_KEY as STORAGE_KEY, ACTIVE_KEY, RECENTS_KEY } from './keys'

// Migration idempotente : les sessions terminées AVANT l'activation de la validation
// stricte ont des sets avec `validated: false` (défaut hérité du sprint UX). On les
// remonte à `validated: true` pour préserver les runes déjà gagnées.
// Idempotent : ré-appliquer ne change rien.
export function migrateSessionsStrictV1() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const sessions = raw ? JSON.parse(raw) : []
    let changed = 0
    for (const s of sessions) {
      if (!s.endedAt) continue
      for (const entry of s.entries) {
        for (const set of entry.sets) {
          if (set.validated === false && parseFloat(set.reps) > 0) {
            set.validated = true
            changed++
          }
        }
      }
    }
    if (changed > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
      pushSync() // push le patch au cloud pour ne pas re-migrer à chaque login
      console.log(`[kwest] migrateSessionsStrictV1 : ${changed} sets remontés à validated:true`)
    }
  } catch (err) {
    console.error('[kwest] migrateSessionsStrictV1 failed', err)
  }
}

export function findSession(id) {
  return loadSessions().find((s) => s.id === id) ?? null
}

export function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('[kwest] loadSessions failed', err)
    return []
  }
}

function writeAll(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    pushSync()
    return true
  } catch (err) {
    console.error('[kwest] writeAll failed', err)
    return false
  }
}

export function saveSession(session) {
  const sessions = loadSessions()
  const idx = sessions.findIndex((s) => s.id === session.id)
  if (idx >= 0) {
    sessions[idx] = session
  } else {
    sessions.push(session)
  }
  return writeAll(sessions)
}

export function deleteSession(id) {
  const sessions = loadSessions().filter((s) => s.id !== id)
  return writeAll(sessions)
}

export function updateSessionRpe(id, rpe) {
  const sessions = loadSessions()
  const idx = sessions.findIndex((s) => s.id === id)
  if (idx < 0) return false
  sessions[idx] = { ...sessions[idx], rpe }
  return writeAll(sessions)
}

// crypto.randomUUID() requires a secure context (HTTPS or localhost).
// Fallback when serving via LAN IP in HTTP (e.g. testing on iPhone).
function genId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function createSession() {
  return {
    id: genId(),
    startedAt: new Date().toISOString(),
    endedAt: null,
    entries: [],
  }
}

export function loadActiveSession() {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.error('[kwest] loadActiveSession failed', err)
    return null
  }
}

export function saveActiveSession(session) {
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(session))
    return true
  } catch (err) {
    console.error('[kwest] saveActiveSession failed', err)
    return false
  }
}

export function clearActiveSession() {
  try {
    localStorage.removeItem(ACTIVE_KEY)
    return true
  } catch (err) {
    console.error('[kwest] clearActiveSession failed', err)
    return false
  }
}

export function addEntryToActiveSession(exerciseId) {
  const active = loadActiveSession()
  if (!active) return null
  active.entries.push({ exerciseId, sets: [] })
  saveActiveSession(active)
  return active
}

export function removeEntryFromActiveSession(index) {
  const active = loadActiveSession()
  if (!active) return null
  active.entries.splice(index, 1)
  saveActiveSession(active)
  return active
}

export function addSetToEntry(entryIndex, defaults = {}) {
  const active = loadActiveSession()
  if (!active) return null
  const entry = active.entries[entryIndex]
  if (!entry) return active
  entry.sets.push({ reps: defaults.reps ?? '', weight: defaults.weight ?? '', validated: false })
  saveActiveSession(active)
  return active
}

export function updateSetInEntry(entryIndex, setIndex, patch) {
  const active = loadActiveSession()
  if (!active) return null
  const entry = active.entries[entryIndex]
  if (!entry || !entry.sets[setIndex]) return active
  entry.sets[setIndex] = { ...entry.sets[setIndex], ...patch }
  saveActiveSession(active)
  return active
}

export function removeSetFromEntry(entryIndex, setIndex) {
  const active = loadActiveSession()
  if (!active) return null
  const entry = active.entries[entryIndex]
  if (!entry) return active
  entry.sets.splice(setIndex, 1)
  saveActiveSession(active)
  return active
}

// Retourne le meilleur set de tous les temps pour un exercice (critère : poids max, puis reps)
export function getPersonalRecord(exerciseId, sessions) {
  let best = null
  for (const s of sessions) {
    const entry = s.entries.find((e) => e.exerciseId === exerciseId)
    if (!entry) continue
    for (const set of entry.sets) {
      const w = parseFloat(set.weight) || 0
      const r = parseFloat(set.reps) || 0
      if (!best || w > best.weight || (w === best.weight && r > best.reps)) {
        best = { weight: w, reps: r }
      }
    }
  }
  return best
}

// Retourne le dernier set enregistré pour un exercice donné dans l'historique
export function getLastPerformance(exerciseId, sessions) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
  )
  for (const s of sorted) {
    const entry = s.entries.find((e) => e.exerciseId === exerciseId)
    if (entry?.sets?.length > 0) {
      const last = entry.sets[entry.sets.length - 1]
      return { reps: last.reps, weight: last.weight }
    }
  }
  return null
}

// Exercices récents (max 5) pour le sélecteur
const MAX_RECENTS = 5

export function getRecentExercises() {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function trackRecentExercise(exerciseId) {
  const recents = getRecentExercises().filter((id) => id !== exerciseId)
  recents.unshift(exerciseId)
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)))
  } catch {}
}
