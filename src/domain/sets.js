// Règle unique « une série compte-t-elle ? », partagée par l'économie, le coach
// et les records personnels.
//
// Un set compte s'il est explicitement validé (true) OU s'il vient d'une ancienne
// session sans le champ (undefined). Seul `validated: false` (nouveau + jamais
// validé par le bouton ✓) est exclu.
export function isCounted(set) {
  return set.validated !== false
}

// Une série vide (ni reps, ni poids) n'est jamais une performance, même validée.
export function hasValue(set) {
  return (parseFloat(set.reps) || 0) > 0 || (parseFloat(set.weight) || 0) > 0
}

// Sets d'un exercice dans une séance, dans l'ordre chronologique, filtrés sur
// « ce qui compte vraiment » (validé + non vide).
// Un même exercice peut apparaître dans PLUSIEURS entries d'une séance
// (échauffement loggé à part, exo repris en fin de séance) : on les concatène
// toutes au lieu de ne garder que la première.
export function setsForExercise(session, exerciseId) {
  const out = []
  for (const entry of session.entries ?? []) {
    if (entry.exerciseId !== exerciseId) continue
    for (const set of entry.sets ?? []) {
      if (isCounted(set) && hasValue(set)) out.push(set)
    }
  }
  return out
}
