// Styles par rareté — partagés entre Shop, FloatingBadges, etc.
export const RARITY_STYLES = {
  brut: {
    border: 'border-ash/40',
    glow: '',
    headerBg: 'bg-ash/5',
    headerBorder: 'border-ash/20',
    text: 'text-ash',
    symbol: '◇',
    badge: 'bg-ash/15 text-ash',
  },
  forge: {
    border: 'border-ember',
    glow: 'shadow-[0_0_20px_-6px_rgba(124,45,18,0.9)]',
    headerBg: 'bg-ember/10',
    headerBorder: 'border-ember/40',
    text: 'text-ember',
    symbol: '◈',
    badge: 'bg-ember/20 text-ember',
  },
  eveille: {
    border: 'border-glow',
    glow: 'shadow-[0_0_26px_-4px_rgba(146,64,14,0.85)]',
    headerBg: 'bg-glow/10',
    headerBorder: 'border-glow/40',
    text: 'text-glow',
    symbol: '✦',
    badge: 'bg-glow/20 text-glow',
  },
  ascendant: {
    border: 'border-cream/70',
    glow: 'shadow-[0_0_32px_-4px_rgba(245,240,232,0.4)]',
    headerBg: 'bg-cream/10',
    headerBorder: 'border-cream/30',
    text: 'text-cream',
    symbol: '✧',
    badge: 'bg-cream/15 text-cream',
  },
}

// Version simplifiée juste bordure + glow (pour FloatingBadges)
export const RARITY_BORDER = {
  brut: 'border-forge-light/70',
  forge: 'border-ember/80',
  eveille: 'border-glow/80',
  ascendant: 'border-cream/60',
}

export const RARITY_GLOW = {
  brut: '',
  forge: 'shadow-[0_0_14px_-4px_rgba(124,45,18,0.7)]',
  eveille: 'shadow-[0_0_18px_-4px_rgba(146,64,14,0.8)]',
  ascendant: 'shadow-[0_0_22px_-4px_rgba(245,240,232,0.35)]',
}
