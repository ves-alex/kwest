import { useState } from 'react'
import { initPlayerGender } from '../storage/player'

const SKINS = {
  M: [
    { id: 'skin-m1', label: "L'Initié" },
    { id: 'skin-m2', label: 'Le Forgeron' },
    { id: 'skin-m3', label: 'Le Maître de Forge' },
  ],
  F: [
    { id: 'skin-f1', label: "L'Initiée" },
    { id: 'skin-f2', label: 'La Forgeronne' },
    { id: 'skin-f3', label: 'La Maîtresse de Forge' },
  ],
}
SKINS.O = [...SKINS.M, ...SKINS.F]

const STARTER = { M: 'skin-m1', F: 'skin-f1', O: 'skin-m1' }

const GENDERS = [
  { key: 'M', label: 'Homme' },
  { key: 'F', label: 'Femme' },
  { key: 'O', label: 'Autre' },
]

export default function Onboarding({ onComplete }) {
  const [gender, setGender] = useState(null)
  const [selectedSkin, setSelectedSkin] = useState(null)

  const handleGender = (g) => {
    setGender(g)
    setSelectedSkin(STARTER[g])
  }

  const handleConfirm = () => {
    if (!gender || !selectedSkin) return
    const player = initPlayerGender(gender, selectedSkin)
    onComplete(player)
  }

  const skins = gender ? SKINS[gender] : []
  const canConfirm = !!gender && !!selectedSkin

  return (
    <div
      className="flex min-h-screen flex-col bg-charcoal"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
        {/* Branding */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.5em] text-ash">bienvenue dans</p>
          <h1 className="mt-2 font-display text-6xl uppercase tracking-[0.2em] text-cream">
            Kwest
          </h1>
          <p className="mt-6 text-[11px] uppercase tracking-[0.4em] text-ash">
            choisis ta voie
          </p>
        </div>

        {/* Sélection genre */}
        <div className="mt-10 flex gap-3">
          {GENDERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleGender(key)}
              className={`flex-1 rounded-xl border py-3.5 text-xs uppercase tracking-[0.2em] transition-all ${
                gender === key
                  ? 'border-ember bg-ember/15 text-cream shadow-[0_0_20px_-8px_rgba(124,45,18,0.9)]'
                  : 'border-forge-light bg-forge text-ash hover:border-ember/60 hover:text-cream'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Skins disponibles */}
        {gender && (
          <>
            <p className="mt-8 text-center text-[10px] uppercase tracking-[0.3em] text-ash">
              {gender === 'O' ? 'choisis ton avatar de départ' : 'avatar de départ'}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {skins.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedSkin(id)}
                  className={`overflow-hidden rounded-xl border transition-all ${
                    selectedSkin === id
                      ? 'border-ember shadow-[0_0_20px_-6px_rgba(124,45,18,0.85)]'
                      : 'border-forge-light hover:border-ember/50'
                  }`}
                >
                  <div className="bg-forge">
                    <img
                      src={`/avatars/${id}.png`}
                      alt={label}
                      className="h-auto w-full"
                      style={{ imageRendering: 'pixelated', filter: 'url(#kw-remove-white)' }}
                    />
                  </div>
                  <div className="border-t border-forge-light bg-charcoal px-1 py-1.5 text-center text-[8px] uppercase leading-tight tracking-[0.1em] text-ash">
                    {label}
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[9px] uppercase tracking-[0.15em] text-ash/50">
              offert au départ · les autres s'achètent à l'Atelier
            </p>
          </>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className={`mt-10 w-full rounded-md border px-6 py-3.5 text-sm uppercase tracking-[0.3em] transition-all ${
            canConfirm
              ? 'border-ember bg-forge text-cream hover:bg-ember/20 hover:shadow-[0_0_24px_-8px_rgba(146,64,14,0.8)] active:scale-95'
              : 'cursor-not-allowed border-forge-light bg-forge/40 text-ash/30'
          }`}
        >
          Entrer dans la Forge
        </button>
      </div>
    </div>
  )
}
