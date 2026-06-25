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
  skin: 'Apparence',
  'fond-avatar': "Fond d'avatar",
}

// Gradients des fonds d'avatar (cercle derrière le personnage)
// Centre clair → fond du PNG invisible · bords sombres → fondu dans l'app
export const FOND_AVATAR_GRADIENTS = {
  // Fond de départ offert — braise (forge chaleureuse)
  default:
    'radial-gradient(circle, #F5F0E8 30%, #7C2D12 65%, #0A0908 100%)',
  'fond-avatar-abime':
    'radial-gradient(circle, #EAECF0 25%, #1A1F2E 60%, #0A0908 100%)',
  'fond-avatar-cendres':
    'radial-gradient(circle, #E8E4DC 30%, #3A3630 65%, #0A0908 100%)',
  'fond-avatar-nuit-forge':
    'radial-gradient(circle, #F5E8D0 25%, #3C1A08 60%, #0A0908 100%)',
  'fond-avatar-or-fondu':
    'radial-gradient(circle, #FFF8E0 20%, #C87830 50%, #7C2D12 75%, #0A0908 100%)',
  'fond-avatar-pierre':
    'radial-gradient(circle, #F0F4F8 20%, #505868 55%, #1A1E26 85%, #0A0908 100%)',
}

export const COSMETICS = [
  // Auras
  {
    id: 'aura-ember',
    name: 'Aura ember',
    type: 'aura',
    rarity: 'brut',
    price: 50,
    description: 'Une lueur ambrée discrète autour de ton avatar.',
  },
  {
    id: 'aura-glow',
    name: 'Aura glow',
    type: 'aura',
    rarity: 'forge',
    price: 200,
    description: 'Un halo doré chaud, plus profond.',
  },
  // Titres
  {
    id: 'titre-sans-voix',
    name: 'Le Sans-Voix',
    type: 'titre',
    rarity: 'brut',
    price: 80,
    description: 'Pour ceux qui agissent sans expliquer.',
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
    id: 'titre-ombre-integree',
    name: "L'Ombre Intégrée",
    type: 'titre',
    rarity: 'ascendant',
    price: 1200,
    description: "Pour celui qui a fait amitié avec sa propre nuit.",
  },
  // Fonds de page
  {
    id: 'fond-forge-silencieuse',
    name: 'Forge silencieuse',
    type: 'fond',
    rarity: 'eveille',
    price: 600,
    description: 'Un atelier sombre, une enclume froide. Ton Refuge change de visage.',
  },
  // Skins — toutes à 200◈, 1 offerte à l'onboarding
  {
    id: 'skin-m1',
    name: "L'Initié",
    type: 'skin',
    rarity: 'eveille',
    price: 200,
    description: "Cloak épais, regard discret. L'aventure commence ici.",
  },
  {
    id: 'skin-m2',
    name: 'Le Forgeron',
    type: 'skin',
    rarity: 'eveille',
    price: 200,
    description: "Cheveux noués, bras à l'air. La forge est sa maison.",
  },
  {
    id: 'skin-m3',
    name: 'Le Maître de Forge',
    type: 'skin',
    rarity: 'eveille',
    price: 200,
    description: "Carrure imposante, torse nu. Il n'a plus rien à prouver.",
  },
  {
    id: 'skin-f1',
    name: "L'Initiée",
    type: 'skin',
    rarity: 'eveille',
    price: 200,
    description: 'Cape ample, nattes serrées. Le premier pas est toujours le plus courageux.',
  },
  {
    id: 'skin-f2',
    name: 'La Forgeronne',
    type: 'skin',
    rarity: 'eveille',
    price: 200,
    description: 'Chignon haut, bras sculptés. Elle forge en silence.',
  },
  {
    id: 'skin-f3',
    name: 'La Maîtresse de Forge',
    type: 'skin',
    rarity: 'eveille',
    price: 200,
    description: "Armure d'épaule, regard de feu. Elle dirige la forge.",
  },
  // Fonds d'avatar — fond Braise offert par défaut (non vendu), les autres s'achètent
  {
    id: 'fond-avatar-abime',
    name: 'Abîme',
    type: 'fond-avatar',
    rarity: 'brut',
    price: 150,
    description: 'Un gouffre calme et froid. Quelque chose dort là-dedans.',
  },
  {
    id: 'fond-avatar-cendres',
    name: 'Cendres',
    type: 'fond-avatar',
    rarity: 'brut',
    price: 200,
    description: 'Ce qui reste après la combustion. Sobre. Durable.',
  },
  {
    id: 'fond-avatar-nuit-forge',
    name: 'Nuit de Forge',
    type: 'fond-avatar',
    rarity: 'forge',
    price: 400,
    description: 'La forge éteinte garde sa chaleur. Les meilleurs travaillent la nuit.',
  },
  {
    id: 'fond-avatar-or-fondu',
    name: 'Or Fondu',
    type: 'fond-avatar',
    rarity: 'eveille',
    price: 600,
    description: "L'ambre et l'or se mêlent. Réservé à ceux qui brillent.",
  },
  {
    id: 'fond-avatar-pierre',
    name: "Pierre d'Ascension",
    type: 'fond-avatar',
    rarity: 'ascendant',
    price: 1200,
    description: "Argent froid, nuit absolue. Le fond des légendes.",
  },
]

export function findCosmeticById(id) {
  return COSMETICS.find((c) => c.id === id) ?? null
}
