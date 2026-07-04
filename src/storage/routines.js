import { genId } from '../lib/id'

const KEY = 'kwest:routines'

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

export function duplicateRoutine(id) {
  const all = loadRoutines()
  const r = all.find((rt) => rt.id === id)
  if (!r) return null
  const copy = {
    ...r,
    id: genId('r'),
    name: `${r.name} (copie)`,
    createdAt: new Date().toISOString(),
  }
  all.push(copy)
  write(all)
  return copy
}

export function buildRoutine(name, exerciseIds) {
  return {
    id: genId('r'),
    name,
    exerciseIds,
    createdAt: new Date().toISOString(),
  }
}
