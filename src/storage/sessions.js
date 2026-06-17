const STORAGE_KEY = 'kwest:sessions'
const ACTIVE_KEY = 'kwest:active-session'

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

export function clearAll() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (err) {
    console.error('[kwest] clearAll failed', err)
    return false
  }
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
    note: '',
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

export function addSetToEntry(entryIndex) {
  const active = loadActiveSession()
  if (!active) return null
  const entry = active.entries[entryIndex]
  if (!entry) return active
  entry.sets.push({ reps: '', weight: '' })
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
