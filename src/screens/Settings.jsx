import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, LogOut, Trash2 } from 'lucide-react'
import { loadPlayer, setGender, setWeeklyGoal } from '../storage/player'
import { supabase } from '../lib/supabase'
import { deleteAccount } from '../lib/sync'
import ConfirmModal from '../components/ui/ConfirmModal'

const GENDERS = [
  { key: 'M', label: 'Homme' },
  { key: 'F', label: 'Femme' },
  { key: 'O', label: 'Autre' },
]

const APP_VERSION = '0.1.0'

export default function Settings() {
  const [player, setPlayer] = useState(loadPlayer)
  const [authUser, setAuthUser] = useState(null)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthUser(data.user ?? null))
  }, [])

  const handleLogout = async () => {
    setConfirmLogout(false)
    const { error } = await supabase.auth.signOut()
    if (!error) localStorage.clear()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteAccount()
    } catch {
      setDeleting(false)
    }
  }

  const goal = player.weeklyGoal ?? 3

  return (
    <div className="px-6 py-6">
      <header className="mx-auto max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-ash transition-colors hover:text-cream"
        >
          <ChevronLeft size={14} />
          Refuge
        </Link>
        <div className="mt-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-ash">réglages</p>
          <h1 className="mt-3 font-display text-3xl uppercase tracking-[0.15em] text-cream sm:text-4xl">
            Paramètres
          </h1>
        </div>
      </header>

      <section className="mx-auto mt-10 max-w-md space-y-6">
        {/* Profil */}
        <div className="rounded-2xl border border-forge-light bg-forge p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ash">Profil</p>

          <p className="mt-4 text-[9px] uppercase tracking-[0.25em] text-ash/50">Sexe</p>
          <div className="mt-2 flex gap-2">
            {GENDERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setPlayer(setGender(key))}
                className={`flex-1 rounded-md border py-2 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                  player.gender === key
                    ? 'border-ember bg-ember/15 text-cream'
                    : 'border-forge-light bg-transparent text-ash hover:border-ash/60'
                }`}
                aria-pressed={player.gender === key}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[9px] text-ash/50">
            Change juste ton profil ; ton avatar équipé n'est pas touché.
          </p>
        </div>

        {/* Objectifs */}
        <div className="rounded-2xl border border-forge-light bg-forge p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ash">Objectifs</p>

          <p className="mt-4 text-[9px] uppercase tracking-[0.25em] text-ash/50">
            Séances par semaine
          </p>
          <div className="mt-2 flex items-center gap-2">
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPlayer(setWeeklyGoal(n))}
                className={`h-9 w-9 rounded-full border font-mono text-xs transition-colors ${
                  goal === n
                    ? 'border-ember bg-ember/15 text-cream'
                    : 'border-forge-light bg-transparent text-ash hover:border-ash/60'
                }`}
                aria-pressed={goal === n}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[9px] text-ash/50">
            Détermine ta progression hebdo sur le Refuge.
          </p>
        </div>

        {/* Compte */}
        <div className="rounded-2xl border border-forge-light bg-forge p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ash">Compte</p>

          {authUser && (
            <div className="mt-4 flex items-center gap-3">
              {authUser.user_metadata?.avatar_url ? (
                <img
                  src={authUser.user_metadata.avatar_url}
                  alt={authUser.user_metadata?.full_name ?? 'Photo de profil'}
                  className="h-10 w-10 rounded-full border border-forge-light"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-forge-light bg-charcoal text-sm text-ash">
                  {authUser.email?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm text-cream">
                  {authUser.user_metadata?.full_name ?? authUser.email}
                </p>
                <p className="truncate text-[10px] text-ash/60">{authUser.email}</p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-forge-light bg-transparent px-4 py-2.5 text-[11px] uppercase tracking-[0.25em] text-ash transition-colors hover:border-ember hover:text-ember"
            >
              <LogOut size={12} />
              Se déconnecter
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-ember/40 bg-transparent px-4 py-2.5 text-[11px] uppercase tracking-[0.25em] text-ember transition-colors hover:border-ember hover:bg-ember/10"
            >
              <Trash2 size={12} />
              Supprimer mon compte
            </button>
          </div>
        </div>

        {/* Application */}
        <div className="rounded-2xl border border-forge-light bg-forge p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ash">Application</p>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-ash">Version</span>
            <span className="font-mono text-xs text-cream">{APP_VERSION}</span>
          </div>
        </div>
      </section>

      <ConfirmModal
        isOpen={confirmLogout}
        title="Se déconnecter ?"
        message="Tu pourras te reconnecter avec le même compte Google. Ta progression est sauvegardée dans le cloud."
        confirmLabel="Se déconnecter"
        cancelLabel="Annuler"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />

      <ConfirmModal
        isOpen={confirmDelete}
        title="Supprimer ton compte ?"
        message={
          deleting
            ? 'Suppression en cours…'
            : "Toutes tes séances, runes et badges seront définitivement effacés du cloud. Si tu te reconnectes plus tard avec le même Google, tu repartiras de zéro. Cette action est irréversible."
        }
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
        danger
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmDelete(false)}
      />
    </div>
  )
}
