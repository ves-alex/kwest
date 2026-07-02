// Groupes musculaires — ordre = ordre d'affichage dans la liste
export const GROUPS = {
  poitrine: { label: 'Poitrine', order: 1 },
  dos: { label: 'Dos', order: 2 },
  epaules: { label: 'Épaules', order: 3 },
  biceps: { label: 'Biceps', order: 4 },
  triceps: { label: 'Triceps', order: 5 },
  quadriceps: { label: 'Quadriceps', order: 6 },
  'ischios-fessiers': { label: 'Ischios / fessiers', order: 7 },
  mollets: { label: 'Mollets', order: 8 },
  core: { label: 'Abdos / Core', order: 9 },
  cardio: { label: 'Cardio', order: 10 },
  divers: { label: 'Divers', order: 11 },
}

export const EQUIPMENT = {
  barre: 'Barre',
  halteres: 'Haltères',
  machine: 'Machine',
  poulie: 'Poulie',
  'poids-du-corps': 'Poids du corps',
  cardio: 'Cardio machine',
}

export const EXERCISES = [
  // Poitrine
  { id: 'developpe-couche-barre', name: 'Développé couché (barre)', group: 'poitrine', equipment: 'barre' },
  { id: 'developpe-couche-halteres', name: 'Développé couché (haltères)', group: 'poitrine', equipment: 'halteres' },
  { id: 'developpe-incline-halteres', name: 'Développé incliné (haltères)', group: 'poitrine', equipment: 'halteres' },
  { id: 'ecarte-couche', name: 'Écarté couché (haltères)', group: 'poitrine', equipment: 'halteres' },
  { id: 'pompes', name: 'Pompes', group: 'poitrine', equipment: 'poids-du-corps' },

  // Dos
  { id: 'tractions', name: 'Tractions', group: 'dos', equipment: 'poids-du-corps' },
  { id: 'rowing-barre', name: 'Rowing barre', group: 'dos', equipment: 'barre' },
  { id: 'rowing-halteres', name: 'Rowing haltères', group: 'dos', equipment: 'halteres' },
  { id: 'tirage-horizontal', name: 'Tirage horizontal (poulie)', group: 'dos', equipment: 'poulie' },
  { id: 'tirage-vertical', name: 'Tirage vertical (poulie)', group: 'dos', equipment: 'poulie' },
  { id: 'souleve-de-terre', name: 'Soulevé de terre', group: 'dos', equipment: 'barre' },

  // Épaules
  { id: 'developpe-militaire', name: 'Développé militaire (barre)', group: 'epaules', equipment: 'barre' },
  { id: 'developpe-epaules-halteres', name: 'Développé épaules (haltères)', group: 'epaules', equipment: 'halteres' },
  { id: 'elevations-laterales', name: 'Élévations latérales', group: 'epaules', equipment: 'halteres' },
  { id: 'elevations-frontales', name: 'Élévations frontales', group: 'epaules', equipment: 'halteres' },
  { id: 'oiseau', name: 'Oiseau / Face pull', group: 'epaules', equipment: 'poulie' },

  // Biceps
  { id: 'curl-barre', name: 'Curl barre', group: 'biceps', equipment: 'barre' },
  { id: 'curl-halteres', name: 'Curl haltères', group: 'biceps', equipment: 'halteres' },
  { id: 'curl-marteau', name: 'Curl marteau', group: 'biceps', equipment: 'halteres' },

  // Triceps
  { id: 'dips', name: 'Dips', group: 'triceps', equipment: 'poids-du-corps' },
  { id: 'extensions-poulie', name: 'Extensions à la poulie', group: 'triceps', equipment: 'poulie' },
  { id: 'extensions-verticales-haltere', name: 'Extensions verticales (haltère)', group: 'triceps', equipment: 'halteres' },

  // Quadriceps
  { id: 'squat-barre', name: 'Squat (barre)', group: 'quadriceps', equipment: 'barre' },
  { id: 'presse-cuisses', name: 'Presse à cuisses', group: 'quadriceps', equipment: 'machine' },
  { id: 'fentes-halteres', name: 'Fentes (haltères)', group: 'quadriceps', equipment: 'halteres' },
  { id: 'leg-extension', name: 'Leg extension', group: 'quadriceps', equipment: 'machine' },

  // Ischios / fessiers
  { id: 'souleve-de-terre-roumain', name: 'Soulevé de terre roumain', group: 'ischios-fessiers', equipment: 'barre' },
  { id: 'leg-curl', name: 'Leg curl', group: 'ischios-fessiers', equipment: 'machine' },
  { id: 'hip-thrust', name: 'Hip thrust', group: 'ischios-fessiers', equipment: 'barre' },

  // Mollets
  { id: 'extensions-mollets-debout', name: 'Extensions mollets debout', group: 'mollets', equipment: 'machine' },
  { id: 'extensions-mollets-assis', name: 'Extensions mollets assis', group: 'mollets', equipment: 'machine' },

  // Abdos / Core
  { id: 'crunch', name: 'Crunch', group: 'core', equipment: 'poids-du-corps' },
  { id: 'planche', name: 'Planche', group: 'core', equipment: 'poids-du-corps' },
  { id: 'leg-raises', name: 'Leg raises', group: 'core', equipment: 'poids-du-corps' },
  { id: 'russian-twist', name: 'Russian twist', group: 'core', equipment: 'poids-du-corps' },
  { id: 'chaise', name: 'Chaise (wall sit)', group: 'core', equipment: 'poids-du-corps' },
  { id: 'mountain-climbers', name: 'Mountain climbers', group: 'core', equipment: 'poids-du-corps' },

  // Cardio — reps = durée (minutes ou secondes selon l'exo), weight = résistance/allure
  { id: 'rameur', name: 'Rameur', group: 'cardio', equipment: 'cardio' },
  { id: 'velo-stationnaire', name: 'Vélo stationnaire', group: 'cardio', equipment: 'cardio' },
  { id: 'velo-elliptique', name: 'Vélo elliptique', group: 'cardio', equipment: 'cardio' },
  { id: 'tapis-de-course', name: 'Tapis de course', group: 'cardio', equipment: 'cardio' },
  { id: 'tapis-de-marche', name: 'Tapis de marche', group: 'cardio', equipment: 'cardio' },
  { id: 'corde-a-sauter', name: 'Corde à sauter', group: 'cardio', equipment: 'poids-du-corps' },
  { id: 'burpees', name: 'Burpees', group: 'cardio', equipment: 'poids-du-corps' },

  // Divers
  { id: 'autre', name: 'Autre / Libre', group: 'divers', equipment: 'poids-du-corps' },
]

// Helpers
export function exercisesByGroup() {
  const groups = Object.entries(GROUPS)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, meta]) => ({
      key,
      label: meta.label,
      exercises: EXERCISES.filter((e) => e.group === key),
    }))
  return groups
}

export function findExerciseById(id) {
  return EXERCISES.find((e) => e.id === id)
}

// Convention : les images sont dans public/exercises/<id>/<index>.jpg
// 0.jpg = position de départ (souvent peu représentative)
// 1.jpg = position d'effort / fin de mouvement (plus parlant, défaut)
export function exerciseImage(id, index = 1) {
  return `/exercises/${id}/${index}.jpg`
}

// --- Économie : difficulté par exo (Phase 3) ---
// Facteur multiplicatif sur la formule poids × reps. Défaut = 1.0
const DIFFICULTY_OVERRIDES = {
  // Composés lourds (barre, polyarticulaires) → 1.4
  'developpe-couche-barre': 1.4,
  'squat-barre': 1.4,
  'souleve-de-terre': 1.4,
  'souleve-de-terre-roumain': 1.4,
  'developpe-militaire': 1.4,
  // Cardio intense → 1.2
  'burpees': 1.2,
  // Composés (haltères, polyarticulaires) → 1.2
  'developpe-couche-halteres': 1.2,
  'developpe-incline-halteres': 1.2,
  'rowing-barre': 1.2,
  'rowing-halteres': 1.2,
  'developpe-epaules-halteres': 1.2,
  'fentes-halteres': 1.2,
  'hip-thrust': 1.2,
  'tractions': 1.2,
  'dips': 1.2,
}

// Pour les exos au poids du corps : multiplicateur par rep (quand poids = 0)
// Cardio machines : reps = minutes, facteur = runes par minute
const BODYWEIGHT_FACTORS = {
  'pompes': 1.5,
  'tractions': 4,
  'dips': 3,
  'crunch': 0.5,
  'planche': 1,           // 1 rune/seconde tenue
  'leg-raises': 1.5,
  'russian-twist': 0.8,
  'extensions-mollets-debout': 0.5,
  'extensions-mollets-assis': 0.5,
  // Core (timer)
  'chaise': 1,            // 1 rune/seconde
  'mountain-climbers': 1.2,
  // Cardio (runes/minute)
  'rameur': 5,
  'velo-stationnaire': 4,
  'velo-elliptique': 4,
  'tapis-de-course': 6,
  'tapis-de-marche': 3,
  'corde-a-sauter': 0.4,  // runes/saut
  'burpees': 3,
  'autre': 1,
}

export function getDifficulty(id) {
  return DIFFICULTY_OVERRIDES[id] ?? 1.0
}

export function getBodyweightFactor(id) {
  return BODYWEIGHT_FACTORS[id] ?? 1
}
