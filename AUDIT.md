# Audit de kwest — 7 octobre 2026

> **État général :** les bases sont saines (lint 0 erreur, 94 tests verts, build OK, aucun secret exposé, logique de jeu bien testée), et les phases 1 à 4 et 6 sont livrées. Mais la fiabilité des données et l'usage réel à la salle ont des trous sérieux : **6 problèmes critiques, 16 importants**.
>
> **Urgence 1 :** borner la facture du Forgeron (plafond de dépense Anthropic dès aujourd'hui, puis un quota par joueur) et contrôler dans Supabase les règles d'accès de la table `user_data`.
>
> **Urgence 2 :** arrêter les altérations silencieuses des données : la « migration » qui valide à chaque lancement les séries non cochées, et la chaîne de semaines qui casse au changement d'heure du **25 octobre**.
>
> **Urgence 3 :** rendre l'app fiable à la salle et ne plus perdre de données. Il faut qu'elle s'ouvre hors ligne sur les données du téléphone, qu'elle ne reste plus sur un écran vide après une mise à jour, que les routines soient sauvegardées en ligne et que la déconnexion n'efface plus rien de précieux.

---

## Sommaire

1. [Comment l'audit a été fait](#1-comment-laudit-a-été-fait)
2. [Résultats réels des commandes](#2-résultats-réels-des-commandes)
3. [Tableau des problèmes](#3-tableau-des-problèmes) : [critiques](#critiques), [importants](#importants), [mineurs](#mineurs)
4. [À tester sur un vrai iPhone](#4-à-tester-sur-un-vrai-iphone)
5. [Tests et CI : ce qui est couvert](#5-tests-et-ci--ce-qui-est-couvert)
6. [Avancement des phases](#6-avancement-des-phases)
7. [Charte visuelle : bilan et questions](#7-charte-visuelle--bilan-et-questions)
8. [Ce qui va bien](#8-ce-qui-va-bien)
9. [Ce qui n'a pas pu être vérifié](#9-ce-qui-na-pas-pu-être-vérifié)
10. [Plan d'action](#10-plan-daction)

---

## 1. Comment l'audit a été fait

- **Code audité :** commit `f0ddf7d` (branche `main`, 23/09/2026), soit 96 commits du 17/06 au 23/09.
- **Neuf axes, analysés en parallèle par sept auditeurs :**
  - logique métier ;
  - synchronisation ;
  - sécurité ;
  - PWA/iPhone et performance (un seul auditeur pour les deux) ;
  - qualité du code et tests/CI (un seul auditeur pour les deux) ;
  - charte visuelle, avec l'agent `kwest-design-guard` ;
  - avancement des phases.
- **Vérification indépendante :** chaque problème grave a ensuite été repris par **un vérificateur neuf**, qui n'avait pas vu les rapports et devait chercher ce qui le rendrait faux. N'ont été gardés que les problèmes confirmés. Deux affirmations ont été corrigées en route :
  - une panne de Supabase ne fait pas planter l'API du Forgeron ; elle renvoie un message trompeur (voir M2) ;
  - le message `SIGNED_IN` ne revient à chaque retour dans l'app que pendant la première heure.
- **Preuves :** la plupart des scénarios ont été **rejoués avec le vrai code**, de trois façons :
  - le code de `src/` avec un faux Supabase qui garde ses données ;
  - le vrai SDK Supabase avec un réseau simulé ;
  - l'app construite, ouverte dans Chromium avec le vrai service worker.
  Les calculs de dates ont été lancés en heure de Paris (`TZ=Europe/Paris`) et comparés en UTC.
- **Aucun fichier du projet n'a été modifié.** `npm install` avait réécrit `package-lock.json` (écart de version de npm, voir §2). Ce fichier a été remis dans son état d'origine. Les scripts de preuve sont restés hors du dépôt, dans le dossier temporaire de la session.
- **Colonne « Preuve » des tableaux :**
  - **Exécuté** : scénario rejoué avec le vrai code. « ×2 » ou « ×3 » indique le nombre d'auditeurs indépendants qui l'ont confirmé.
  - **Mesuré** : tailles ou durées mesurées dans Chromium.
  - **Lu** : constaté en lisant le code, à la ligne citée.
  - **À vérifier** : dépend d'un réglage hors du dépôt (Supabase, Vercel, Anthropic) ou d'un vrai iPhone.

## 2. Résultats réels des commandes

| Commande | Résultat |
|---|---|
| `npm install` | OK : 473 paquets ajoutés. **11 vulnérabilités signalées** (3 modérées, 8 élevées), aucune exploitable dans l'app (voir M17). Le lockfile a été réécrit (81 lignes `libc` retirées) parce que la machine d'audit a npm 10 alors que le lockfile vient de npm 11 / Node 24. Le fichier a été remis en l'état. Ce n'est pas un défaut du projet. |
| `npm run lint` | OK : **0 erreur, 0 avertissement** (code de sortie 0). |
| `npm test` | OK : **9 fichiers, 94 tests, 94 réussis** (Vitest 4.1.10, 1,07 s). |
| `npm run build` | OK en 1,24 s. Code chargé au démarrage : `index` 474 kB (144 kB compressé) et `supabase` 201 kB (51 kB compressé). Écrans secondaires découpés : `Stats` 34 kB, `Shop` 13 kB… Le service worker met en cache à l'installation **45 fichiers, 1 140 KiB**. |
| CI GitHub | Dernière exécution (n° 13, commit `f0ddf7d`) **en succès**. |

## 3. Tableau des problèmes

Les numéros (C = critique, I = important, M = mineur) servent de référence dans le plan d'action.

### Critiques

Un problème est critique s'il entraîne une perte de données réaliste, une facture sans plafond, une faille d'accès aux données, ou s'il rend l'app inutilisable dans son usage principal.

| # | Problème | Où | Pourquoi c'est un problème | Correction proposée | Preuve |
|---|---|---|---|---|---|
| C1 | **Le Forgeron n'a aucune limite d'usage : la facture Claude n'a pas de plafond** | `api/coach.js:57-108`. Ni compteur par joueur, ni compteur par jour, ni compteur global. Pas de `vercel.json`. | N'importe qui peut obtenir un compte (un compte Google suffit a priori) puis appeler `/api/coach` en boucle avec un script. Chaque appel déclenche un appel Claude payant.<br>• Requête maximale acceptée : environ 63 500 caractères.<br>• Coût par appel : environ 0,005 à 0,07 $.<br>• Une seule boucle fait environ 10 000 appels par jour, soit **plusieurs centaines de $ par jour**, et davantage en parallèle.<br>Les seuls freins sont les limites réglées dans la console Anthropic, que le dépôt ne montre pas. | 1. **Aujourd'hui, sans code :** dans la console Anthropic, créer une clé dédiée à kwest avec un plafond de dépense mensuel bas (10 à 20 $) et des alertes.<br>2. Quota par joueur et par jour (ex. 20 appels), dans une table `coach_usage` incrémentée par une fonction SQL atomique. Ajouter un plafond global. Répondre 429 au-delà.<br>3. Désactiver dans Supabase les inscriptions email/anonymes si seul Google est prévu. | Exécuté ×2 : 200 requêtes envoyées, 200 acceptées. Coûts estimés avec les tarifs Haiku 4.5 approximatifs. |
| C2 | **Les règles d'accès (RLS) de la table `user_data` ne sont nulle part dans le dépôt** | `supabase/` ne contient que `sessions-table.sql`. `user_data` est utilisée par `src/lib/sync.js:121,143,176,196,280`. | La clé Supabase présente dans l'app est publique par conception. Seules les règles RLS empêchent un inconnu de lire ou modifier les profils. Si elles manquent sur `user_data`, n'importe qui peut lire ou effacer les données de **tous** les joueurs. Le code ne permet pas de le savoir. *(La table `sessions`, elle, est correctement protégée.)* | Cinq minutes dans le dashboard Supabase :<br>• menu Advisors → Security Advisor ;<br>• vérifier que la RLS est activée sur `user_data` ;<br>• vérifier des règles `auth.uid() = id` en lecture, création, modification et suppression.<br>Ensuite, versionner le script de la table dans `supabase/`. | À vérifier. Critique seulement si la RLS manque. Absence dans le dépôt confirmée ×2. |
| C3 | **Hors ligne, l'app peut refuser de s'ouvrir : écran « kwest » pendant environ 25 s, puis écran de connexion** | `src/App.jsx:38-42` : une session vide envoie sur Login. `src/App.jsx:44` : l'app attend le cloud avant d'afficher quoi que ce soit. `src/App.jsx:54-64` : l'événement `TOKEN_REFRESHED` n'est pas écouté. | Le jeton de connexion Supabase expire au bout d'1 h (réglage par défaut). Scénario : tu ouvres l'app à la salle, sans réseau, plus d'une heure après la dernière utilisation. Supabase ne peut pas renouveler le jeton, et l'app affiche « Continuer avec Google », impossible hors ligne. Pourtant toutes tes données sont sur le téléphone. Au retour du réseau, l'écran ne se débloque pas tout seul (toujours sur Login après plus de 100 s).<br>Même avec un jeton valide, il faut environ 7 s d'attente hors ligne, et plus de 45 s si le réseau répond mal (aucun délai maximum). | • Si un profil local existe, afficher tout de suite les données du téléphone et synchroniser en arrière-plan.<br>• N'afficher Login que si le serveur refuse vraiment la connexion, pas en cas d'erreur réseau.<br>• Écouter `TOKEN_REFRESHED`.<br>• Fixer un délai maximum sur les requêtes. | Exécuté ×4 avec le vrai SDK Supabase : 25,5 à 25,9 s puis Login ; 7,0 à 7,2 s avec un jeton valide. |
| C4 | **Après chaque déploiement, l'app peut afficher un écran entièrement vide** | `vite.config.js:11` (`registerType: 'autoUpdate'`). Écrans chargés à la demande : `src/App.jsx:14-21`. Aucun ErrorBoundary ni gestion de `vite:preloadError` dans `src/`. | La nouvelle version s'installe en silence et efface les fichiers de l'ancienne, mais l'ancienne reste affichée. Au premier tap sur Chroniques, Atelier, Paramètres, le détail d'une séance ou « Ajouter un exercice », l'app réclame un fichier qui n'existe plus. React efface alors tout l'écran : écran noir, sans barre d'onglets. Il faut tuer et relancer l'app. La séance en cours, elle, est conservée. Cela arrive à la première ouverture après presque chaque déploiement. | • Dans `main.jsx`, écouter `vite:preloadError` et recharger la page, avec une garde contre les boucles de rechargement.<br>• Ajouter un ErrorBoundary global avec un bouton « Recharger ».<br>• Gérer la mise à jour avec `virtual:pwa-register` : recharger au retour au premier plan, ou afficher un bandeau « Nouvelle version ». | Exécuté ×2 dans Chromium avec le vrai service worker : 404 sur l'ancien fichier, puis `#root` vide. Reproduit aussi en pleine séance avec « Ajouter un exercice ». |
| C5 | **Une « migration » rejouée à chaque lancement valide les séries que tu n'as pas cochées** | `src/storage/sessions.js:11-39` : aucun drapeau « déjà faite ». Appelée dans `src/App.jsx:45` et `:57`. Les séries sont créées avec `validated:false` (`src/storage/sessions.js:176`) et pré-remplies (`src/screens/Session.jsx:105-110`). | Cette migration était prévue pour tourner une seule fois, en juillet. En réalité elle tourne à chaque ouverture et à chaque retour dans l'app. Toute série saisie mais **non cochée** d'une séance terminée devient « validée ». Conséquences :<br>• runes en trop ;<br>• faux records ;<br>• 1RM et données du Forgeron faussés.<br>La modification part au cloud : on ne peut plus savoir quelles séries ont vraiment été faites. Exemple rejoué : runes 14 → 38, record 60 → 100 kg. La règle « seules les séries ✓ comptent » ne tient que jusqu'au lancement suivant. | La rendre vraiment unique, au choix :<br>• un drapeau `kwest:migrations` en local ;<br>• ne traiter que les séances terminées avant le 02/07/2026 (commit `8955dd7`).<br>Quelques lignes à changer. **À faire en premier**, car chaque jour qui passe abîme l'historique. | Exécuté ×4 |
| C6 | **Les routines ne sont jamais sauvegardées en ligne, et la déconnexion efface tout le téléphone sans rien vérifier** | `src/storage/routines.js:3` : la clé n'est pas utilisée par `src/lib/sync.js`. `src/screens/Settings.jsx:28-32` appelle `localStorage.clear()`. Message faux : `src/screens/Settings.jsx:179`. | Les routines sont perdues à coup sûr si tu te déconnectes, changes de téléphone, ou passes de Safari à l'app installée (sur iPhone, les deux ont des stockages séparés).<br>La déconnexion efface aussi :<br>• la séance en cours ;<br>• les suppressions en attente (les séances supprimées reviennent) ;<br>• toute séance pas encore envoyée.<br>La fenêtre de confirmation affirme pourtant « Ta progression est sauvegardée dans le cloud ». | • Synchroniser les routines, dans une colonne JSON de `user_data` ou une table dédiée, avec fusion par identifiant.<br>• Avant de déconnecter, tenter un renvoi complet.<br>• Bloquer ou avertir s'il reste des données en attente ou une séance en cours. | Exécuté ×2 |

### Importants

Un problème est important s'il provoque un bug visible en usage normal, une perte de données dans un cas moins courant, ou une gêne réelle sur iPhone.

| # | Problème | Où | Pourquoi c'est un problème | Correction proposée | Preuve |
|---|---|---|---|---|---|
| I1 | **La chaîne de semaines casse à chaque changement d'heure. Prochain changement : dimanche 25 octobre 2026** | `src/domain/streak.js:4,37,41,50` ; badge « 4 semaines » dans `src/domain/badges.js:116` | Le code suppose qu'une semaine dure toujours 168 h. La semaine du changement d'heure en fait 167 ou 169. Conséquences à Paris :<br>• la chaîne retombe à 1, ou à 0 le lundi matin ;<br>• le record est faux ;<br>• le badge « 4 semaines » est retardé ;<br>• le Forgeron reçoit une chaîne fausse.<br>Exemple : 4 semaines d'affilée du 7 au 28 octobre donnent une chaîne de 1 au lieu de 4. Une chaîne ne peut jamais dépasser environ 31 semaines. La CI tourne en UTC, elle ne voit rien. | • Comparer des semaines calendaires (clé = date locale du lundi), ou arrondir l'écart (`Math.round(écart / semaine)`).<br>• Reculer d'une semaine avec `setDate(d.getDate() - 7)`.<br>• Une seule fonction « clé de semaine », réutilisée partout : le calcul du lundi existe en 5 copies.<br>• Ajouter un test en `TZ=Europe/Paris` autour de fin mars et fin octobre. | Exécuté ×4 |
| I2 | **Une modification faite hors ligne sur une séance déjà sauvegardée peut être annulée sans prévenir** | `src/lib/sync.js:19` : l'échec n'est gardé qu'en mémoire. `src/lib/sync.js:80,124` : un succès efface l'échec d'un autre envoi. `src/lib/sync.js:209,217` : le cloud gagne toujours, `updated_at` n'est jamais lu. | Scénario :<br>1. Sans réseau, tu corriges la durée d'une séance.<br>2. Le badge « Non synchronisé » s'affiche.<br>3. iOS ferme l'app.<br>4. Au lancement suivant, l'ancienne version du cloud revient.<br>Même effet si un autre envoi réussit juste après : le badge disparaît et le renvoi automatique ne se fait jamais. C'est vrai aussi pour l'objectif hebdo et l'équipement du profil. | • Garder en local une file d'attente persistante des éléments « à renvoyer », vidée seulement après confirmation du cloud.<br>• À la fusion, la version locale en attente gagne (ou la plus récente, via un `updatedAt` dans les données).<br>• Calculer l'état du badge à partir de cette file. | Exécuté ×3 |
| I3 | **Nouveau téléphone et premier chargement raté : le profil sauvegardé est écrasé** | `src/App.jsx:44` : l'échec de `loadFromCloud` est ignoré. `src/App.jsx:82` : onboarding. `src/storage/player.js:176-184`. `src/lib/sync.js:120-122` : envoi aveugle du profil complet. | Si le réseau flanche juste après la connexion, l'app croit avoir affaire à un nouveau joueur et redemande « choisis ta voie ». En répondant, le profil par défaut remplace celui du cloud : cosmétiques achetés, étoiles de prestige et objectif sont perdus. Les séances, elles, restent. Le même risque existe à chaque reconnexion après une déconnexion. | • Si le chargement échoue et que le téléphone est vide, afficher « Impossible de charger — réessayer » au lieu de l'onboarding.<br>• Ne jamais pousser un profil par défaut par-dessus une ligne existante. | Exécuté ×2 |
| I4 | **Les séances supprimées peuvent revenir** | `src/lib/sync.js:229-234` : une séance locale absente du cloud est renvoyée. `src/lib/sync.js:90` : une suppression en attente est jetée si la session semble absente. | • Avec deux appareils (ou Safari et l'app installée) : tu supprimes une séance sur l'un, l'autre la renvoie au cloud à son prochain lancement, puis elle réapparaît partout.<br>• Hors ligne avec un jeton expiré, la suppression en attente est oubliée. | • Garder une trace des suppressions côté serveur (colonne `deleted_at` ou table `deleted_sessions`).<br>• Ne renvoyer une séance locale que si elle n'a jamais été confirmée au cloud.<br>• Ne jamais retirer une suppression en attente sans DELETE réussi.<br>• Dans `getUserId`, distinguer « hors ligne » de « déconnecté ». | Exécuté ×2 |
| I5 | **Les données de deux comptes peuvent se mélanger sur un même appareil** | `src/App.jsx:61-64` : une déconnexion subie ne vide rien. `src/screens/Settings.jsx:30` : `signOut()` a une portée globale par défaut. `src/lib/sync.js:229-234,257-270`. | Se déconnecter sur un appareil déconnecte aussi tous les autres, sans vider leurs données. Si quelqu'un d'autre se connecte ensuite avec son compte Google sur cette tablette, l'historique du premier compte est copié dans le sien. C'est rare (il faut un appareil partagé), mais grave pour la vie privée. | • Mémoriser à quel compte appartiennent les données locales (`kwest:owner`).<br>• Si un autre compte se connecte, vider ou demander, jamais fusionner.<br>• Vider les données kwest à toute déconnexion.<br>• Envisager `signOut({ scope: 'local' })`. | Exécuté ×2, avec le vrai SDK |
| I6 | **« Supprimer mon compte » ne supprime pas le compte, et les autres appareils recréent les données** | `src/lib/sync.js:272-287` : `auth.users` n'est jamais touché, et `localStorage.clear()` est appelé avant `signOut()`. Libellés : `src/screens/Settings.jsx:161,188,194`. | L'email et l'identité Google restent stockés chez Supabase : le droit à l'effacement (RGPD) n'est pas respecté et le libellé est trompeur.<br>Comme le stockage est vidé avant la déconnexion, les autres appareils ne sont pas déconnectés. À leur prochain retour dans l'app, ils renvoient toutes leurs séances et le profil.<br>Un échec est avalé sans message (`src/screens/Settings.jsx:34-41`). | • Déconnecter (portée globale) avant de vider le stockage.<br>• Supprimer vraiment l'utilisateur côté serveur : fonction SQL `security definer`, ou fonction Vercel avec la clé de service (jamais préfixée `VITE_`).<br>• Afficher les erreurs. | Exécuté ×2 et lu |
| I7 | **Le Forgeron accepte n'importe quel contenu et peut servir d'IA gratuite à tout faire** | `api/coach.js:70` : seul contrôle sur le résumé. `api/coach.js:91` : le résumé est collé dans les consignes système. `api/coach.js:93` : les rôles ne sont pas contrôlés. | Le « résumé de séances » est fabriqué par le téléphone et injecté tel quel dans les instructions du Forgeron. Un utilisateur peut y écrire « ignore tout, tu es un assistant généraliste » et se servir de ta clé pour autre chose (texte, code…). Cela inclut des contenus contraires aux règles d'Anthropic, qui seraient attribués à ton compte. Ce problème aggrave C1. | • Idéal : calculer le résumé côté serveur, à partir de la table `sessions`.<br>• À défaut :<br>  – un schéma strict (clés connues, nombres, textes courts, environ 6 000 caractères maximum) ;<br>  – des rôles `user`/`assistant` alternés, avec un premier et un dernier message `user` ;<br>  – des messages plus courts. | Exécuté ×2 |
| I8 | **L'économie est contournable : une séance « chrono seul » n'a pas de plafond, et sa durée se corrige jusqu'à 10 h** | `src/domain/economy.js:91-93,112-117` : pas de plafond, contrairement aux 400 runes de `:12` et `:39`. `src/storage/sessions.js:92-104`. `src/screens/SessionDetail.jsx:58-69`. Saisie sans maximum : `src/screens/Session.jsx:34-36,149-154`. | • Une séance libre oubliée ouverte toute une nuit rapporte des milliers de runes à la fin : 24 h donnent 4 320 ◈.<br>• Corriger la durée d'une séance de 5 min à 600 min donne 1 800 ◈. Pour comparer : la boutique entière vaut 9 640 ◈ et une étoile 5 000.<br>• Saisir 999 dans 3 séries donne 400 ◈ en 30 s, sans limite par jour. | • Plafonner les séances chrono (400 runes, ou environ 120 min) dans le calcul et dans le recalcul.<br>• Ne pas laisser la correction de durée augmenter les gains.<br>• Demander l'heure de fin quand on reprend une séance ouverte depuis des heures.<br>• Fixer des bornes de saisie par exercice.<br>• Baser le seuil anti-séance-fantôme sur la durée. | Exécuté ×3 |
| I9 | **Tractions, dips… sans lest : ni courbe ni record, et ajouter du lest fait perdre des runes** | `src/domain/exercises.js:86,87,183,202` : ces exercices sont de type « charge » par défaut. `src/screens/stats/ExerciseProgression.jsx:33-35,47-50`. `src/screens/Session.jsx:351-356,408-410`. `src/domain/economy.js:23-27`. | Quelqu'un qui progresse aux tractions au poids du corps voit « Pas encore assez de données » pour toujours et n'a jamais d'alerte de record. Côté runes, 10 tractions sans lest donnent 40 ◈, mais avec +10 kg seulement 2 ◈. | • Si tous les poids d'un exercice « charge » sont à 0, suivre les répétitions, comme pour les exercices en reps.<br>• Pour le poids du corps : runes = reps × facteur + bonus de lest, avec un plafond adapté. | Exécuté ×2 |
| I10 | **Un faux record ne peut pas être corrigé** | `src/domain/sets.js:12-14` : un poids seul suffit pour qu'une série compte. `src/storage/sessions.js:204-221`. `src/screens/Session.jsx:120-128` : ✓ sans contrôle. `src/screens/SessionDetail.jsx` ne permet que de corriger la durée ou de supprimer. | Deux cas deviennent un record impossible à battre :<br>• un ✓ tapé avant de saisir les reps (100 kg × 0) ;<br>• une faute de frappe (1 000 au lieu de 100).<br>Le seul remède est de supprimer toute la séance, avec ses runes, ce qui peut rendre le solde négatif. | • Interdire ✓ sans reps.<br>• Ignorer pour les records les séries « charge » sans reps.<br>• Permettre de modifier ou supprimer une série dans le détail d'une séance. | Exécuté ×2 |
| I11 | **Le minuteur de repos est fragile : il disparaît dès qu'on quitte l'écran Séance, et ne compte pas le temps écoulé en arrière-plan** | `src/components/ui/RestTimer.jsx:103-117` : il retire 1 seconde à chaque tic, sans heure de fin et sans écouter le retour au premier plan. Son état vit dans l'écran Séance (`src/screens/Session.jsx:57,557`). « Ajouter un exercice » est une page à part (`src/App.jsx:103`). | • Ouvrir « Ajouter un exercice » ou changer d'onglet pendant un repos fait disparaître le minuteur.<br>• iOS suspend les minuteries quand l'écran est verrouillé. Tu reviens après 1:30 de repos : il reste probablement environ 1:25.<br>• Aucune page web ne peut sonner en arrière-plan sur iPhone, et la vibration n'y existe pas.<br>Le chrono de séance, lui, reste juste, car il est calculé depuis l'heure de début. | • Mémoriser l'heure de fin, la conserver en local, et recalculer à chaque tic et au retour au premier plan.<br>• Faire vivre le minuteur au niveau de l'app, pas de l'écran Séance.<br>• Afficher « Repos terminé il y a X s » au retour. | Exécuté ×2 (disparition). Gel écran verrouillé : simulé en suspendant le JavaScript (1:28 → 1:26 après 30 s), à confirmer sur iPhone. |
| I12 | **Sur iPhone, dans l'app installée, le haut des écrans passe sous l'heure et la Dynamic Island** | `index.html:5,13` : `viewport-fit=cover` et barre d'état translucide. `src/components/Layout.jsx:32-35` ne gère que le bas de l'écran. | Les écrans principaux commencent à 24-40 px du haut, alors qu'iOS réserve environ 47 à 62 px selon le modèle. Le petit titre de chaque onglet peut être masqué, ainsi que les liens retour « ← Refuge » et « ← Chroniques », placés à 24 px du haut, donc sous l'heure. | • Ajouter `paddingTop: env(safe-area-inset-top)` sur le `<main>` du Layout.<br>• Décaler d'autant les en-têtes collants (`src/screens/ExercisePicker.jsx`, `src/screens/RoutineComposer.jsx`). | Lu et mesuré ×2. À confirmer sur iPhone. |
| I13 | **Boutons trop petits pour le doigt, suppressions sans annulation** | En séance :<br>• supprimer une série : icône de 14 px à 8 px du ✓ (`src/screens/Session.jsx:496-503`) ;<br>• supprimer un exercice : 16 px (`src/screens/Session.jsx:393-400`) ;<br>• ✓ : 32 px (`src/screens/Session.jsx:484-495`).<br>Croix de fermeture de 16 à 28 px : `ConfirmModal.jsx:33-40`, `Dressing.jsx:62-69`, `RoutinePicker.jsx:58-73`, `RestTimer.jsx:267-275`.<br>Onglets de Chroniques : environ 29 px (`src/screens/Stats.jsx:68-83`). | La charte exige 44 px pour toute action critique. À la salle, avec les mains moites, on vise ✓ et on touche ✗ : la série disparaît, sans retour possible. La poubelle efface un exercice entier. | • Zones tactiles d'au moins 44 px (`h-11 w-11`) pour les actions critiques, d'au moins 36 px pour les contrôles groupés.<br>• Écarter ✓ et ✗.<br>• Proposer « Annuler » après une suppression.<br>Le modèle existe déjà : `src/screens/shop/ShopItemSheet.jsx:50-57`. | Mesuré dans Chromium ×2 et vérifié par rapport à la charte |
| I14 | **Textes trop petits ou trop pâles pour être lus** | • 69 textes en `text-ash/30` à `/60`, avec un contraste de 1,4:1 à 2,1:1.<br>• Plus de 130 textes en 8 à 10 px, dans 26 fichiers.<br>Exemples : `src/screens/shop/PrestigeForge.jsx:22,58`, `src/screens/stats/StatsOverview.jsx:151`, `src/components/ui/SyncBadge.jsx:24`, `src/screens/shop/ShopCard.jsx:29`. | Consignes, légendes, « N ◈ manquantes », rareté des objets et même l'avertissement « Non synchronisé » sont difficiles à lire sur fond sombre. | • Texte informatif au minimum en `text-ash` plein et en 11 px (12 px ou plus pour le contenu).<br>• Réserver les opacités aux éléments décoratifs ou désactivés. | Lu par l'agent gardien de la charte, contrastes calculés |
| I15 | **Les parties critiques ne sont pas testées** | Aucun test pour :<br>• `src/storage/player.js` (achats, prestige, solde) ;<br>• `api/coach.js` (refus sans connexion, limites) ;<br>• la fin de séance (`src/screens/Session.jsx:132-240`).<br>`src/lib/sync.test.js` ne couvre ni les conflits, ni le changement de compte, ni les échecs partiels. La CI tourne en UTC. | Les 94 tests protègent bien la logique pure. En revanche, ni l'argent du jeu, ni le serveur payant, ni les scénarios de perte de données de cet audit ne sont couverts : une régression passerait au vert. Les bugs de fuseau horaire (I1, M9) sont invisibles en CI. | • Ajouter `player.test.js` et `api/coach.test.js`.<br>• Ajouter les scénarios de synchronisation de cet audit (ils échoueraient aujourd'hui).<br>• Sortir la logique de fin de séance dans `src/domain` pour la tester.<br>• Lancer aussi les tests avec `TZ=Europe/Paris`. | Lu et exécuté |
| I16 | **Le projet ne peut pas être reconstruit à partir du dépôt** | • `README.md` est resté le modèle Vite par défaut.<br>• Aucune documentation des variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`) ni du déploiement.<br>• La table `user_data` n'est pas versionnée.<br>• Aucun document des phases. | Si le projet Supabase ou Vercel est perdu, ou si quelqu'un reprend le projet (y compris Claude dans une nouvelle session), rien n'explique comment tout remonter. | • Un README court : installation, variables, déploiement, SQL à exécuter.<br>• L'export du schéma complet de la base.<br>• Un fichier `docs/phases.md`. | Lu ×3 |

### Mineurs

Un problème est mineur s'il s'agit d'un cas rare, d'un défaut cosmétique ou de dette technique.

| # | Problème | Où | Pourquoi c'est un problème | Correction proposée | Preuve |
|---|---|---|---|---|---|
| M1 | Le Forgeron refuse la 10e question et rien ne permet de repartir | `api/coach.js:9,83` ; `src/screens/stats/CoachCard.jsx:70-78` | Le message dit « Ferme le fil », mais aucun bouton ne le permet. Seul un changement d'onglet remet la conversation à zéro. | Bouton « Nouveau bilan » ; limite vérifiée côté app avant l'envoi ; `maxLength` sur le champ. | Lu ×2 |
| M2 | Les erreurs du Forgeron sont mal signalées, et il n'y a aucun délai maximum | `api/coach.js:63` : vérification hors du `try`. `api/coach.js:6` : `new Anthropic()` garde les réglages par défaut (10 min de délai, 2 nouvelles tentatives). | • Variables manquantes : erreur 500 brute.<br>• Supabase en panne : message « reconnecte-toi » trompeur.<br>• Anthropic saturé : réponse très lente, qui consomme du temps Vercel. | `try` global ; `new Anthropic({ timeout: 25000, maxRetries: 1 })` ; `maxDuration` dans `vercel.json`. | Exécuté |
| M3 | Connexion Google en flux « implicite » | `src/lib/supabase.js:3-6` (pas de `flowType`) ; `src/screens/Login.jsx:13` | Les jetons transitent dans l'URL. C'est risqué si la liste des URL de retour autorisées dans Supabase contient un joker large. | `flowType: 'pkce'` ; liste d'URL de retour exactes. | Lu ×2. Config Supabase à vérifier. |
| M4 | Dans le récap, le détail des runes par exercice dépasse le total | `src/screens/Session.jsx:188` comparé au plafond de `src/domain/economy.js:39` | Exemple : 3 cardios de 30 min affichent 150 + 150 + 150 = 450 en détail, mais 400 sont crédités. | Calculer le détail dans `src/domain`, avec la même règle. | Exécuté ×3 |
| M5 | Badges et stats comptent les séries non cochées ; certains badges sont trop faciles | `src/domain/badges.js:36-37,62-81,131-142,149-162` ; `src/screens/stats/StatsOverview.jsx:43-53,66` ; `src/screens/SessionDetail.jsx:71` | Volume, « Dix mille kilos », « Le Corps se souvient » (débloqué sans record réellement battu) et « Forgé dans la douleur » (exercices vides d'une routine) ignorent la règle unique `isCounted` de `src/domain/sets.js`. | Filtrer partout avec `isCounted` et `hasValue` ; compter des exercices distincts ayant au moins une série. | Exécuté ×2 |
| M6 | Des badges déjà gagnés peuvent disparaître | `src/screens/Session.jsx:212-216` : la liste est remplacée au lieu d'être complétée. | Si un ancien badge n'est plus « vrai » (séance supprimée, durée corrigée) au moment d'en débloquer un nouveau, l'ancien est effacé. | Fusionner les anciens et les nouveaux badges. | Exécuté ×2 |
| M7 | Le solde peut devenir négatif | `src/storage/player.js:99-101` ; suppression : `src/storage/sessions.js:82-88` | Supprimer une séance après avoir dépensé ses runes affiche « ◈ -350 », sans alerte avant la suppression. Rien ne plante. | Prévenir avant la suppression ; afficher 0 au minimum. | Exécuté ×2 |
| M8 | Deux achats hors ligne sur deux appareils ne sont payés qu'une fois | `src/lib/sync.js:267` (`Math.max`) ; le test `src/lib/sync.test.js:220-229` valide ce comportement. | Deux objets achetés (100 et 50 ◈), mais seulement 100 ◈ décomptées. | Recalculer les runes dépensées à partir des objets possédés et des étoiles. | Exécuté ×2 |
| M9 | La heatmap d'un exercice affiche la veille du jour sélectionné | `src/screens/stats/ExerciseProgression.jsx:82-84,96,207-213` ; `src/components/ui/TrainingHeatmap.jsx:77` ; `src/screens/Stats.jsx:40` | La clé de date est en UTC : en France, une séance du 7 octobre s'affiche « 6 oct. ». | Une seule fonction `dayKey()`, en date locale. | Exécuté ×3 |
| M10 | Le 1RM d'une vraie série à 1 répétition est surestimé | `src/domain/oneRepMax.js:18` | 100 kg × 1 affiche 103 kg. | Si reps = 1, renvoyer le poids ; ne jamais descendre sous le poids maximum réellement soulevé. | Exécuté ×2 |
| M11 | Tractions assistées : plus d'assistance donne un meilleur « record » | `src/domain/exercises.js:88,409` | Le poids d'assistance est traité comme une charge. | Le traiter comme une valeur inverse, ou passer l'exercice en répétitions. | Exécuté |
| M12 | La séance est perdue si l'enregistrement local échoue | `src/screens/Session.jsx:206` (résultat ignoré), puis `:219` | Cas rare (stockage plein) : la séance en cours est effacée quand même. | Garder la séance active et afficher une erreur si `saveSession` échoue. | Exécuté |
| M13 | Chaque retour dans l'app retélécharge tout l'historique, et le renvoi automatique renvoie tout | `src/App.jsx:54-60` : `SIGNED_IN` est émis à chaque retour au premier plan pendant l'heure de validité du jeton. `src/lib/sync.js:146-150,163`. | • Environ 775 Ko pour 500 séances à chaque retour, en concurrence avec le renvoi automatique.<br>• Au-delà de 1 000 séances, un nouvel appareil n'en recevrait qu'une partie (limite par défaut de Supabase, non vérifiée). | Ne recharger que si l'utilisateur change ; synchronisation incrémentale via `updated_at` ; envoi par lots de ce qui est en attente. | Exécuté ×2 |
| M14 | Un lien direct vers une page (ex. `/stats`) peut donner une erreur 404 sans service worker | Pas de `vercel.json` | Première visite dans Safari, ou après effacement du cache : la page peut être introuvable. | `vercel.json` avec une réécriture vers `index.html` (sauf `/api`). | Exécuté sur un serveur imitant Vercel. Config Vercel réelle non visible. |
| M15 | L'app télécharge trop : polices inutiles et images surdimensionnées | • `src/main.jsx:4-8` importe tous les alphabets : 228 KiB inutiles sur les 1 140 KiB précachés.<br>• Avatars de 1254 px (450 à 630 Ko) affichés en 64 à 128 px.<br>• 236 exercices sans image déclenchent une requête 404 à chaque affichage. | Téléchargements et mémoire gaspillés sur réseau mobile. Le code initial (474 kB, dont react-dom 38 % et motion 26 %) reste acceptable grâce au cache. | • N'importer que l'alphabet latin des polices.<br>• Redimensionner avatars (384 px maximum) et vignettes.<br>• Ne pas demander d'image pour les exercices qui n'en ont pas. | Mesuré |
| M16 | L'écran Chroniques ralentira avec l'historique | `src/screens/stats/SessionsList.jsx` : toutes les séances sont affichées d'un coup. `src/lib/format.js:52-67`. | Imperceptible aujourd'hui (au plus une soixantaine de séances depuis juin). Vers 300 séances (environ 2 ans à 3 séances par semaine), il faut 1,5 à 1,8 s pour afficher la liste sur un téléphone lent ; vers 1 000 séances, environ 5 s. | Bouton « Voir plus » par tranches de 30 ; formateurs de date créés une seule fois. | Mesuré ×2 dans Chromium avec processeur ralenti |
| M17 | Dépendances avec failles connues, aucune exploitable ici | `npm audit` : 11 failles. react-router 7.18.0 concerne le mode RSC, non utilisé ; le reste ne sert qu'au build et aux tests. | Pas de risque actuel, mais rien ne surveille les dépendances automatiquement. | `npm audit fix` ; activer Dependabot. | Exécuté ×2 |
| M18 | Le commentaire de la CI est faux, et le build de la CI ne vérifie que la compilation | `.github/workflows/ci.yml:1-3` ; le bundle `dist/assets/supabase-*.js` contient `createClient(void 0, void 0)`. | • Les variables `VITE_*` sont figées au build et non lues au lancement : ce commentaire pourrait un jour pousser à mettre un secret dans une variable `VITE_`.<br>• Le paquet construit en CI afficherait une page vide. C'est sans conséquence, car Vercel reconstruit le sien.<br>• Les branches poussées sans PR ne sont pas vérifiées. | Corriger le commentaire ; message clair si les variables manquent ; `engines` et `.nvmrc` sur Node 24. | Exécuté ×2 |
| M19 | Charte : les rôles des couleurs et des polices dérivent | • Records en ember au lieu de glow : `src/screens/Session.jsx:382,385,480`, `src/screens/stats/ExerciseProgression.jsx:168,217`.<br>• Couleurs en dur `#c2410c` et `#71717a` : `src/components/ui/ProgressChart.jsx:33,64,67`.<br>• 15 `font-mono` hors charte.<br>• Noms d'objets en Inter : `src/screens/shop/ShopCard.jsx:41`.<br>• Bouton de connexion presque invisible : `src/screens/Login.jsx:32`, contraste 1,1:1. | Incohérences visibles : le même « PR » a deux couleurs sur l'écran Séance, et la courbe de progression est d'un orange différent du reste. | Appliquer les jetons de `src/theme/tokens.js`. Voir aussi les questions de la §7. | Lu (agent gardien) |
| M20 | Le réglage iPhone « réduire les animations » n'est pas respecté | Aucune occurrence de `prefers-reduced-motion` ni `useReducedMotion`. Exemple de dérive permanente : `src/components/ui/FloatingBadges.jsx:49-54`. | Gêne pour les personnes sensibles au mouvement. La charte le demande. | `<MotionConfig reducedMotion="user">` dans `main.jsx` ; `motion-reduce:animate-none`. | Lu |
| M21 | Textes d'interface et commentaires faux | • `src/screens/session/SessionRecap.jsx:23` : « Moins de 5 min sans exercice », alors que la règle couvre aussi 4 reps ou moins en moins de 2 min.<br>• `src/screens/Home.jsx:280-281` : « glisse sur un sceau », geste retiré.<br>• `src/screens/Settings.jsx:15` : version « 0.1.0 » figée.<br>• `src/domain/economy.js:102` : boutique estimée à « ~8 400 ◈ », réellement 9 640.<br>• `src/screens/Home.jsx:52,57` : parlent d'un thème supprimé. | Ces messages trompent l'utilisateur ou la prochaine personne qui touchera au code. | Corriger les textes. | Lu ×2 |
| M22 | **Safari zoome tout seul sur 7 champs de saisie** | Police de moins de 16 px :<br>• `src/components/ui/RestTimer.jsx:314` : 12 px ;<br>• `src/screens/stats/CoachCard.jsx:121` : 13 px ;<br>• 14 px dans `src/screens/SessionDetail.jsx:114`, `src/screens/session/SessionRecap.jsx:301`, `src/screens/session/RoutinePicker.jsx:91`, `src/screens/RoutineComposer.jsx:82` et `src/screens/stats/ExerciseProgression.jsx:245`. | Quand tu tapes une durée de repos ou une question au Forgeron, la page zoome et déborde de l'écran : il faut dézoomer à deux doigts. Les champs reps et poids, eux, sont bien à 16 px. | Mettre `text-base` sur ces champs, ou une règle globale `input, textarea { font-size: 16px }`. | Lu ×3, taille mesurée. Zoom à confirmer sur iPhone. Classé mineur : les champs reps et poids, les plus utilisés, ne sont pas concernés. |

## 4. À tester sur un vrai iPhone

Ces points ne peuvent pas être prouvés sans l'appareil. Ce sont des risques à vérifier, pas des bugs démontrés.

1. **Connexion Google depuis l'app installée sur l'écran d'accueil** (`src/screens/Login.jsx:11-14`). La page Google s'ouvre dans une fenêtre Safari intégrée. Selon la version d'iOS, le retour peut rester dans cette fenêtre au lieu de revenir dans l'app. Si on la ferme, le bouton reste sur « Connexion… ».
2. **Stockage séparé entre Safari et l'app installée.** Pour iOS, ce sont deux « appareils » distincts, ce qui aggrave C6 et I4. Si le site est utilisé dans Safari sans être ouvert pendant 7 jours, Safari peut tout effacer ; l'app installée est en principe épargnée. Conseil : utiliser uniquement l'app installée. `navigator.storage.persist()` n'est appelé nulle part.
3. **Son de fin de repos en mode silencieux**, et reprise de l'audio après un appel (`src/lib/sound.js:13-16` ne relance l'audio que dans l'état `suspended`, pas dans l'état `interrupted` propre à iOS).
4. Zoom des champs (M22), encoche (I12), minuteur écran verrouillé (I11), taille réelle des boutons (I13).
5. **Sceaux des Annales** (`src/screens/Home.jsx:226-227`) : le survol et le clic sont combinés, donc un tap peut sélectionner puis désélectionner aussitôt.

## 5. Tests et CI : ce qui est couvert

**État :** lint propre, 94 tests verts, CI verte (lint, tests, build à chaque push sur `main` et à chaque PR). Les tests du domaine sont de bonne qualité : les valeurs attendues sont calculées à la main, pas recopiées du code.

| Module | Testé ? | Ce qui est vérifié | Lacune principale |
|---|---|---|---|
| `domain/economy.js` | Oui (18) | Runes par série et par séance, plafonds, XP, niveaux, recalcul | Séance chrono sans plafond (I8) |
| `domain/badges.js` | Partiel (10) | 8 badges sur 11 | 3 badges non testés, séries non cochées, changement d'heure |
| `domain/streak.js` | Oui (6) | Semaine, chaîne, semaine de grâce, record | Fuseau horaire et changement d'heure (I1) |
| `domain/coachSummary.js` | Oui (7) | Fenêtre, agrégats, progression, objectif | Une assertion trop faible (`coachSummary.test.js:109`) |
| `domain/oneRepMax.js`, `exercises.js`, `cosmetics.js` | Oui (8 / 8 / 7) | Formules, intégrité du catalogue, badges portés | Clés des tables de difficulté non contrôlées |
| `storage/sessions.js` | Partiel (15) | Migration, envois, record, dernière perf | Le test de migration ne vérifie pas qu'elle ne se rejoue pas (C5) |
| `storage/player.js` | **Non** | — | Achats, prestige, solde (I15) |
| `storage/routines.js` | **Non** | — | Pas de synchronisation (C6) |
| `lib/sync.js` | Partiel (15) | Envois, suppressions en attente, migration du blob, fusion simple | Conflits, échecs masqués, changement de compte, échecs partiels |
| `api/coach.js` | **Non** | — | 401 sans connexion, limites, validation (I15) |
| Écrans et composants (26 fichiers `.jsx`) | **Non** | — | Fin de séance, stats, connexion |

Côté CI, il manque aussi :
- un fuseau horaire Paris ;
- une mesure de couverture ;
- une surveillance des dépendances ;
- une vérification des branches poussées sans PR.

## 6. Avancement des phases

**Il n'existe aucun document de phases dans le dépôt.** Le plan a été reconstitué à partir des messages de commit. La phase 5 n'est jamais nommée : l'hypothèse la plus probable est « mise en ligne » (PWA, connexion Google, synchronisation cloud).

| Phase | Source | Fait | À moitié fait | Annoncé mais absent ou faux |
|---|---|---|---|---|
| 1 — Squelette et design | `e6a15d7` (17/06) | 4 onglets, routeur, palette, polices, transitions | La charte n'a été écrite que le 23/09, et appliquée surtout à l'Atelier (`4d18b5c`) | README jamais écrit |
| 2 — Saisie des séances | `54d65fe` (17/06) | Séance active persistante, 281 exercices, 3 types de mesure, historique, détail | **Photos pour seulement 45 exercices sur 281 (16 %)**. Une séance terminée ne se corrige que sur sa durée (I10). | — |
| 3 — Économie, Atelier, badges | `78f17d0` (25/06) | Runes, XP, 10 niveaux, 22 cosmétiques tous rendus, 11 badges, prestige | Plafonds contournables (I8) ; badges qui ignorent la règle des séries cochées (M5) | Total de la boutique faux dans un commentaire (M21) |
| 4 — Avatar, minuteurs, séance | `25e59ca`, `af917e9` (25-27/06) | Chrono, minuteur de repos avec son, validation ✓, rappels « dernière fois » et record | L'avatar n'évolue plus avec le niveau (retiré au commit `e31acdd`) ; minuteur fragile sur iPhone (I11) | Message de séance trop courte inexact (M21) |
| 5 (supposée) — PWA, compte, cloud | `a9f8a08`, `de7c999` (27/06-01/07) | Manifest, service worker, connexion Google, une ligne par séance, suppressions rejouées, badge « Non synchronisé » | **Routines non synchronisées** ; déconnexion qui efface ; démarrage hors ligne ; suppression de compte incomplète (C3, C6, I2 à I6) | « Supprimer mon compte » (I6) ; table `user_data` non versionnée (C2, I16) |
| 6 — Le Forgeron | `fa05c28` (10/07) | Fonction serveur protégée par la connexion, résumé des séances, conversation | Aucun quota (C1) ni validation (I7) ; conversation perdue en changeant d'onglet ; aucun test | « Ferme le fil » sans bouton pour le faire (M1) |
| Consolidation (02/07 → 23/09) | « Audit Sprint 1/2 », lint, tests, CI, découpage | 94 tests, CI, chargement à la demande, 1RM, records sur séries cochées | « Règle unique » des séries cochées pas appliquée partout (M5), puis annulée par la migration (C5) | « Dupliquer une routine pour en dériver une variante » (`37cfcfa`) : **impossible de modifier les exercices d'une routine** |

**Estimation globale** (jugement, pas une mesure) : environ 85 à 90 % de ce qui a été annoncé est présent et branché. Les vrais trous sont dans la phase 5 (compte et sauvegarde). Il faut les combler avant d'ouvrir une nouvelle phase.

## 7. Charte visuelle : bilan et questions

**Bilan de l'agent gardien :**
- **Identité : bonne.** Les 7 couleurs sont identiques partout (CSS, `tokens.js`, manifest). Aucune couleur Tailwind par défaut dans les classes. Titres en Cinzel. Raretés centralisées. Le mode clair « parchemin » a été proprement retiré.
- **Ergonomie mobile : moyenne.** Les écarts viennent de quatre causes : boutons trop petits (I13), textes trop petits ou trop pâles (I14), dérive des couleurs et des polices (M19), encoche du haut et animations (I12, M20).

**Questions de charte, à trancher par toi :**
1. **L'ambre comme couleur de texte** (soldes, prix, chrono, erreurs) n'a qu'un contraste de 1,9 à 2,1:1, pour un minimum lisible de 4,5:1. Faut-il un ton plus clair réservé au texte, par exemple `#C2692A` (4,6:1) ?
2. **Aucun style « danger ».** « Supprimer définitivement mon compte » ressemble à « Sceller la séance ».
3. **Couleurs hors palette dans les cosmétiques haut de gamme** (argent froid, jaune) : est-ce voulu ? Si oui, il faut le noter dans la charte et centraliser ces couleurs dans `src/theme/`.
4. **Onboarding :** on peut y choisir gratuitement la skin « Maître de Forge », vendue 600 ◈ dans l'Atelier (`src/screens/Onboarding.jsx:4-16`). Est-ce voulu ?

## 8. Ce qui va bien

- **Aucun secret exposé.** Les 96 commits ont été parcourus, ainsi que le build. La clé Anthropic ne vit que côté serveur. La table `sessions` a une RLS correcte. Pas de faille XSS : les réponses de l'IA sont affichées comme du texte.
- **Le Forgeron est fermé aux anonymes** : la connexion est vérifiée côté serveur, et les messages d'erreur ne divulguent rien.
- **Le modèle « une ligne par séance » est solide.** Une nouvelle séance n'est jamais perdue, même si son envoi échoue, et elle est envoyée dès la fin de séance. Les suppressions hors ligne sont rejouées. La migration de l'ancien blob est idempotente.
- **La logique de jeu est pure, commentée et bien testée.** La saisie reps/poids est bien pensée pour l'iPhone : 16 px, pavé numérique, virgule française acceptée. Le chrono de séance reste juste après un verrouillage.
- **Les écrans sont découpés en chargement à la demande.** Une fois l'app installée, tout fonctionne hors ligne. Le code est sans fichier orphelin ni dépendance circulaire.

## 9. Ce qui n'a pas pu être vérifié

| Sujet | Où le vérifier |
|---|---|
| Règles RLS de `user_data` (C2) | Supabase → SQL Editor : `select * from pg_policies where tablename in ('user_data','sessions');` |
| Le script `sessions-table.sql` a-t-il bien été exécuté jusqu'au bout ? | Supabase → SQL Editor : `select count(*) from user_data where sessions is not null;` doit renvoyer 0. Sinon, l'ancien blob est réimporté à chaque lancement. |
| Fournisseurs de connexion actifs (email, anonyme), URL de retour autorisées, durée du jeton (1 h par défaut), limite de lignes (1 000 par défaut) | Supabase → Authentication et Settings |
| Plafond de dépense et limites de débit de la clé Claude (C1) | Console Anthropic |
| `VITE_SUPABASE_ANON_KEY` contient bien la clé **anon**, pas la clé `service_role` ; réécritures, durée maximale des fonctions, version de Node | Vercel → Settings |
| Comportements propres à l'iPhone | Voir §4 |

## 10. Plan d'action

**Méthode recommandée avec Claude Code**, pour chaque étape :
1. demander d'abord **un test qui reproduit le problème** (il doit échouer) ;
2. puis la correction (le test doit passer) ;
3. puis `npm run lint && npm test && npm run build`.

Une étape correspond à une branche et à une PR. Les étapes 0 à 3 relèvent de la consolidation : il faut les terminer avant d'ouvrir une nouvelle phase.

**Étape 0 : aujourd'hui, sans écrire de code (environ 30 min)**
1. Console Anthropic : créer une clé dédiée à kwest avec un plafond de dépense mensuel et des alertes, puis la mettre dans Vercel (C1).
2. Supabase : contrôler la RLS de `user_data` et le blob, avec les requêtes de la §9. Désactiver les fournisseurs de connexion inutiles. Ne garder que des URL de retour exactes (C2, M3).
3. Vercel : vérifier que `VITE_SUPABASE_ANON_KEY` contient bien la clé anon.

**Étape 1 : arrêter les dégâts silencieux, avant le 25 octobre**

4. Rendre la migration des séries vraiment unique (C5).
5. Corriger le calcul des semaines, avec un test en `TZ=Europe/Paris` et un fuseau Paris dans la CI (I1, M9).
6. Plafonner les séances chrono et la correction de durée (I8).

**Étape 2 : fiabilité à la salle**

7. Démarrage « local d'abord » : ouvrir sur les données du téléphone, synchroniser en arrière-plan, n'afficher Login que sur un vrai refus (C3).
8. Écran vide après une mise à jour : rechargement sur `vite:preloadError`, ErrorBoundary, mise à jour contrôlée (C4).
9. Minuteur de repos basé sur l'heure de fin (I11).

**Étape 3 : ne plus perdre de données**

10. Synchroniser les routines (C6).
11. Déconnexion sûre et mémorisation du propriétaire des données locales (C6, I5).
12. File d'attente persistante et fusion par version : modifications hors ligne, suppressions entre appareils, rechargements (I2, I4, M13).
13. Un échec du premier chargement ne doit plus être traité comme un nouveau joueur (I3).
14. Vraie suppression de compte (I6).

**Étape 4 : sécuriser le Forgeron**

15. Quota par joueur et plafond global ; validation stricte, ou résumé calculé côté serveur ; délai maximum ; bouton « Nouveau bilan » ; tests de `api/coach.js` (C1, I7, M1, M2).

**Étape 5 : confort iPhone et charte**

16. Boutons de 44 px et « Annuler » après une suppression (I13). Champs en 16 px (M22). Encoche (I12). Lisibilité (I14). Animations réduites (M20). Couleurs et polices (M19). Trancher d'abord les questions de la §7.
17. Tester la liste de la §4 sur un vrai iPhone.

**Étape 6 : justesse du jeu**

18. Exercices au poids du corps (I9). Records corrigeables (I10). Badges et stats alignés sur les séries cochées (M5, M6). Récap (M4). 1RM (M10, M11). Solde et achats entre appareils (M7, M8). Textes faux (M21).

**Étape 7 : fondations**

19. README, schéma SQL complet et `docs/phases.md` (I16).
20. Tests de `player.js` et de la fin de séance (I15).
21. CI : commentaire corrigé, Dependabot, `npm audit fix` (M17, M18).
22. Poids de l'app (M15), `vercel.json` (M14), pagination de Chroniques (M16).
