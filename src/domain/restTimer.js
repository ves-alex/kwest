// Minuteur de repos en données pures : { duration, endsAt, pausedRemaining }.
// - en marche : endsAt = instant de fin (ms). Le temps restant se recalcule sur
//   l'horloge : il reste juste même si iOS a gelé la page (écran verrouillé) ou
//   si l'écran Séance a été quitté entre-temps.
// - à l'arrêt : endsAt = null, pausedRemaining = secondes restantes.

export const MIN_REST_SECONDS = 5

export function createRestTimer(duration, { start = false, now = Date.now() } = {}) {
  return { duration, endsAt: start ? now + duration * 1000 : null, pausedRemaining: duration }
}

export function remainingSeconds(timer, now) {
  if (timer.endsAt === null) return timer.pausedRemaining
  return Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
}

export function startRestTimer(timer, now) {
  return { ...timer, endsAt: now + timer.pausedRemaining * 1000 }
}

export function pauseRestTimer(timer, now) {
  return { ...timer, endsAt: null, pausedRemaining: remainingSeconds(timer, now) }
}

export function finishRestTimer(timer) {
  return { ...timer, endsAt: null, pausedRemaining: 0 }
}

// ±delta secondes sur la durée et sur le temps restant, jamais sous 5 s
export function adjustRestTimer(timer, delta, now) {
  const duration = Math.max(MIN_REST_SECONDS, timer.duration + delta)
  const remaining = Math.max(MIN_REST_SECONDS, remainingSeconds(timer, now) + delta)
  return timer.endsAt === null
    ? { ...timer, duration, pausedRemaining: remaining }
    : { ...timer, duration, endsAt: now + remaining * 1000 }
}
