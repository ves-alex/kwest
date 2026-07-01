const KEY = 'kwest:routines'

function genId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function loadRoutines() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write(routines) {
  try {
    localStorage.setItem(KEY, JSON.stringify(routines))
    return true
  } catch {
    return false
  }
}

export function saveRoutine(routine) {
  const all = loadRoutines()
  const idx = all.findIndex((r) => r.id === routine.id)
  if (idx >= 0) all[idx] = routine
  else all.push(routine)
  return write(all)
}

export function deleteRoutine(id) {
  return write(loadRoutines().filter((r) => r.id !== id))
}

export function buildRoutine(name, exerciseIds) {
  return {
    id: genId(),
    name,
    exerciseIds,
    createdAt: new Date().toISOString(),
  }
}
