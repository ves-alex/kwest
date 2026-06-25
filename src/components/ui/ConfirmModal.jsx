import { X } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  danger = false,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/85 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />

      {/* Panneau */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-forge-light bg-forge p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-cream">{title}</p>
            {message && (
              <p className="mt-1.5 text-xs leading-relaxed text-ash">{message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 text-ash transition-colors hover:text-cream"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex w-full items-center justify-center rounded-md border px-4 py-2.5 text-xs uppercase tracking-[0.25em] transition-colors ${
              danger
                ? 'border-ember bg-ember/15 text-cream hover:bg-ember/30'
                : 'border-ember bg-forge text-cream hover:bg-ember/20'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex w-full items-center justify-center rounded-md border border-forge-light bg-transparent px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-ash transition-colors hover:border-ash hover:text-cream"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
