import { Check } from 'lucide-react'
import { RARITIES } from '../../domain/cosmetics'
import { RUNE_SYMBOL } from '../../domain/economy'
import { RARITY_STYLES } from '../../theme/rarity'
import ItemPreview from './ItemPreview'

// Carte d'un cosmétique dans l'Atelier. Affiche le bandeau de rareté, l'aperçu,
// le nom et l'état (Équipé / Possédé / prix). Réutilisée dans les rangées
// « À forger » et « Ta collection ».
export default function ShopCard({ c, player, onSelect }) {
  const style = RARITY_STYLES[c.rarity]
  const rarity = RARITIES[c.rarity]
  const isOwned = player.cosmeticsOwned.includes(c.id)
  const isEquipped = player.cosmeticsEquipped?.[c.type] === c.id

  return (
    <button
      type="button"
      onClick={() => onSelect(c)}
      className={`relative w-[136px] shrink-0 overflow-hidden rounded-2xl border-2 bg-forge text-left transition-all active:scale-95 ${
        isEquipped ? 'border-glow' : style.border
      } ${!isOwned ? style.glow : ''}`}
    >
      {/* Bandeau rareté */}
      <div
        className={`flex items-center justify-center gap-1.5 border-b py-1.5 ${style.headerBg} ${style.headerBorder}`}
      >
        <span className={`text-[10px] leading-none ${style.text}`}>{style.symbol}</span>
        <span className={`text-[8px] font-medium uppercase tracking-[0.3em] ${style.text}`}>
          {rarity.label}
        </span>
      </div>

      {/* Preview */}
      <div className="flex min-h-[96px] flex-col items-center justify-center px-3 pt-3 pb-2">
        <ItemPreview c={c} player={player} size="sm" />
      </div>

      {/* Nom + prix / état */}
      <div className="border-t border-forge-light/40 px-3 py-2">
        <p className="line-clamp-2 min-h-[26px] text-[11px] font-medium leading-tight text-cream">
          {c.name}
        </p>
        <div className="mt-1.5">
          {isEquipped ? (
            <span className="flex items-center gap-1 text-glow">
              <Check size={10} strokeWidth={2.5} />
              <span className="text-[9px] font-medium uppercase tracking-[0.15em]">Équipé</span>
            </span>
          ) : isOwned ? (
            <span className="text-[9px] uppercase tracking-[0.15em] text-ash/60">Possédé</span>
          ) : (
            <span className="font-mono text-[11px] font-medium text-ember">
              {RUNE_SYMBOL} {c.price}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
