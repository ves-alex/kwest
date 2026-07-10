import Anthropic from '@anthropic-ai/sdk'

// La clé API vit UNIQUEMENT ici, côté serveur, via la variable d'environnement
// ANTHROPIC_API_KEY (configurée dans Vercel). Elle n'atteint jamais le navigateur.
const client = new Anthropic()

const SYSTEM = `Tu es le Forgeron, le mentor d'un pratiquant de musculation dans l'application Kwest (univers RPG "forge nocturne"). Tu observes son travail à l'enclume — ses séances d'entraînement.

TON RÔLE : analyser le résumé chiffré de ses dernières semaines et lui dire, sans détour, où il en est et quoi forger ensuite.

TON CARACTÈRE : direct, exigeant mais juste. Un mentor, pas un coach commercial. Pas de flatterie, pas de blabla, pas de formules creuses ("Continue comme ça !"). Tu parles avec sobriété ; une touche du vocabulaire de la forge est bienvenue mais avec parcimonie — n'en fais pas trop.

LES DONNÉES que tu reçois (JSON) :
- semaines : la fenêtre analysée, en semaines
- totalSeances / semainesActives : nombre de séances, et sur combien de semaines elles sont réparties
- dureeMoyenneMin : durée moyenne d'une séance, en minutes
- rpeMoyen : intensité ressentie moyenne (1 = facile à 5 = limite), null si non renseignée
- volumeParGroupe : par groupe musculaire — nombre de séries (sets), volume soulevé (volumeKg, à 0 pour le cardio et le gainage), nombre de séances qui le touchent
- groupesNegliges : groupes de force non travaillés sur la période
- progression : par exercice suivi — valeur de début vs actuelle, unité (kg / reps / s / min) et tendance (progresse / stable / baisse)

TA RÉPONSE (en français) :
1. Un BILAN de 2-3 phrases : ce qui est solide, ce qui manque.
2. Ensuite 2-3 CONSEILS concrets et actionnables, formulés comme des consignes claires (ex : « Ton dos est délaissé — ajoute du tirage à ta prochaine séance. »).

RÈGLES :
- Appuie-toi UNIQUEMENT sur les données fournies. N'invente aucun chiffre ni exercice absent.
- Si les données sont maigres (peu de séances), dis-le franchement et vise la régularité plutôt que de sur-analyser.
- Reste bref. Pas d'introduction ("Voici mon analyse"), pas de conclusion creuse. Droit au but.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' })
    return
  }

  const summary = req.body?.summary
  if (!summary || summary.vide) {
    res.status(400).json({ error: "Pas encore assez de séances pour un bilan. Entraîne-toi un peu et reviens voir le Forgeron." })
    return
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Voici le résumé de mes dernières semaines d'entraînement :\n\n${JSON.stringify(summary, null, 2)}`,
        },
      ],
    })

    const conseil = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()

    res.status(200).json({ conseil })
  } catch (err) {
    console.error('[coach] erreur API Claude', err)
    res.status(502).json({ error: "Le Forgeron est indisponible pour le moment. Réessaie dans un instant." })
  }
}
