// Groupes musculaires — ordre = ordre d'affichage dans la liste
export const GROUPS = {
  poitrine: { label: 'Poitrine', order: 1 },
  dos: { label: 'Dos', order: 2 },
  trapezes: { label: 'Trapèzes', order: 3 },
  epaules: { label: 'Épaules', order: 4 },
  biceps: { label: 'Biceps', order: 5 },
  triceps: { label: 'Triceps', order: 6 },
  'avant-bras': { label: 'Avant-bras', order: 7 },
  quadriceps: { label: 'Quadriceps', order: 8 },
  'ischios-fessiers': { label: 'Ischios', order: 9 },
  fessiers: { label: 'Fessiers', order: 10 },
  mollets: { label: 'Mollets', order: 11 },
  core: { label: 'Abdos / Core', order: 12 },
  cardio: { label: 'Cardio', order: 13 },
  fonctionnel: { label: 'Fonctionnel', order: 14 },
  divers: { label: 'Divers', order: 15 },
}

export const EQUIPMENT = {
  barre: 'Barre',
  halteres: 'Haltères',
  smith: 'Smith',
  machine: 'Machine',
  poulie: 'Poulie',
  'poids-du-corps': 'Poids du corps',
  cardio: 'Cardio machine',
  kettlebell: 'Kettlebell',
  traineau: 'Traîneau',
  corde: 'Corde ondulatoire',
  'medecine-ball': 'Médecine ball',
  sangles: 'Sangles TRX',
  'divers-materiel': 'Autre matériel',
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
  { id: 'developpe-couche-barre', name: "Développé couché (barre)", group: 'poitrine', equipment: 'barre' },
  { id: 'developpe-couche-halteres', name: "Développé couché (haltères)", group: 'poitrine', equipment: 'halteres' },
  { id: 'developpe-couche-smith', name: "Développé couché (Smith)", group: 'poitrine', equipment: 'smith' },
  { id: 'developpe-couche-convergent', name: "Développé couché (convergent)", group: 'poitrine', equipment: 'machine' },
  { id: 'developpe-incline-barre', name: "Développé incliné (barre)", group: 'poitrine', equipment: 'barre' },
  { id: 'developpe-incline-halteres', name: "Développé incliné (haltères)", group: 'poitrine', equipment: 'halteres' },
  { id: 'developpe-incline-smith', name: "Développé incliné (Smith)", group: 'poitrine', equipment: 'smith' },
  { id: 'developpe-incline-convergent', name: "Développé incliné (convergent)", group: 'poitrine', equipment: 'machine' },
  { id: 'developpe-decline-barre', name: "Développé décliné (barre)", group: 'poitrine', equipment: 'barre' },
  { id: 'presse-pectoraux', name: "Presse à pectoraux (chest press)", group: 'poitrine', equipment: 'machine' },
  { id: 'ecarte-couche', name: "Écarté couché (haltères)", group: 'poitrine', equipment: 'halteres' },
  { id: 'ecarte-incline', name: "Écarté incliné (haltères)", group: 'poitrine', equipment: 'halteres' },
  { id: 'ecarte-poulie', name: "Écarté à la poulie (vis-à-vis)", group: 'poitrine', equipment: 'poulie' },
  { id: 'pec-deck', name: "Pec-deck (butterfly)", group: 'poitrine', equipment: 'machine' },
  { id: 'pull-over-haltere', name: "Pull-over (haltère)", group: 'poitrine', equipment: 'halteres' },
  { id: 'pompes', name: "Pompes", group: 'poitrine', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'developpe-couche-unilateral-haltere', name: "Développé couché unilatéral (haltère)", group: 'poitrine', equipment: 'halteres' },
  { id: 'developpe-couche-prise-large-barre', name: "Développé couché prise large (barre)", group: 'poitrine', equipment: 'barre' },
  { id: 'developpe-decline-halteres', name: "Développé décliné (haltères)", group: 'poitrine', equipment: 'halteres' },
  { id: 'developpe-decline-smith', name: "Développé décliné (Smith)", group: 'poitrine', equipment: 'smith' },
  { id: 'developpe-decline-convergent', name: "Développé décliné (convergent)", group: 'poitrine', equipment: 'machine' },
  { id: 'ecarte-decline-halteres', name: "Écarté décliné (haltères)", group: 'poitrine', equipment: 'halteres' },
  { id: 'ecarte-au-sol-halteres', name: "Écarté au sol (haltères)", group: 'poitrine', equipment: 'halteres' },
  { id: 'ecarte-poulie-basse-bas-vers-haut', name: "Écarté poulie basse (bas vers haut)", group: 'poitrine', equipment: 'poulie' },
  { id: 'crossover-poulie-haute', name: "Crossover poulie haute", group: 'poitrine', equipment: 'poulie' },
  { id: 'crossover-poulie-basse', name: "Crossover poulie basse", group: 'poitrine', equipment: 'poulie' },
  { id: 'presse-a-pectoraux-unilaterale', name: "Presse à pectoraux unilatérale", group: 'poitrine', equipment: 'machine' },
  { id: 'svend-press-disque', name: "Svend press (disque)", group: 'poitrine', equipment: 'halteres' },
  { id: 'landmine-press-poitrine', name: "Landmine press (poitrine)", group: 'poitrine', equipment: 'barre' },
  { id: 'pompes-lestees', name: "Pompes lestées", group: 'poitrine', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'pompes-declinees', name: "Pompes déclinées", group: 'poitrine', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'pompes-inclinees', name: "Pompes inclinées", group: 'poitrine', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'pompes-diamant', name: "Pompes diamant", group: 'poitrine', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'pompes-archer', name: "Pompes archer", group: 'poitrine', equipment: 'poids-du-corps', metric: 'reps' },

  // Dos
  { id: 'tractions', name: "Tractions (pronation)", group: 'dos', equipment: 'poids-du-corps' },
  { id: 'tractions-supination', name: "Tractions (supination)", group: 'dos', equipment: 'poids-du-corps' },
  { id: 'tractions-assistees', name: "Tractions assistées (machine)", group: 'dos', equipment: 'machine' },
  { id: 'tirage-vertical', name: "Tirage vertical (large)", group: 'dos', equipment: 'poulie' },
  { id: 'tirage-vertical-supination', name: "Tirage vertical (supination)", group: 'dos', equipment: 'poulie' },
  { id: 'tirage-horizontal', name: "Tirage horizontal (poulie)", group: 'dos', equipment: 'poulie' },
  { id: 'tirage-horizontal-machine', name: "Tirage horizontal (machine)", group: 'dos', equipment: 'machine' },
  { id: 'rowing-barre', name: "Rowing barre", group: 'dos', equipment: 'barre' },
  { id: 'rowing-halteres', name: "Rowing haltère (unilatéral)", group: 'dos', equipment: 'halteres' },
  { id: 'rowing-t-bar', name: "Rowing T-bar", group: 'dos', equipment: 'machine' },
  { id: 'rowing-machine', name: "Rowing machine", group: 'dos', equipment: 'machine' },
  { id: 'souleve-de-terre', name: "Soulevé de terre", group: 'dos', equipment: 'barre' },
  { id: 'souleve-de-terre-trap-bar', name: "Soulevé de terre (trap bar)", group: 'dos', equipment: 'barre' },
  { id: 'pull-over-poulie', name: "Pull-over à la poulie", group: 'dos', equipment: 'poulie' },
  { id: 'rowing-meadows-landmine', name: "Rowing Meadows (landmine)", group: 'dos', equipment: 'barre' },
  { id: 'rowing-pendlay', name: "Rowing Pendlay", group: 'dos', equipment: 'barre' },
  { id: 'rowing-inverse-poids-du-corps', name: "Rowing inversé (poids du corps)", group: 'dos', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'rowing-unilateral-poulie-basse', name: "Rowing unilatéral poulie basse", group: 'dos', equipment: 'poulie' },
  { id: 'rowing-banc-incline-chest-supported', name: "Rowing banc incliné (chest supported)", group: 'dos', equipment: 'halteres' },
  { id: 'rowing-prise-neutre-barre-v', name: "Rowing prise neutre (barre V)", group: 'dos', equipment: 'machine' },
  { id: 'tirage-horizontal-prise-serree', name: "Tirage horizontal prise serrée", group: 'dos', equipment: 'poulie' },
  { id: 'tirage-horizontal-prise-large', name: "Tirage horizontal prise large", group: 'dos', equipment: 'poulie' },
  { id: 'tirage-vertical-prise-serree', name: "Tirage vertical prise serrée", group: 'dos', equipment: 'poulie' },
  { id: 'tirage-vertical-prise-neutre', name: "Tirage vertical prise neutre", group: 'dos', equipment: 'poulie' },
  { id: 'tirage-vertical-unilateral', name: "Tirage vertical unilatéral", group: 'dos', equipment: 'poulie' },
  { id: 'traction-negative-excentrique', name: "Traction négative (excentrique)", group: 'dos', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'superman-extension-au-sol', name: "Superman (extension au sol)", group: 'dos', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'extension-lombaire-au-banc-hyperextension', name: "Extension lombaire au banc (hyperextension)", group: 'dos', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'reverse-hyperextension', name: "Reverse hyperextension", group: 'dos', equipment: 'machine' },
  { id: 'rack-pull', name: "Rack pull", group: 'dos', equipment: 'barre' },
  { id: 'deadlift-en-deficit', name: "Deadlift en déficit", group: 'dos', equipment: 'barre' },
  { id: 'tirage-nuque-behind-the-neck', name: "Tirage nuque (behind the neck)", group: 'dos', equipment: 'poulie' },

  // Trapèzes
  { id: 'haussements-barre', name: "Haussements d'épaules (barre)", group: 'trapezes', equipment: 'barre' },
  { id: 'haussements-halteres', name: "Haussements d'épaules (haltères)", group: 'trapezes', equipment: 'halteres' },
  { id: 'haussements-d-epaules-poulie', name: "Haussements d'épaules (poulie)", group: 'trapezes', equipment: 'poulie' },
  { id: 'haussements-d-epaules-smith', name: "Haussements d'épaules (Smith)", group: 'trapezes', equipment: 'smith' },
  { id: 'haussements-unilateral-haltere', name: "Haussements unilatéral (haltère)", group: 'trapezes', equipment: 'halteres' },
  { id: 'shrug-barre-derriere-le-dos', name: "Shrug barre derrière le dos", group: 'trapezes', equipment: 'barre' },
  { id: 'trap-bar-shrug', name: "Trap bar shrug", group: 'trapezes', equipment: 'barre' },
  { id: 'y-raise-trapeze-inferieur', name: "Y-raise (trapèze inférieur)", group: 'trapezes', equipment: 'halteres' },
  { id: 'rowing-menton-a-la-poulie', name: "Rowing menton à la poulie", group: 'trapezes', equipment: 'poulie' },
  { id: 'face-pull-avec-rotation', name: "Face pull avec rotation", group: 'trapezes', equipment: 'poulie' },

  // Épaules
  { id: 'developpe-militaire', name: "Développé militaire (barre)", group: 'epaules', equipment: 'barre' },
  { id: 'developpe-militaire-smith', name: "Développé militaire (Smith)", group: 'epaules', equipment: 'smith' },
  { id: 'developpe-epaules-halteres', name: "Développé épaules (haltères)", group: 'epaules', equipment: 'halteres' },
  { id: 'developpe-epaules-machine', name: "Développé épaules (machine)", group: 'epaules', equipment: 'machine' },
  { id: 'developpe-arnold', name: "Développé Arnold", group: 'epaules', equipment: 'halteres' },
  { id: 'elevations-laterales', name: "Élévations latérales (haltères)", group: 'epaules', equipment: 'halteres' },
  { id: 'elevations-laterales-poulie', name: "Élévations latérales (poulie)", group: 'epaules', equipment: 'poulie' },
  { id: 'elevations-laterales-machine', name: "Élévations latérales (machine)", group: 'epaules', equipment: 'machine' },
  { id: 'elevations-frontales', name: "Élévations frontales (haltères)", group: 'epaules', equipment: 'halteres' },
  { id: 'oiseau', name: "Oiseau (haltères)", group: 'epaules', equipment: 'halteres' },
  { id: 'oiseau-poulie', name: "Oiseau (poulie)", group: 'epaules', equipment: 'poulie' },
  { id: 'pec-deck-inverse', name: "Pec-deck inversé (machine)", group: 'epaules', equipment: 'machine' },
  { id: 'face-pull', name: "Face pull", group: 'epaules', equipment: 'poulie' },
  { id: 'rowing-menton', name: "Rowing menton (upright row)", group: 'epaules', equipment: 'barre' },
  { id: 'developpe-militaire-assis-halteres', name: "Développé militaire assis (haltères)", group: 'epaules', equipment: 'halteres' },
  { id: 'developpe-militaire-debout-halteres', name: "Développé militaire debout (haltères)", group: 'epaules', equipment: 'halteres' },
  { id: 'developpe-epaules-smith', name: "Développé épaules Smith", group: 'epaules', equipment: 'smith' },
  { id: 'developpe-nuque-barre', name: "Développé nuque (barre)", group: 'epaules', equipment: 'barre' },
  { id: 'landmine-press-epaule-unilateral', name: "Landmine press épaule (unilatéral)", group: 'epaules', equipment: 'barre' },
  { id: 'elevations-laterales-penche', name: "Élévations latérales penché", group: 'epaules', equipment: 'halteres' },
  { id: 'elevations-laterales-inclinees', name: "Élévations latérales inclinées", group: 'epaules', equipment: 'halteres' },
  { id: 'elevations-laterales-cable-croise', name: "Élévations latérales câble croisé", group: 'epaules', equipment: 'poulie' },
  { id: 'cuban-press', name: "Cuban press", group: 'epaules', equipment: 'halteres' },
  { id: 'elevation-frontale-poulie', name: "Élévation frontale (poulie)", group: 'epaules', equipment: 'poulie' },
  { id: 'elevation-frontale-disque', name: "Élévation frontale (disque)", group: 'epaules', equipment: 'halteres' },
  { id: 'pike-push-up', name: "Pike push-up", group: 'epaules', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'rotation-externe-epaule-poulie', name: "Rotation externe épaule (poulie)", group: 'epaules', equipment: 'poulie' },
  { id: 'rotation-interne-epaule-poulie', name: "Rotation interne épaule (poulie)", group: 'epaules', equipment: 'poulie' },

  // Biceps
  { id: 'curl-barre', name: "Curl barre", group: 'biceps', equipment: 'barre' },
  { id: 'curl-barre-ez', name: "Curl barre EZ", group: 'biceps', equipment: 'barre' },
  { id: 'curl-halteres', name: "Curl haltères", group: 'biceps', equipment: 'halteres' },
  { id: 'curl-marteau', name: "Curl marteau", group: 'biceps', equipment: 'halteres' },
  { id: 'curl-incline', name: "Curl incliné (haltères)", group: 'biceps', equipment: 'halteres' },
  { id: 'curl-pupitre', name: "Curl pupitre (Larry Scott)", group: 'biceps', equipment: 'machine' },
  { id: 'curl-poulie', name: "Curl à la poulie", group: 'biceps', equipment: 'poulie' },
  { id: 'curl-concentration', name: "Curl concentration", group: 'biceps', equipment: 'halteres' },
  { id: 'curl-araignee-spider-curl', name: "Curl araignée (spider curl)", group: 'biceps', equipment: 'halteres' },
  { id: 'curl-precheur-unilateral-haltere', name: "Curl prêcheur unilatéral (haltère)", group: 'biceps', equipment: 'halteres' },
  { id: 'curl-poulie-basse-unilateral', name: "Curl poulie basse unilatéral", group: 'biceps', equipment: 'poulie' },
  { id: 'curl-21', name: "Curl 21", group: 'biceps', equipment: 'barre' },
  { id: 'curl-marteau-a-la-poulie', name: "Curl marteau à la poulie", group: 'biceps', equipment: 'poulie' },
  { id: 'curl-marteau-incline', name: "Curl marteau incliné", group: 'biceps', equipment: 'halteres' },
  { id: 'curl-inverse-barre', name: "Curl inversé (barre)", group: 'biceps', equipment: 'barre' },
  { id: 'curl-zottman', name: "Curl Zottman", group: 'biceps', equipment: 'halteres' },
  { id: 'curl-cable-haut-crucifix', name: "Curl câble haut (crucifix)", group: 'biceps', equipment: 'poulie' },
  { id: 'curl-drag', name: "Curl drag", group: 'biceps', equipment: 'barre' },
  { id: 'curl-incline-poulie-basse', name: "Curl incliné poulie basse", group: 'biceps', equipment: 'poulie' },

  // Triceps
  { id: 'dips', name: "Dips (triceps)", group: 'triceps', equipment: 'poids-du-corps' },
  { id: 'dips-machine', name: "Dips machine", group: 'triceps', equipment: 'machine' },
  { id: 'extensions-poulie', name: "Extensions à la poulie (corde)", group: 'triceps', equipment: 'poulie' },
  { id: 'extensions-poulie-barre', name: "Extensions à la poulie (barre)", group: 'triceps', equipment: 'poulie' },
  { id: 'barre-au-front', name: "Barre au front (skull crusher)", group: 'triceps', equipment: 'barre' },
  { id: 'extensions-verticales-haltere', name: "Extension verticale (haltère)", group: 'triceps', equipment: 'halteres' },
  { id: 'extension-nuque-poulie', name: "Extension nuque à la poulie", group: 'triceps', equipment: 'poulie' },
  { id: 'kickback', name: "Kickback (haltère)", group: 'triceps', equipment: 'halteres' },
  { id: 'developpe-serre', name: "Développé couché serré", group: 'triceps', equipment: 'barre' },
  { id: 'extension-triceps-un-bras-poulie', name: "Extension triceps un bras (poulie)", group: 'triceps', equipment: 'poulie' },
  { id: 'extension-allongee-au-sol-barre-ez', name: "Extension allongée au sol (barre EZ)", group: 'triceps', equipment: 'barre' },
  { id: 'developpe-triceps-haltere-deux-mains', name: "Développé triceps haltère (deux mains)", group: 'triceps', equipment: 'halteres' },
  { id: 'dips-entre-deux-bancs', name: "Dips entre deux bancs", group: 'triceps', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'presse-francaise-overhead-haltere', name: "Presse française (overhead haltère)", group: 'triceps', equipment: 'halteres' },
  { id: 'jm-press', name: "JM press", group: 'triceps', equipment: 'barre' },
  { id: 'extension-triceps-machine', name: "Extension triceps machine", group: 'triceps', equipment: 'machine' },
  { id: 'push-down-prise-marteau-corde', name: "Push-down prise marteau (corde)", group: 'triceps', equipment: 'poulie' },
  { id: 'push-down-barre-droite', name: "Push-down barre droite", group: 'triceps', equipment: 'poulie' },
  { id: 'extension-unilaterale-au-dessus-tete', name: "Extension unilatérale au-dessus tête", group: 'triceps', equipment: 'halteres' },
  { id: 'dips-lestes', name: "Dips lestés", group: 'triceps', equipment: 'poids-du-corps' },

  // Avant-bras
  { id: 'curl-poignet-barre-paume-dessus', name: "Curl poignet (barre, paume dessus)", group: 'avant-bras', equipment: 'barre' },
  { id: 'curl-poignet-inverse-paume-dessous', name: "Curl poignet inversé (paume dessous)", group: 'avant-bras', equipment: 'barre' },
  { id: 'curl-poignet-haltere-unilateral', name: "Curl poignet haltère (unilatéral)", group: 'avant-bras', equipment: 'halteres' },
  { id: 'curl-poignet-a-la-poulie', name: "Curl poignet à la poulie", group: 'avant-bras', equipment: 'poulie' },
  { id: 'enroulement-de-barre-wrist-roller', name: "Enroulement de barre (wrist roller)", group: 'avant-bras', equipment: 'barre', metric: 'reps' },
  { id: 'suspension-a-la-barre-dead-hang', name: "Suspension à la barre (dead hang)", group: 'avant-bras', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },
  { id: 'extension-poignet-haltere', name: "Extension poignet haltère", group: 'avant-bras', equipment: 'halteres' },
  { id: 'extension-poignet-a-la-poulie', name: "Extension poignet à la poulie", group: 'avant-bras', equipment: 'poulie' },
  { id: 'prehension-isometrique-pince', name: "Préhension isométrique (pince)", group: 'avant-bras', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },

  // Quadriceps
  { id: 'squat-barre', name: "Squat (barre)", group: 'quadriceps', equipment: 'barre' },
  { id: 'squat-smith', name: "Squat (Smith)", group: 'quadriceps', equipment: 'smith' },
  { id: 'front-squat', name: "Squat avant (front squat)", group: 'quadriceps', equipment: 'barre' },
  { id: 'squat-gobelet', name: "Squat gobelet (goblet)", group: 'quadriceps', equipment: 'halteres' },
  { id: 'squat-bulgare', name: "Squat bulgare", group: 'quadriceps', equipment: 'halteres' },
  { id: 'presse-cuisses', name: "Presse à cuisses", group: 'quadriceps', equipment: 'machine' },
  { id: 'hack-squat', name: "Hack squat (machine)", group: 'quadriceps', equipment: 'machine' },
  { id: 'leg-extension', name: "Leg extension", group: 'quadriceps', equipment: 'machine' },
  { id: 'fentes-halteres', name: "Fentes (haltères)", group: 'quadriceps', equipment: 'halteres' },
  { id: 'fentes-marchees', name: "Fentes marchées", group: 'quadriceps', equipment: 'halteres' },
  { id: 'squat-sumo', name: "Squat sumo", group: 'quadriceps', equipment: 'barre' },
  { id: 'squat-pause', name: "Squat pause", group: 'quadriceps', equipment: 'barre' },
  { id: 'box-squat', name: "Box squat", group: 'quadriceps', equipment: 'barre' },
  { id: 'zercher-squat', name: "Zercher squat", group: 'quadriceps', equipment: 'barre' },
  { id: 'squat-pistol-unilateral', name: "Squat pistol (unilatéral)", group: 'quadriceps', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'presse-a-cuisses-unilaterale', name: "Presse à cuisses unilatérale", group: 'quadriceps', equipment: 'machine' },
  { id: 'presse-a-cuisses-pieds-bas', name: "Presse à cuisses pieds bas", group: 'quadriceps', equipment: 'machine' },
  { id: 'sissy-squat', name: "Sissy squat", group: 'quadriceps', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'step-up-banc-halteres', name: "Step-up (banc, haltères)", group: 'quadriceps', equipment: 'halteres' },
  { id: 'leg-extension-unilaterale', name: "Leg extension unilatérale", group: 'quadriceps', equipment: 'machine' },
  { id: 'squat-overhead', name: "Squat overhead", group: 'quadriceps', equipment: 'barre' },
  { id: 'fentes-arriere-reverse-lunge', name: "Fentes arrière (reverse lunge)", group: 'quadriceps', equipment: 'halteres' },
  { id: 'fentes-laterales', name: "Fentes latérales", group: 'quadriceps', equipment: 'halteres' },

  // Ischios
  { id: 'souleve-de-terre-roumain', name: "Soulevé de terre roumain", group: 'ischios-fessiers', equipment: 'barre' },
  { id: 'souleve-de-terre-jambes-tendues', name: "Soulevé de terre jambes tendues", group: 'ischios-fessiers', equipment: 'barre' },
  { id: 'leg-curl', name: "Leg curl allongé", group: 'ischios-fessiers', equipment: 'machine' },
  { id: 'leg-curl-assis', name: "Leg curl assis", group: 'ischios-fessiers', equipment: 'machine' },
  { id: 'good-morning', name: "Good morning", group: 'ischios-fessiers', equipment: 'barre' },
  { id: 'leg-curl-debout-unilateral', name: "Leg curl debout unilatéral", group: 'ischios-fessiers', equipment: 'machine' },
  { id: 'leg-curl-assis-unilateral', name: "Leg curl assis unilatéral", group: 'ischios-fessiers', equipment: 'machine' },
  { id: 'nordic-curl', name: "Nordic curl", group: 'ischios-fessiers', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'souleve-de-terre-roumain-unilateral', name: "Soulevé de terre roumain unilatéral", group: 'ischios-fessiers', equipment: 'halteres' },
  { id: 'souleve-de-terre-roumain-halteres', name: "Soulevé de terre roumain (haltères)", group: 'ischios-fessiers', equipment: 'halteres' },
  { id: 'glute-ham-raise', name: "Glute-ham raise", group: 'ischios-fessiers', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'good-morning-assis-machine', name: "Good morning assis (machine)", group: 'ischios-fessiers', equipment: 'machine' },

  // Fessiers
  { id: 'hip-thrust', name: "Hip thrust", group: 'fessiers', equipment: 'barre' },
  { id: 'pont-fessier', name: "Pont fessier (glute bridge)", group: 'fessiers', equipment: 'barre' },
  { id: 'abduction-hanche', name: "Abduction hanche (machine)", group: 'fessiers', equipment: 'machine' },
  { id: 'kickback-fessier', name: "Kickback fessier (poulie)", group: 'fessiers', equipment: 'poulie' },
  { id: 'hip-thrust-unilateral', name: "Hip thrust unilatéral", group: 'fessiers', equipment: 'halteres' },
  { id: 'hip-thrust-a-la-machine', name: "Hip thrust à la machine", group: 'fessiers', equipment: 'machine' },
  { id: 'cable-pull-through', name: "Cable pull-through", group: 'fessiers', equipment: 'poulie' },
  { id: 'abduction-hanche-debout-poulie', name: "Abduction hanche debout (poulie)", group: 'fessiers', equipment: 'poulie' },
  { id: 'adduction-hanche-machine', name: "Adduction hanche (machine)", group: 'fessiers', equipment: 'machine' },
  { id: 'adduction-hanche-poulie', name: "Adduction hanche (poulie)", group: 'fessiers', equipment: 'poulie' },
  { id: 'frog-pump', name: "Frog pump", group: 'fessiers', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'donkey-kick', name: "Donkey kick", group: 'fessiers', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'glute-kickback-machine', name: "Glute kickback machine", group: 'fessiers', equipment: 'machine' },
  { id: 'fentes-fessiers-a-la-poulie', name: "Fentes fessiers à la poulie", group: 'fessiers', equipment: 'poulie' },
  { id: 'clamshell-elastique', name: "Clamshell (élastique)", group: 'fessiers', equipment: 'poids-du-corps', metric: 'reps' },

  // Mollets
  { id: 'extensions-mollets-debout', name: "Extensions mollets debout", group: 'mollets', equipment: 'machine' },
  { id: 'extensions-mollets-assis', name: "Extensions mollets assis", group: 'mollets', equipment: 'machine' },
  { id: 'mollets-presse', name: "Mollets à la presse", group: 'mollets', equipment: 'machine' },
  { id: 'extensions-mollets-debout-unilaterale', name: "Extensions mollets debout unilatérale", group: 'mollets', equipment: 'machine' },
  { id: 'mollets-a-la-presse-unilaterale', name: "Mollets à la presse unilatérale", group: 'mollets', equipment: 'machine' },
  { id: 'mollets-debout-smith', name: "Mollets debout (Smith)", group: 'mollets', equipment: 'smith' },
  { id: 'donkey-calf-raise', name: "Donkey calf raise", group: 'mollets', equipment: 'machine' },
  { id: 'extension-mollets-assis-unilaterale', name: "Extension mollets assis unilatérale", group: 'mollets', equipment: 'machine' },

  // Abdos / Core
  { id: 'crunch', name: "Crunch (sol)", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'crunch-poulie', name: "Crunch à la poulie", group: 'core', equipment: 'poulie' },
  { id: 'crunch-machine', name: "Crunch machine", group: 'core', equipment: 'machine' },
  { id: 'releve-jambes-suspendu', name: "Relevé de jambes suspendu", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'leg-raises', name: "Relevé de jambes (sol)", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'russian-twist', name: "Russian twist", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'roue-abdominale', name: "Roue abdominale (ab wheel)", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'mountain-climbers', name: "Mountain climbers", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'releve-bassin', name: "Relevé de bassin (reverse crunch)", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'planche', name: "Planche (gainage)", group: 'core', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },
  { id: 'planche-laterale', name: "Planche latérale", group: 'core', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },
  { id: 'hollow-hold', name: "Hollow hold", group: 'core', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },
  { id: 'chaise', name: "Chaise (wall sit)", group: 'core', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },
  { id: 'crunch-inverse-banc-incline', name: "Crunch inversé (banc incliné)", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'crunch-bicyclette', name: "Crunch bicyclette", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'v-up', name: "V-up", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'toes-to-bar', name: "Toes to bar", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'dragon-flag', name: "Dragon flag", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'pallof-press-poulie', name: "Pallof press (poulie)", group: 'core', equipment: 'poulie' },
  { id: 'rotation-du-tronc-poulie', name: "Rotation du tronc (poulie)", group: 'core', equipment: 'poulie' },
  { id: 'roue-abdominale-debout', name: "Roue abdominale debout", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'sit-up-leste', name: "Sit-up lesté", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'planche-lestee', name: "Planche lestée", group: 'core', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },
  { id: 'l-sit', name: "L-sit", group: 'core', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },
  { id: 'russian-twist-leste', name: "Russian twist lesté", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'bird-dog', name: "Bird dog", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'dead-bug', name: "Dead bug", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'hollow-rock', name: "Hollow rock", group: 'core', equipment: 'poids-du-corps', metric: 'reps' },

  // Cardio
  { id: 'tapis-de-course', name: "Tapis de course", group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'tapis-de-marche', name: "Tapis de marche", group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'velo-stationnaire', name: "Vélo stationnaire", group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'velo-elliptique', name: "Vélo elliptique", group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'rameur', name: "Rameur", group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'stepper', name: "Stepper / escaliers", group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'assault-bike', name: "Assault bike", group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'corde-a-sauter', name: "Corde à sauter", group: 'cardio', equipment: 'poids-du-corps', metric: 'temps', unit: 'min' },
  { id: 'burpees', name: "Burpees", group: 'cardio', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'marche-inclinee-forte-pente', name: "Marche inclinée (forte pente)", group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'marche-rapide-exterieur', name: "Marche rapide (extérieur)", group: 'cardio', equipment: 'poids-du-corps', metric: 'temps', unit: 'min' },
  { id: 'course-a-pied-exterieur', name: "Course à pied (extérieur)", group: 'cardio', equipment: 'poids-du-corps', metric: 'temps', unit: 'min' },
  { id: 'fractionne-tapis-intervalles', name: "Fractionné tapis (intervalles)", group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'velo-semi-allonge-recumbent', name: "Vélo semi-allongé (recumbent)", group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'velo-route-exterieur', name: "Vélo route / extérieur", group: 'cardio', equipment: 'poids-du-corps', metric: 'temps', unit: 'min' },
  { id: 'ski-erg', name: "Ski erg", group: 'cardio', equipment: 'cardio', metric: 'temps', unit: 'min' },
  { id: 'natation-longueurs', name: "Natation (longueurs)", group: 'cardio', equipment: 'poids-du-corps', metric: 'temps', unit: 'min' },
  { id: 'corde-a-sauter-double-unders', name: "Corde à sauter (double unders)", group: 'cardio', equipment: 'poids-du-corps', metric: 'temps', unit: 'min' },

  // Fonctionnel
  { id: 'kettlebell-swing-russe', name: "Kettlebell swing russe", group: 'fonctionnel', equipment: 'kettlebell' },
  { id: 'kettlebell-swing-americain', name: "Kettlebell swing américain", group: 'fonctionnel', equipment: 'kettlebell' },
  { id: 'kettlebell-clean-and-press', name: "Kettlebell clean and press", group: 'fonctionnel', equipment: 'kettlebell' },
  { id: 'kettlebell-snatch', name: "Kettlebell snatch", group: 'fonctionnel', equipment: 'kettlebell' },
  { id: 'turkish-get-up', name: "Turkish get-up", group: 'fonctionnel', equipment: 'kettlebell' },
  { id: 'farmer-s-walk', name: "Farmer's walk", group: 'fonctionnel', equipment: 'halteres', metric: 'temps', unit: 'sec' },
  { id: 'sled-push', name: "Sled push", group: 'fonctionnel', equipment: 'traineau', metric: 'reps' },
  { id: 'sled-pull', name: "Sled pull", group: 'fonctionnel', equipment: 'traineau', metric: 'reps' },
  { id: 'battle-ropes', name: "Battle ropes", group: 'fonctionnel', equipment: 'corde', metric: 'temps', unit: 'sec' },
  { id: 'box-jump', name: "Box jump", group: 'fonctionnel', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'broad-jump', name: "Broad jump", group: 'fonctionnel', equipment: 'poids-du-corps', metric: 'reps' },
  { id: 'wall-ball-medecine-ball', name: "Wall ball (medecine ball)", group: 'fonctionnel', equipment: 'medecine-ball', metric: 'reps' },
  { id: 'slam-ball', name: "Slam ball", group: 'fonctionnel', equipment: 'medecine-ball', metric: 'reps' },
  { id: 'tire-flip', name: "Tire flip", group: 'fonctionnel', equipment: 'divers-materiel', metric: 'reps' },
  { id: 'trx-row', name: "TRX row", group: 'fonctionnel', equipment: 'sangles', metric: 'reps' },
  { id: 'trx-push-up', name: "TRX push-up", group: 'fonctionnel', equipment: 'sangles', metric: 'reps' },
  { id: 'renegade-row-kettlebell', name: "Renegade row (kettlebell)", group: 'fonctionnel', equipment: 'kettlebell' },
  { id: 'man-maker', name: "Man-maker", group: 'fonctionnel', equipment: 'halteres', metric: 'reps' },
  { id: 'bear-crawl', name: "Bear crawl", group: 'fonctionnel', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },
  { id: 'wall-sit-leste', name: "Wall sit lesté", group: 'fonctionnel', equipment: 'poids-du-corps', metric: 'temps', unit: 'sec' },

  // Divers
  { id: 'etirements-mobilite', name: "Étirements / mobilité", group: 'divers', equipment: 'poids-du-corps', metric: 'temps', unit: 'min' },
  { id: 'yoga-stretching', name: "Yoga / stretching", group: 'divers', equipment: 'poids-du-corps', metric: 'temps', unit: 'min' },
  { id: 'marche-loisir', name: "Marche (loisir)", group: 'divers', equipment: 'poids-du-corps', metric: 'temps', unit: 'min' },
  { id: 'foam-rolling', name: "Foam rolling", group: 'divers', equipment: 'poids-du-corps', metric: 'temps', unit: 'min' },
  { id: 'autre', name: "Autre / Libre", group: 'divers', equipment: 'poids-du-corps' },
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

// --- Économie : difficulté par exo ---
// Facteur multiplicatif sur la formule poids × reps. Défaut = 1.0 (isolation standard).
// Échelle à 5 crans : 0.9 isolation légère · 1.0 isolation · 1.15 machine guidée ·
// 1.3 composé libre · 1.5 composé lourd (barre libre axiale).
const DIFFICULTY_OVERRIDES = {
  'developpe-couche-barre': 1.5,
  'developpe-couche-halteres': 1.3,
  'developpe-couche-smith': 1.15,
  'developpe-couche-convergent': 1.15,
  'developpe-incline-barre': 1.5,
  'developpe-incline-halteres': 1.3,
  'developpe-incline-smith': 1.15,
  'developpe-incline-convergent': 1.15,
  'developpe-decline-barre': 1.5,
  'presse-pectoraux': 1.15,
  'tractions': 1.3,
  'tractions-supination': 1.3,
  'tractions-assistees': 1.15,
  'tirage-vertical': 1.15,
  'tirage-vertical-supination': 1.15,
  'tirage-horizontal': 1.15,
  'tirage-horizontal-machine': 1.15,
  'rowing-barre': 1.5,
  'rowing-halteres': 1.3,
  'rowing-t-bar': 1.3,
  'rowing-machine': 1.15,
  'souleve-de-terre': 1.5,
  'souleve-de-terre-trap-bar': 1.5,
  'developpe-militaire': 1.5,
  'developpe-militaire-smith': 1.15,
  'developpe-epaules-halteres': 1.3,
  'developpe-epaules-machine': 1.15,
  'developpe-arnold': 1.3,
  'elevations-laterales': 0.9,
  'elevations-laterales-poulie': 0.9,
  'elevations-laterales-machine': 0.9,
  'elevations-frontales': 0.9,
  'oiseau': 0.9,
  'oiseau-poulie': 0.9,
  'face-pull': 0.9,
  'curl-concentration': 0.9,
  'dips': 1.3,
  'dips-machine': 1.15,
  'kickback': 0.9,
  'developpe-serre': 1.3,
  'squat-barre': 1.5,
  'squat-smith': 1.3,
  'front-squat': 1.5,
  'squat-gobelet': 1.3,
  'squat-bulgare': 1.3,
  'presse-cuisses': 1.3,
  'hack-squat': 1.3,
  'fentes-halteres': 1.3,
  'fentes-marchees': 1.3,
  'souleve-de-terre-roumain': 1.5,
  'souleve-de-terre-jambes-tendues': 1.5,
  'hip-thrust': 1.3,
  'pont-fessier': 1.3,
  'good-morning': 1.5,
  'abduction-hanche': 0.9,
  'kickback-fessier': 0.9,
  'extensions-mollets-debout': 0.9,
  'extensions-mollets-assis': 0.9,
  'developpe-couche-unilateral-haltere': 1.3,
  'developpe-couche-prise-large-barre': 1.5,
  'developpe-decline-halteres': 1.3,
  'developpe-decline-smith': 1.15,
  'developpe-decline-convergent': 1.15,
  'presse-a-pectoraux-unilaterale': 1.15,
  'svend-press-disque': 0.9,
  'landmine-press-poitrine': 1.3,
  'rowing-meadows-landmine': 1.3,
  'rowing-pendlay': 1.5,
  'rowing-unilateral-poulie-basse': 1.15,
  'rowing-banc-incline-chest-supported': 1.3,
  'rowing-prise-neutre-barre-v': 1.15,
  'tirage-horizontal-prise-serree': 1.15,
  'tirage-horizontal-prise-large': 1.15,
  'tirage-vertical-prise-serree': 1.15,
  'tirage-vertical-prise-neutre': 1.15,
  'tirage-vertical-unilateral': 1.15,
  'rack-pull': 1.5,
  'deadlift-en-deficit': 1.5,
  'tirage-nuque-behind-the-neck': 1.15,
  'haussements-unilateral-haltere': 0.9,
  'y-raise-trapeze-inferieur': 0.9,
  'face-pull-avec-rotation': 0.9,
  'developpe-militaire-assis-halteres': 1.3,
  'developpe-militaire-debout-halteres': 1.3,
  'developpe-epaules-smith': 1.15,
  'developpe-nuque-barre': 1.5,
  'landmine-press-epaule-unilateral': 1.3,
  'elevations-laterales-penche': 0.9,
  'elevations-laterales-inclinees': 0.9,
  'elevations-laterales-cable-croise': 0.9,
  'elevation-frontale-poulie': 0.9,
  'elevation-frontale-disque': 0.9,
  'rotation-externe-epaule-poulie': 0.9,
  'rotation-interne-epaule-poulie': 0.9,
  'curl-poulie-basse-unilateral': 0.9,
  'curl-cable-haut-crucifix': 0.9,
  'extension-triceps-un-bras-poulie': 0.9,
  'jm-press': 1.3,
  'extension-unilaterale-au-dessus-tete': 0.9,
  'dips-lestes': 1.3,
  'curl-poignet-barre-paume-dessus': 0.9,
  'curl-poignet-inverse-paume-dessous': 0.9,
  'curl-poignet-haltere-unilateral': 0.9,
  'curl-poignet-a-la-poulie': 0.9,
  'extension-poignet-haltere': 0.9,
  'extension-poignet-a-la-poulie': 0.9,
  'squat-sumo': 1.5,
  'squat-pause': 1.5,
  'box-squat': 1.5,
  'zercher-squat': 1.5,
  'presse-a-cuisses-unilaterale': 1.3,
  'presse-a-cuisses-pieds-bas': 1.3,
  'step-up-banc-halteres': 1.3,
  'squat-overhead': 1.5,
  'fentes-arriere-reverse-lunge': 1.3,
  'fentes-laterales': 1.3,
  'souleve-de-terre-roumain-unilateral': 1.3,
  'souleve-de-terre-roumain-halteres': 1.3,
  'good-morning-assis-machine': 1.15,
  'hip-thrust-unilateral': 1.3,
  'hip-thrust-a-la-machine': 1.15,
  'abduction-hanche-debout-poulie': 0.9,
  'adduction-hanche-machine': 0.9,
  'adduction-hanche-poulie': 0.9,
  'glute-kickback-machine': 0.9,
  'extensions-mollets-debout-unilaterale': 0.9,
  'extension-mollets-assis-unilaterale': 0.9,
  'pallof-press-poulie': 0.9,
  'rotation-du-tronc-poulie': 0.9,
  'kettlebell-swing-russe': 1.3,
  'kettlebell-swing-americain': 1.3,
  'kettlebell-clean-and-press': 1.3,
  'kettlebell-snatch': 1.3,
  'turkish-get-up': 1.3,
  'renegade-row-kettlebell': 1.3,
}

// Pour les exos au poids du corps (metric 'reps') : runes par répétition.
// Pour les exos 'temps' : runes par seconde (unit 'sec') ou par minute (unit 'min').
// Sert aussi de fallback pour un exo 'charge' fait sans lest (poids = 0).
const BODYWEIGHT_FACTORS = {
  'pompes': 1.5, // rep
  'tractions': 4, // rep
  'tractions-supination': 4, // rep
  'dips': 3, // rep
  'crunch': 0.6, // rep
  'releve-jambes-suspendu': 2, // rep
  'leg-raises': 1.5, // rep
  'russian-twist': 0.8, // rep
  'roue-abdominale': 2, // rep
  'mountain-climbers': 1.2, // rep
  'releve-bassin': 1, // rep
  'planche': 1, // sec
  'planche-laterale': 1, // sec
  'hollow-hold': 1.2, // sec
  'chaise': 1, // sec
  'tapis-de-course': 7, // min
  'tapis-de-marche': 3, // min
  'velo-stationnaire': 5, // min
  'velo-elliptique': 5, // min
  'rameur': 7, // min
  'stepper': 6, // min
  'assault-bike': 9, // min
  'corde-a-sauter': 8, // min
  'burpees': 3, // rep
  'pompes-lestees': 2, // rep
  'pompes-declinees': 1.8, // rep
  'pompes-inclinees': 1, // rep
  'pompes-diamant': 1.8, // rep
  'pompes-archer': 2.2, // rep
  'rowing-inverse-poids-du-corps': 2, // rep
  'traction-negative-excentrique': 3, // rep
  'superman-extension-au-sol': 0.8, // rep
  'extension-lombaire-au-banc-hyperextension': 1, // rep
  'pike-push-up': 2, // rep
  'dips-entre-deux-bancs': 2, // rep
  'dips-lestes': 3, // rep
  'enroulement-de-barre-wrist-roller': 2, // rep
  'suspension-a-la-barre-dead-hang': 0.6, // sec
  'prehension-isometrique-pince': 0.8, // sec
  'squat-pistol-unilateral': 3, // rep
  'sissy-squat': 1.5, // rep
  'nordic-curl': 3, // rep
  'glute-ham-raise': 2.5, // rep
  'frog-pump': 0.8, // rep
  'donkey-kick': 0.8, // rep
  'clamshell-elastique': 0.6, // rep
  'crunch-inverse-banc-incline': 1.2, // rep
  'crunch-bicyclette': 0.8, // rep
  'v-up': 1.5, // rep
  'toes-to-bar': 2.5, // rep
  'dragon-flag': 3, // rep
  'roue-abdominale-debout': 3, // rep
  'sit-up-leste': 1.2, // rep
  'planche-lestee': 1.3, // sec
  'l-sit': 1.5, // sec
  'russian-twist-leste': 1, // rep
  'bird-dog': 0.6, // rep
  'dead-bug': 0.6, // rep
  'hollow-rock': 1, // rep
  'marche-inclinee-forte-pente': 6, // min
  'marche-rapide-exterieur': 4, // min
  'course-a-pied-exterieur': 7, // min
  'fractionne-tapis-intervalles': 9, // min
  'velo-semi-allonge-recumbent': 4, // min
  'velo-route-exterieur': 5, // min
  'ski-erg': 7, // min
  'natation-longueurs': 8, // min
  'corde-a-sauter-double-unders': 9, // min
  'farmer-s-walk': 0.6, // sec
  'sled-push': 4, // rep
  'sled-pull': 4, // rep
  'battle-ropes': 0.8, // sec
  'box-jump': 2, // rep
  'broad-jump': 2, // rep
  'wall-ball-medecine-ball': 1.5, // rep
  'slam-ball': 1.5, // rep
  'tire-flip': 3, // rep
  'trx-row': 1.5, // rep
  'trx-push-up': 1.5, // rep
  'man-maker': 3, // rep
  'bear-crawl': 0.6, // sec
  'wall-sit-leste': 1.2, // sec
  'etirements-mobilite': 1, // min
  'yoga-stretching': 1, // min
  'marche-loisir': 1.5, // min
  'foam-rolling': 0.5, // min
  'autre': 1, // rep
}

export function getDifficulty(id) {
  return DIFFICULTY_OVERRIDES[id] ?? 1.0
}

export function getBodyweightFactor(id) {
  return BODYWEIGHT_FACTORS[id] ?? 1
}
