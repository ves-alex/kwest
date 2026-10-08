// Dates en heure LOCALE. Deux pièges évités ici :
// - toISOString() donne la date UTC : en France, minuit local tombe la veille ;
// - une semaine ne dure pas toujours 7 × 24 h : celle du changement d'heure en
//   fait 167 ou 169. On compte donc en jours et semaines de calendrier.

const DAY_MS = 86400000

function pad(n) {
  return String(n).padStart(2, '0')
}

// 'AAAA-MM-JJ' du jour local
export function dayKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Numéro de semaine (lundi → dimanche, heure locale) : deux semaines qui se
// suivent ont des numéros qui se suivent, changement d'heure ou pas.
export function weekIndex(date) {
  const d = new Date(date)
  // Jours de calendrier depuis le 1er janvier 1970 (un jeudi : +3 cale sur le lundi)
  const day = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS
  return Math.floor((day + 3) / 7)
}
