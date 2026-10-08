import { weekIndex } from './dates'

// Semaine = lundi 00:00 → dimanche 23:59 (heure locale).
// Un séance "compte" si elle a été démarrée dans la semaine.
// Les semaines sont des numéros de calendrier (weekIndex), pas des tranches de
// 7 × 24 h : la semaine du changement d'heure dure 167 ou 169 h.

// Retourne :
//   weekSessions    — nb de séances démarrées cette semaine
//   streak          — nb de semaines actives consécutives (grâce d'une semaine sans casser)
//   recordStreak    — meilleure chaîne all-time
export function computeWeeklyStats(sessions) {
  const trainedWeeks = new Set()
  for (const s of sessions) {
    if (!s.startedAt) continue
    trainedWeeks.add(weekIndex(s.startedAt))
  }

  const currentWeek = weekIndex(new Date())

  const weekSessions = sessions.filter(
    (s) => s.startedAt && weekIndex(s.startedAt) === currentWeek,
  ).length

  // Streak courant : on prend la semaine en cours si active, sinon on tente la semaine
  // passée (grâce accordée jusqu'à dimanche 23:59). Deux semaines vides = casse.
  let cursor = currentWeek
  if (!trainedWeeks.has(cursor)) cursor -= 1
  let streak = 0
  while (trainedWeeks.has(cursor)) {
    streak++
    cursor -= 1
  }

  // Record all-time : parcourt toutes les semaines actives triées et compte la plus longue chaîne
  const weeks = Array.from(trainedWeeks).sort((a, b) => a - b)
  let recordStreak = 0
  let run = 0
  let prev = null
  for (const w of weeks) {
    if (prev !== null && w - prev === 1) run++
    else run = 1
    if (run > recordStreak) recordStreak = run
    prev = w
  }

  return { weekSessions, streak, recordStreak }
}
