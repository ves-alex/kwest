import { useState } from 'react'
import { Star } from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { RUNE_SYMBOL, PRESTIGE_STAR_COST } from '../../domain/economy'
import { forgePrestigeStar } from '../../storage/player'

// Section Prestige de l'Atelier : forge d'Étoiles permanentes, répétable.
// Le débouché des runes excédentaires une fois la collection complète.
export default function PrestigeForge({ player, balance, onForged }) {
  const [confirming, setConfirming] = useState(false)
  const stars = player.prestigeStars ?? 0
  const affordable = balance >= PRESTIGE_STAR_COST

  const confirm = () => {
    const next = forgePrestigeStar(PRESTIGE_STAR_COST)
    if (next) onForged(next)
    setConfirming(false)
  }

  return (
    <section>
      <p className="text-[9px] uppercase tracking-[0.35em] text-ash/60">Prestige</p>

      <div className="mt-3 rounded-2xl border-2 border-glow/40 bg-forge p-5 shadow-[0_0_24px_-8px_var(--color-glow)]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-glow/50 bg-charcoal/60">
            <Star size={18} className="text-glow" fill="currentColor" />
          </span>
          <div>
            <p className="font-display text-lg uppercase tracking-[0.15em] text-cream">
              Étoile de forge
            </p>
            <p className="font-mono text-xs text-glow">
              {PRESTIGE_STAR_COST} {RUNE_SYMBOL}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ash">
          Sacrifie tes runes au feu de la forge et grave une étoile permanente à
          ton nom. Sans limite — chaque étoile témoigne d'un cycle d'effort
          accompli.
        </p>

        {stars > 0 && (
          <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-glow">
            étoiles forgées · {stars}
          </p>
        )}

        <button
          type="button"
          disabled={!affordable}
          onClick={() => setConfirming(true)}
          className={`mt-4 w-full rounded-xl border py-3 text-[10px] uppercase tracking-[0.25em] transition-colors ${
            affordable
              ? 'border-glow bg-glow/15 text-cream hover:bg-glow/25'
              : 'cursor-not-allowed border-forge-light text-ash/50'
          }`}
        >
          {affordable
            ? `Forger une étoile · ${PRESTIGE_STAR_COST} ${RUNE_SYMBOL}`
            : `Il te manque ${PRESTIGE_STAR_COST - balance} ${RUNE_SYMBOL}`}
        </button>
      </div>

      <ConfirmModal
        isOpen={confirming}
        title="Forger une Étoile de forge ?"
        message={`${PRESTIGE_STAR_COST} ${RUNE_SYMBOL} seront sacrifiées. L'étoile est permanente et s'affichera sur ton Refuge.`}
        confirmLabel={`Forger · ${PRESTIGE_STAR_COST} ${RUNE_SYMBOL}`}
        cancelLabel="Annuler"
        onConfirm={confirm}
        onCancel={() => setConfirming(false)}
      />
    </section>
  )
}
