// Semaine = lundi 00:00 → dimanche 23:59 (heure locale).
// Un séance "compte" si elle a été démarrée dans la semaine.

const WEEK_MS = 7 * 86400000

function getMondayTs(date) {
  const d = new Date(date)
  const day = d.getDay() // 0 = dim, 1 = lun, ...
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// Retourne :
//   weekSessions    — nb de séances démarrées cette semaine
//   streak          — nb de semaines actives consécutives (grâce d'une semaine sans casser)
//   recordStreak    — meilleure chaîne all-time
export function computeWeeklyStats(sessions) {
  const trainedWeeks = new Set()
  for (const s of sessions) {
    if (!s.startedAt) continue
    trainedWeeks.add(getMondayTs(new Date(s.startedAt)))
  }

  const now = new Date()
  const currentMonday = getMondayTs(now)
  const nextMonday = currentMonday + WEEK_MS

  const weekSessions = sessions.filter((s) => {
    const t = new Date(s.startedAt).getTime()
    return t >= currentMonday && t < nextMonday
  }).length

  // Streak courant : on prend la semaine en cours si active, sinon on tente la semaine
  // passée (grâce accordée jusqu'à dimanche 23:59). Deux semaines vides = casse.
  let cursor = currentMonday
  if (!trainedWeeks.has(cursor)) cursor -= WEEK_MS
  let streak = 0
  while (trainedWeeks.has(cursor)) {
    streak++
    cursor -= WEEK_MS
  }

  // Record all-time : parcourt toutes les semaines actives triées et compte la plus longue chaîne
  const weeks = Array.from(trainedWeeks).sort((a, b) => a - b)
  let recordStreak = 0
  let run = 0
  let prev = null
  for (const w of weeks) {
    if (prev !== null && w - prev === WEEK_MS) run++
    else run = 1
    if (run > recordStreak) recordStreak = run
    prev = w
  }

  return { weekSessions, streak, recordStreak }
}
