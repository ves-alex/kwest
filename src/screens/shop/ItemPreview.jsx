import { RARITIES, FOND_AVATAR_GRADIENTS } from '../../domain/cosmetics'

// Preview visuel d'un cosmétique — utilisé dans les cards du shop et dans la sheet de détail.
export default function ItemPreview({ c, player, size = 'sm' }) {
  const smDim = size === 'sm'

  if (c.type === 'skin') {
    const dim = smDim ? 'h-16 w-16' : 'h-24 w-24'
    return (
      <div
        className={`${dim} relative overflow-hidden rounded-full border border-ember/30`}
        style={{
          background:
            FOND_AVATAR_GRADIENTS[player.cosmeticsEquipped?.['fond-avatar']] ??
            FOND_AVATAR_GRADIENTS.default,
        }}
      >
        <img
          src={`/avatars/${c.id}.png`}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    )
  }

  if (c.type === 'badge') {
    const dim = smDim ? 'h-16 w-16' : 'h-24 w-24'
    return (
      <div className={`${dim} relative overflow-hidden rounded-full border-2 border-forge-light/60 bg-charcoal/75`}>
        <img
          src={`/avatars/${c.id}.png`}
          alt=""
          className="absolute inset-0 h-full w-full object-contain p-1"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    )
  }

  if (c.type === 'fond-avatar') {
    const dim = smDim ? 'h-14 w-14' : 'h-20 w-20'
    return (
      <div
        className={`${dim} rounded-full border border-forge-light/60`}
        style={{ background: FOND_AVATAR_GRADIENTS[c.id] }}
      />
    )
  }

  if (c.type === 'aura') {
    const colors = {
      brut: '#d97706',
      forge: '#c2410c',
      eveille: '#b45309',
      ascendant: '#f5f0e8',
    }
    const color = colors[c.rarity] ?? '#d97706'
    const s = smDim ? 56 : 72
    return (
      <svg width={s} height={s} viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="24" fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" />
        <circle cx="28" cy="28" r="17" fill="none" stroke={color} strokeWidth="1" opacity="0.35" />
        <circle cx="28" cy="28" r="10" fill="none" stroke={color} strokeWidth="1.5" opacity="0.55" />
        <circle cx="28" cy="28" r="5" fill={color} opacity="0.45" />
      </svg>
    )
  }

  if (c.type === 'titre') {
    const colorClass = RARITIES[c.rarity].color
    const textSize = smDim ? 'text-[9px]' : 'text-xs'
    return (
      <div
        className={`flex ${smDim ? 'h-14 w-full' : 'h-20 w-full'} items-center justify-center rounded-lg border border-forge-light/30 bg-charcoal/40 px-2`}
      >
        <p className={`text-center ${textSize} font-medium italic leading-snug tracking-wide ${colorClass}`}>
          « {c.name} »
        </p>
      </div>
    )
  }

  // fond de page
  const colorClass = RARITIES[c.rarity].color
  return (
    <div
      className={`flex ${smDim ? 'h-14 w-full' : 'h-20 w-full'} items-center justify-center rounded-lg border border-forge-light/30 bg-charcoal/60`}
    >
      <p className={`text-[9px] uppercase tracking-[0.25em] ${colorClass}`}>Fond</p>
    </div>
  )
}
