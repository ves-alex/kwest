import { genId } from '../lib/id'
import { pushRoutines, deleteRoutineCloud } from '../lib/sync'
import { ROUTINES_KEY as KEY } from './keys'

// localStorage d'abord, puis la routine modifiée part au cloud (une ligne par
// routine, comme les séances) : elles survivent au changement de téléphone.

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
  const ok = write(all)
  if (ok) pushRoutines([routine])
  return ok
}

export function deleteRoutine(id) {
  const ok = write(loadRoutines().filter((r) => r.id !== id))
  if (ok) deleteRoutineCloud(id)
  return ok
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
  if (write(all)) pushRoutines([copy])
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
