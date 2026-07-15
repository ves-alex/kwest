import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// La clé API vit UNIQUEMENT ici, côté serveur, via la variable d'environnement
// ANTHROPIC_API_KEY (configurée dans Vercel). Elle n'atteint jamais le navigateur.
const client = new Anthropic()

// Garde-fous : l'endpoint paie des tokens Claude, on borne ce qu'un client peut envoyer.
const MAX_MESSAGES = 20
const MAX_MESSAGE_CHARS = 2000
const MAX_SUMMARY_CHARS = 20000

// Vérifie le JWT Supabase envoyé par le client. Sans token valide → null.
// On passe par l'API auth de Supabase (pas de secret supplémentaire à gérer :
// l'anon key suffit pour valider un access token utilisateur).
async function verifyUser(req) {
  const header = req.headers.authorization ?? ''
  if (!header.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
  )
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

const SYSTEM = `Tu es le Forgeron, le mentor d'un pratiquant de musculation dans l'application Kwest (univers RPG "forge nocturne"). Tu observes son travail à l'enclume — ses séances d'entraînement — et tu peux dialoguer avec lui.

TON CARACTÈRE : direct, exigeant mais juste. Un mentor, pas un coach commercial. Pas de flatterie, pas de blabla, pas de formules creuses ("Continue comme ça !"). Sobriété ; une touche du vocabulaire de la forge est bienvenue mais avec parcimonie — n'en fais pas trop.

DEUX SITUATIONS :
1. Premier message ("fais un bilan") → réponds avec un BILAN de 2-3 phrases (ce qui est solide, ce qui manque) puis 2-3 CONSEILS concrets et actionnables.
2. Question de suivi → réponds directement et précisément à SA question, en restant dans ton rôle. Sois plus bref qu'un bilan complet.

LES DONNÉES (fournies plus bas en JSON) :
- semainesAnalysees : durée RÉELLE couverte, comptée depuis la toute première séance enregistrée. L'appli est peut-être récente : si cette valeur est petite (1-2), le pratiquant vient de commencer à suivre ses séances — n'en conclus PAS qu'il est irrégulier, et ne parle jamais d'une période plus longue que ça.
- totalSeances / semainesActives : nombre de séances, et sur combien de ces semaines il s'est entraîné
- dureeMoyenneMin : durée moyenne d'une séance, en minutes
- rpeMoyen : intensité ressentie moyenne (1 = facile à 5 = limite), null si non renseignée
- volumeParGroupe : par groupe musculaire — séries (sets), volume soulevé (volumeKg, 0 pour cardio/gainage), séances qui le touchent
- groupesNegliges : groupes de force non travaillés sur la période
- progression : par exercice suivi — début vs actuel, unité (kg / reps / s / min), tendance (progresse / stable / baisse)

RÈGLES :
- Appuie-toi UNIQUEMENT sur les données fournies. N'invente aucun chiffre ni exercice absent.
- Ne juge la régularité que sur semainesAnalysees. Si cette fenêtre est courte (1-2 semaines), le pratiquant débute son suivi : encourage la constance, ne reproche pas un "manque de régularité" sur des semaines où il n'y avait pas encore de données.
- Reste bref. Pas d'introduction ("Voici mon analyse"), pas de conclusion creuse. Droit au but.
- Tu peux mettre en valeur un mot clé avec **gras** markdown, mais sans excès.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' })
    return
  }

  const user = await verifyUser(req)
  if (!user) {
    res.status(401).json({ error: 'Le Forgeron ne parle qu’aux siens. Reconnecte-toi et réessaie.' })
    return
  }

  const { summary, messages } = req.body ?? {}
  if (!summary || summary.vide) {
    res.status(400).json({ error: "Pas encore assez de séances pour un bilan. Entraîne-toi un peu et reviens voir le Forgeron." })
    return
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Conversation vide.' })
    return
  }
  if (
    messages.length > MAX_MESSAGES ||
    messages.some((m) => String(m?.content ?? '').length > MAX_MESSAGE_CHARS) ||
    JSON.stringify(summary).length > MAX_SUMMARY_CHARS
  ) {
    res.status(400).json({ error: 'Conversation trop longue. Ferme le fil et repars sur un bilan frais.' })
    return
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: `${SYSTEM}\n\n--- DONNÉES DU PRATIQUANT (JSON) ---\n${JSON.stringify(summary)}`,
      messages: messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content ?? ''),
      })),
    })

    const reponse = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()

    res.status(200).json({ reponse })
  } catch (err) {
    console.error('[coach] erreur API Claude', err)
    res.status(502).json({ error: "Le Forgeron est indisponible pour le moment. Réessaie dans un instant." })
  }
}
