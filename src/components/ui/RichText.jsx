// Rendu léger du texte du Forgeron : **gras** + sauts de ligne préservés.
// Volontairement minimal (pas de dépendance markdown) — le contenu attendu est
// du texte avec un peu de gras et des listes numérotées en clair.
export default function RichText({ text, className = '' }) {
  const parts = String(text ?? '').split(/(\*\*[^*]+?\*\*)/g)
  return (
    <span className={`whitespace-pre-line ${className}`}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i} className="font-semibold text-cream">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  )
}
