// Couches visuelles des fonds de page (cosmétiques type 'fond').
// Chaque fond = liste de couches ; Layout les rend en fixed plein viewport,
// ItemPreview en absolute dans une miniature. Utiliser uniquement des unités
// relatives (%, gradients) pour que le même style serve aux deux échelles.
// Ajouter un fond ici + son item dans cosmetics.js suffit.
export const FOND_STYLES = {
  'fond-forge-silencieuse': [
    'inset-0 bg-[radial-gradient(ellipse_at_50%_95%,_var(--color-ember)_0%,_transparent_55%)] opacity-[0.5]',
    'inset-x-0 top-0 h-[30%] bg-[linear-gradient(to_bottom,_var(--color-charcoal)_0%,_transparent_100%)] opacity-80',
  ],
}
