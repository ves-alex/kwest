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
  smith: 'Smith',
  machine: 'Machine',
  poulie: 'Poulie',
  'poids-du-corps': 'Poids du corps',
  cardio: 'Cardio machine',
}

// Type de mesure d'un exercice :
// - 'charge' (défaut) : répétitions + kg (kg à 0 = poids du corps)
// - 'reps'            : répétitions seules, pas de kg
// - 'temps'          : une durée ; unit 'sec' (gainage) ou 'min' (cardio)
export const METRICS = {
  charge: { label: 'Charge' },
  reps: { label: 'Répétitions' },
  temps: { label: 'Durée' },
}

// Chaque exo : id, name, group, equipment. Champ `metric` omis = 'charge'.
// Pour 'temps', `unit` précise 'sec' ou 'min'.
export const EXERCISES = [
  // Poitrine
  { id: 'developpe-couche-barre', name: 'Développé couché (barre)', group: 'poitrine', equipment: 'barre' },
  { id: 'developpe-couche-halteres', name: 'Développé couché (haltères)', group: 'poitrine', equipment: 'halteres' },
  { id: 'developpe-couche-smith', name: 'Développé couché (Smith)', group: 'poitrine', equipment: 'smith' },
  { id: 'developpe-couche-convergent', name: 'Développé couché (convergent)', group: 'poitrine', equipment: 'machine' },
  { id: 'developpe-incline-barre', name: 'Développé incliné (barre)', group: 'poitrine', equipment: 'barre' },
  { id: 'developpe-incline-halteres', name: 'Développé incliné (haltères)', group: 'poitrine', equipment: 'halteres' },
  { id: 'developpe-incline-smith', name: 'Développé incliné (Smith)', group: 'poitrine', equipment: 'smith' },
  { id: 'developpe-incline-convergent', name: 'Développé incliné (convergent)', group: 'poitrine', equipment: 'machine' },
  { id: 'developpe-decline-barre', name: 'Développé décliné (barre)', group: 'poitrine', equipment: 'barre' },
  { id: 'presse-pectoraux', name: 'Presse à pectoraux (chest press)', group: 'poitrine', equipment: 'machine' },
  { id: 'ecarte-couche', name: 'Écarté couché (haltères)', group: 'poitrine', equipment: 'halteres' },
  { id: 'ecarte-incline', name: 'Écarté incliné (haltères)', group: 'poitrine', equipment: 'halteres' },
  { id: 'ecarte-poulie', name: 'Écarté à la poulie (vis-à-vis)', group: 'poitrine', equipment: 'poulie' },
  { id: 'pec-deck', name: 'Pec-deck (butterfly)', group: 'poitrine', equipment: 'machine' },
  { id: 'pull-over-haltere', name: 'Pull-over (haltère)', group: 'poitrine', equipment: 'halteres' },
  { id: 'pompes', name: 'Pompes', group: 'poitrine', equipment: 'poids-du-corps', metric: 'reps' },

  // Dos
  { id: 'tractions', name: 'Tractions (pronation)', group: 'dos', equipment: 'poids-du-corps' },
  { id: 'tractions-supination', name: 'Tractions (supination)', group: 'dos', equipment: 'poids-du-corps' },
  { id: 'tractions-assistees', name: 'Tractions assistées (machine)', group: 'dos', equipment: 'machine' },
  { id: 'tirage-vertical', name: 'Tirage vertical (large)', group: 'dos', equipment: 'poulie' },
  { id: 'tirage-vertical-supination', name: 'Tirage vertical (supination)', group: 'dos', equipment: 'poulie' },
  { id: 'tirage-horizontal', name: 'Tirage horizontal (poulie)', group: 'dos', equipment: 'poulie' },
  { id: 'tirage-horizontal-machine', name: 'Tirage horizontal (machine)', group: 'dos', equipment: 'machine' },
  { id: 'rowing-barre', name: 'Rowing barre', group: 'dos', equipment: 'barre' },
  { id: 'rowing-halteres', name: 'Rowing haltère (unilatéral)', group: 'dos', equipment: 'halteres' },
  { id: 'rowing-t-bar', name: 'Rowing T-bar', group: 'dos', equipment: 'machine' },
  { id: 'rowing-machine', name: 'Rowing machine', group: 'dos', equipment: 'machine' },
  { id: 'souleve-de-terre', name: 'Soulevé de terre', group: 'dos', equipment: 'barre' },
  { id: 'souleve-de-terre-trap-bar', name: 'Soulevé de terre (trap bar)', group: 'dos', equipment: 'barre' },
  { id: 'pull-over-poulie', name: 'Pull-over à la poulie', group: 'dos', equipment: 'poulie' },
  { id: 'haussements-barre', name: "Haussements d'épaules (barre)", group: 'dos', equipment: 'barre' },
  { id: 'haussements-halteres', name: "Haussements d'épaules (haltères)", group: 'dos', equipment: 'halteres' },

  // Épaules
  { id: 'developpe-militaire', name: 'Développé militaire (barre)', group: 'epaules', equipment: 'barre' },
  { id: 'developpe-militaire-smith', name: 'Développé militaire (Smith)', group: 'epaules', equipment: 'smith' },
  { id: 'developpe-epaules-halteres', name: 'Développé épaules (haltères)', group: 'epaules', equipment: 'halteres' },
  { id: 'developpe-epaules-machine', name: 'Développé épaules (machine)', group: 'epaules', equipment: 'machine' },
  { id: 'developpe-arnold', name: 'Développé Arnold', group: 'epaules', equipment: 'halteres' },
  { id: 'elevations-laterales', name: 'Élévations latérales (haltères)', group: 'epaules', equipment: 'halteres' },
  { id: 'elevations-laterales-poulie', name: 'Élévations latérales (poulie)', group: 'epaules', equipment: 'poulie' },
  { id: 'elevations-laterales-machine', name: 'Élévations latérales (machine)', group: 'epaules', equipment: 'machine' },
  { id: 'elevations-frontales', name: 'Élévations frontales (haltères)', group: 'epaules', equipment: 'halteres' },
  { id: 'oiseau', name: 'Oiseau (haltères)', group: 'epaules', equipment: 'halteres' },
  { id: 'oiseau-poulie', name: 'Oiseau (poulie)', group: 'epaules', equipment: 'poulie' },
  { id: 'pec-deck-inverse', name: 'Pec-deck inversé (machine)', group: 'epaules', equipment: 'machine' },
  { id: 'face-pull', name: 'Face pull', group: 'epaules', equipment: 'poulie' },
  { id: 'rowing-menton', name: 'Rowing menton (upright row)', group: 'epaules', equipment: 'barre' },

  // Biceps
  { id: 'curl-barre', name: 'Curl barre', group: 'biceps', equipment: 'barre' },
  { id: 'curl-barre-ez', name: 'Curl barre EZ', group: 'biceps', equipment: 'barre' },
  { id: 'curl-halteres', name: 'Curl haltères', group: 'biceps', equipment: 'halteres' },
  { id: 'curl-marteau', name: 'Curl marteau', group: 'biceps', equipment: 'halteres' },
  { id: 'curl-incline', name: 'Curl incliné (haltères)', group: 'biceps', equipment: 'halteres' },
  { id: 'curl-pupitre', name: 'Curl pupitre (Larry Scott)', group: 'biceps', equipment: 'machine' },
  { id: 'curl-poulie', name: 'Curl à la poulie', group: 'biceps', equipment: 'poulie' },
  { id: 'curl-concentration', name: 'Curl concentration', group: 'biceps', equipment: 'halteres' },

  // Triceps
  { id: 'dips', name: 'Dips (triceps)', group: 'triceps', equipment: 'poids-du-corps' },
  { id: 'dips-machine', name: 'Dips machine', group: 'triceps', equipment: 'machine' },
  { id: 'extensions-poulie', name: 'Extensions à la poulie (corde)', group: 'triceps', equipment: 'poulie' },
  { id: 'extensions-poulie-barre', name: 'Extensions à la poulie (barre)', group: 'triceps', equipment: 'poulie' },
  { id: 'barre-au-front', name: 'Barre au front (skull crusher)', group: 'triceps', equipment: 'barre' },
  { id: 'extensions-verticales-haltere', name: 'Extension verticale (haltère)', group: 'triceps', equipment: 'halteres' },
  { id: 'extension-nuque-poulie', name: 'Extension nuque à la poulie', group: 'triceps', equipment: 'poulie' },
  { id: 'kickback', name: 'Kickback (haltère)', group: 'triceps', equipment: 'halteres' },
  { id: 'developpe-serre', name: 'Développé couché serré', group: 'triceps', equipment: 'barre' },

  // Quadriceps
  { id: 'squat-barre', name: 'Squat (barre)', group: 'quadriceps', equipment: 'barre' },
  { id: 'squat-smith', name: 'Squat (Smith)', group: 'quadriceps', equipment: 'smith' },
  { id: 'front-squat', name: 'Squat avant (front squat)', group: 'quadriceps', equipment: 'barre' },
  { id: 'squat-gobelet', name: 'Squat gobelet (goblet)', group: 'quadriceps', equipment: 'halteres' },
  { id: 'squat-bulgare', name: 'Squat bulgare', group: 'quadriceps', equipment: 'halteres' },
  { id: 'presse-cuisses', name: 'Presse à cuisses', group: 'quadriceps', equipment: 'machine' },
  { id: 'hack-squat', name: 'Hack squat (machine)', group: 'quadriceps', equipment: 'machine' },
  { id: 'leg-extension', name: 'Leg extension', group: 'quadriceps', equipment: 'machine' },
  { id: 'fentes-halteres', name: 'Fentes (haltères)', group: 'quadriceps', equipment: 'halteres' },
  { id: 'fentes-marchees', name: 'Fentes marchées', group: 'quadriceps', equipment: 'halteres' },

  // Ischios / fessiers
  { id: 'souleve-de-terre-roumain', name: 'Soulevé de terre roumain', group: 'ischios-fessiers', equipment: 'barre' },
  { id: 'souleve-de-terre-jambes-tendues', name: 'Soulevé de terre jambes tendues', group: 'ischios-fessiers', equipment: 'barre' },
  { id: 'leg-curl', name: 'Leg curl allongé', group: 'ischios-fessiers', equipment: 'machine' },
  { id: 'leg-curl-assis', name: 'Leg curl assis', group: 'ischios-fessiers', equipment: 'machine' },
  { id: 'hip-thrust', name: 'Hip thrust', group: 'ischios-fessiers', equipment: 'barre' },
  { id: 'pont-fessier', name: 'Pont fessier (glute bridge)', group: 'ischios-fessiers', equipment: 'barre' },
  { id: 'good-morning', name: 'Good morning', group: 'ischios-fessiers', equipment: 'barre' },
  { id: 'abduction-hanche', name: 'Abduction hanche (machine)', group: 'ischios-fessiers', equipment: 'machine' },
  { id: 'kickback-fessier', name: 'Kickback fessier (poulie)', group: 'ischios-fessiers', equipment: 'poulie' },

  // Mollets
  { id: 'extensions-mollets-debout', name: 'Extensions mollets debout', group: 'mollets', equipment: 'machine' },
  { id: 'extensions-mollets-assis', name: 'Extensions mollets assis', group: 'mollets', equipment: 'machine' },
  { id: 'mollets-presse', name: 'Mollets à la presse', group: 'mollets', equipment: 'machine' },

  // Abdos / Core
  { id: 'crunch', name: 'Crunch (sol)', group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'crunch-poulie', name: 'Crunch à la poulie', group: 'core', equipment: 'poulie' },
  { id: 'crunch-machine', name: 'Crunch machine', group: 'core', equipment: 'machine' },
  { id: 'releve-jambes-suspendu', name: 'Relevé de jambes suspendu', group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'leg-raises', name: 'Relevé de jambes (sol)', group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'russian-twist', name: 'Russian twist', group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'roue-abdominale', name: 'Roue abdominale (ab wheel)', group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'mountain-climbers', name: 'Mountain climbers', group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'releve-bassin', name: 'Relevé de bassin (reverse crunch)', group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'planche', name: 'Planche (gainage)', group: 'core', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },
  { id: 'planche-laterale', name: 'Planche latérale', group: 'core', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },
  { id: 'hollow-hold', name: 'Hollow hold', group: 'core', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },
  { id: 'chaise', name: 'Chaise (wall sit)', group: 'core', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },

  // Cardio
  { id: 'tapis-de-course', name: 'Tapis de course', group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'tapis-de-marche', name: 'Tapis de marche', group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'velo-stationnaire', name: 'Vélo stationnaire', group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'velo-elliptique', name: 'Vélo elliptique', group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'rameur', name: 'Rameur', group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'stepper', name: 'Stepper / escaliers', group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'assault-bike', name: 'Assault bike', group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'corde-a-sauter', name: 'Corde à sauter', group: 'cardio', equipment: 'poids-du-corps', metric: 'temps', unit: 'min' },
  { id: 'burpees', name: 'Burpees', group: 'cardio', equipment: 'poids-du-corps', metric: 'reps' },

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

// Type de mesure d'un exercice (défaut 'charge'), et l'unité pour 'temps'.
export function getMetric(id) {
  return findExerciseById(id)?.metric ?? 'charge'
}
export function getMetricUnit(id) {
  return findExerciseById(id)?.unit ?? null
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
  'squat-smith': 1.4,
  'front-squat': 1.4,
  'souleve-de-terre': 1.4,
  'souleve-de-terre-trap-bar': 1.4,
  'souleve-de-terre-roumain': 1.4,
  'souleve-de-terre-jambes-tendues': 1.4,
  'developpe-militaire': 1.4,
  'developpe-militaire-smith': 1.4,
  'good-morning': 1.4,
  // Cardio intense → 1.2
  'burpees': 1.2,
  // Composés (haltères / machine, polyarticulaires) → 1.2
  'developpe-couche-halteres': 1.2,
  'developpe-couche-smith': 1.2,
  'developpe-couche-convergent': 1.2,
  'presse-pectoraux': 1.2,
  'developpe-incline-barre': 1.2,
  'developpe-incline-halteres': 1.2,
  'developpe-incline-smith': 1.2,
  'developpe-incline-convergent': 1.2,
  'developpe-decline-barre': 1.2,
  'developpe-serre': 1.2,
  'rowing-barre': 1.2,
  'rowing-halteres': 1.2,
  'rowing-t-bar': 1.2,
  'rowing-machine': 1.2,
  'developpe-epaules-halteres': 1.2,
  'developpe-epaules-machine': 1.2,
  'developpe-arnold': 1.2,
  'fentes-halteres': 1.2,
  'fentes-marchees': 1.2,
  'squat-gobelet': 1.2,
  'squat-bulgare': 1.2,
  'hack-squat': 1.2,
  'presse-cuisses': 1.2,
  'hip-thrust': 1.2,
  'pont-fessier': 1.2,
  'tractions': 1.2,
  'tractions-supination': 1.2,
  'dips': 1.2,
}

// Pour les exos au poids du corps (metric 'reps') : runes par répétition.
// Pour les exos 'temps' : runes par seconde (unit 'sec') ou par minute (unit 'min').
// Sert aussi de fallback pour un exo 'charge' fait sans lest (poids = 0).
const BODYWEIGHT_FACTORS = {
  // Poids du corps — runes / rep
  'pompes': 1.5,
  'tractions': 4,
  'tractions-supination': 4,
  'dips': 3,
  'crunch': 0.5,
  'releve-jambes-suspendu': 2,
  'leg-raises': 1.5,
  'russian-twist': 0.8,
  'roue-abdominale': 2,
  'releve-bassin': 1,
  'mountain-climbers': 1.2,
  'burpees': 3,
  // Gainage — runes / seconde
  'planche': 1,
  'planche-laterale': 1,
  'hollow-hold': 1.2,
  'chaise': 1,
  // Cardio — runes / minute
  'rameur': 5,
  'velo-stationnaire': 4,
  'velo-elliptique': 4,
  'tapis-de-course': 6,
  'tapis-de-marche': 3,
  'stepper': 5,
  'assault-bike': 6,
  'corde-a-sauter': 4, // runes / minute
  // Divers
  'autre': 1,
}

export function getDifficulty(id) {
  return DIFFICULTY_OVERRIDES[id] ?? 1.0
}

export function getBodyweightFactor(id) {
  return BODYWEIGHT_FACTORS[id] ?? 1
}
