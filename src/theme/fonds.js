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
  // Argent froid des sommets — pendant fond de page de la Pierre d'Ascension
  'fond-nuit-ascension': [
    'inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_#505868_0%,_transparent_60%)] opacity-[0.45]',
    'inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,_#F0F4F8_0%,_transparent_35%)] opacity-[0.15]',
    'inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(to_top,_var(--color-charcoal)_0%,_transparent_100%)] opacity-80',
  ],
}
