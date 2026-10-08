import { Component } from 'react'

// Dernier filet : une erreur d'affichage (typiquement un écran d'une ancienne
// version introuvable après un déploiement) ne laisse plus un écran noir,
// mais un bouton pour recharger. La séance en cours vit dans le stockage local.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[kwest] écran planté', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-charcoal px-6 text-center">
        <p className="font-display text-3xl tracking-widest text-ember">kwest</p>
        <p className="mt-6 max-w-xs text-sm text-ash">
          La forge a trébuché. Recharge l’app pour reprendre : ta séance en cours est conservée.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 min-h-11 rounded-md border border-ember bg-forge px-6 py-3 text-xs uppercase tracking-[0.25em] text-cream transition-colors hover:bg-ember/20"
        >
          Recharger
        </button>
      </div>
    )
  }
}
