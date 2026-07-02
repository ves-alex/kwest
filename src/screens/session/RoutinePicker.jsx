import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { X, Plus, Trash2, Pencil } from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { findExerciseById } from '../../domain/exercises'
import { loadRoutines, saveRoutine, deleteRoutine } from '../../storage/routines'

export default function RoutinePicker({ isOpen, routines, onClose, onStart, onChange }) {
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const confirmDelete = () => {
    if (!pendingDeleteId) return
    deleteRoutine(pendingDeleteId)
    onChange?.(loadRoutines())
    setPendingDeleteId(null)
  }

  const handleRename = (id, newName) => {
    const r = routines.find((rt) => rt.id === id)
    if (!r) return
    saveRoutine({ ...r, name: newName.trim() || r.name })
    onChange?.(loadRoutines())
    setEditingId(null)
    setEditingName('')
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-charcoal/80 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 36 }}
              className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-3xl border-t border-forge-light bg-forge px-6 pb-16 pt-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.3em] text-ash">Mes routines</p>
                <div className="flex items-center gap-2">
                  <Link
                    to="/routines/new"
                    onClick={onClose}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-forge-light text-ash transition-colors hover:border-ember hover:text-ember"
                    aria-label="Créer une routine"
                  >
                    <Plus size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-forge-light text-ash transition-colors hover:border-ember hover:text-ember"
                    aria-label="Fermer"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              <ul className="space-y-2">
                {routines.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    {editingId === r.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleRename(r.id, editingName)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(r.id, editingName)
                          if (e.key === 'Escape') { setEditingId(null); setEditingName('') }
                        }}
                        className="flex-1 rounded-xl border border-ember bg-charcoal/40 px-4 py-3 text-sm text-cream focus:outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => onStart(r)}
                        className="flex min-w-0 flex-1 flex-col rounded-xl border border-forge-light bg-charcoal/40 px-4 py-3 text-left transition-colors hover:border-ember"
                      >
                        <p className="text-sm font-medium text-cream">{r.name}</p>
                        <p className="mt-0.5 text-[10px] text-ash/60">
                          {r.exerciseIds.length} exercice{r.exerciseIds.length > 1 ? 's' : ''}
                          {' · '}
                          {r.exerciseIds
                            .slice(0, 2)
                            .map((id) => findExerciseById(id)?.name ?? id)
                            .join(', ')}
                          {r.exerciseIds.length > 2 ? '…' : ''}
                        </p>
                      </button>
                    )}
                    {editingId !== r.id && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setEditingId(r.id); setEditingName(r.name) }}
                          className="shrink-0 text-ash/40 transition-colors hover:text-cream"
                          aria-label={`Renommer ${r.name}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(r.id)}
                          className="shrink-0 text-ash/40 transition-colors hover:text-ember"
                          aria-label={`Supprimer ${r.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!pendingDeleteId}
        title="Supprimer cette routine ?"
        message="Cette routine sera définitivement supprimée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  )
}
