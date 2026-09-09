import { setsForExercise } from './sets'

// --- 1RM estimé (formule d'Epley) ---
//
// Le poids max soulevé cache la vraie progression : passer de 80 kg × 5 à
// 80 kg × 8, c'est plus fort, mais la courbe « poids max » reste plate.
// Le 1RM estimé — la charge théorique qu'on lèverait UNE fois — capte ça :
//   1RM = poids × (1 + reps / 30)
//
// Au-delà de 12 répétitions l'estimation dérive fortement (endurance, pas
// force max) : ces séries sont ignorées plutôt que de gonfler un faux record.
const MAX_REPS_FOR_ESTIMATE = 12

export function estimate1RM(weight, reps) {
  const w = parseFloat(weight) || 0
  const r = parseFloat(reps) || 0
  if (w <= 0 || r <= 0 || r > MAX_REPS_FOR_ESTIMATE) return 0
  return Math.round(w * (1 + r / 30))
}

// Meilleur 1RM estimé parmi une liste de séries (0 si aucune n'est exploitable).
export function bestOneRepMax(sets) {
  let best = 0
  for (const set of sets) {
    const est = estimate1RM(set.weight, set.reps)
    if (est > best) best = est
  }
  return best
}

// Meilleur 1RM estimé d'un exercice sur une séance donnée.
export function sessionOneRepMax(session, exerciseId) {
  return bestOneRepMax(setsForExercise(session, exerciseId))
}
