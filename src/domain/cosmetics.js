// Raretés — ordonnées par puissance, couleur Tailwind associée
export const RARITIES = {
  brut: { label: 'Brut', order: 1, color: 'text-ash' },
  forge: { label: 'Forgé', order: 2, color: 'text-ember' },
  eveille: { label: 'Éveillé', order: 3, color: 'text-glow' },
  ascendant: { label: 'Ascendant', order: 4, color: 'text-cream' },
}

// Types — comment le cosmétique se manifeste à l'écran
export const COSMETIC_TYPES = {
  aura: 'Aura',
  titre: 'Titre',
  fond: 'Fond',
}

// 6 cosmétiques de départ (Phase 3)
export const COSMETICS = [
  {
    id: 'aura-ember',
    name: 'Aura ember',
    type: 'aura',
    rarity: 'brut',
    price: 50,
    description: 'Une lueur ambrée discrète autour de ton avatar.',
  },
  {
    id: 'titre-sans-voix',
    name: 'Le Sans-Voix',
    type: 'titre',
    rarity: 'brut',
    price: 80,
    description: 'Pour ceux qui agissent sans expliquer.',
  },
  {
    id: 'aura-glow',
    name: 'Aura glow',
    type: 'aura',
    rarity: 'forge',
    price: 200,
    description: 'Un halo doré chaud, plus profond.',
  },
  {
    id: 'titre-disciple-forge',
    name: 'Disciple de la Forge',
    type: 'titre',
    rarity: 'forge',
    price: 300,
    description: "Pour celui qui revient sans qu'on lui demande.",
  },
  {
    id: 'fond-forge-silencieuse',
    name: 'Forge silencieuse',
    type: 'fond',
    rarity: 'eveille',
    price: 600,
    description:
      'Un atelier sombre, une enclume froide. Ton Refuge change de visage.',
  },
  {
    id: 'titre-ombre-integree',
    name: "L'Ombre Intégrée",
    type: 'titre',
    rarity: 'ascendant',
    price: 1200,
    description: "Pour celui qui a fait amitié avec sa propre nuit.",
  },
]

export function findCosmeticById(id) {
  return COSMETICS.find((c) => c.id === id) ?? null
}
