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
}

export const EQUIPMENT = {
  barre: 'Barre',
  halteres: 'Haltères',
  machine: 'Machine',
  poulie: 'Poulie',
  'poids-du-corps': 'Poids du corps',
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
