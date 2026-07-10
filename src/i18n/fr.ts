/** French translations, keyed by the English source string. */
export const fr: Record<string, string> = {
	// Commands and ribbon
	"Create habit": "Créer une habitude",
	"Insert dashboard": "Insérer le tableau de bord",
	"Insert habit metrics": "Insérer les métriques d'habitude",
	"Open panel": "Ouvrir le panneau",
	"Open habits panel": "Ouvrir le panneau des habitudes",
	Habits: "Habitudes",

	// Settings
	"Habits folder": "Dossier des habitudes",
	"Folder where each habit is stored as its own note. It is created automatically if it does not exist.":
		"Dossier où chaque habitude est enregistrée dans sa propre note. Il est créé automatiquement s'il n'existe pas.",
	"Follow daily note date": "Suivre la date de la note quotidienne",
	"When a dashboard is embedded in a daily note (a note whose name contains a date like 2026-07-01), open it on that note's date instead of today.":
		"Lorsqu'un tableau de bord est intégré dans une note quotidienne (une note dont le nom contient une date comme 2026-07-01), il s'ouvre à la date de cette note plutôt qu'à aujourd'hui.",
	"Cards per view": "Cartes par vue",
	"How many habit cards the carousel shows at once on wider screens.":
		"Nombre de cartes d'habitudes affichées à la fois sur les grands écrans.",
	"Cards per view on mobile": "Cartes par vue sur mobile",
	"How many habit cards the carousel shows at once on phone-sized screens.":
		"Nombre de cartes d'habitudes affichées à la fois sur les écrans de téléphone.",

	// Confirm dialog defaults
	Cancel: "Annuler",
	Confirm: "Confirmer",

	// Store notices
	'Could not find the note for "{name}".':
		'Impossible de trouver la note de « {name} ».',
	"Please enter a valid habit name.":
		"Veuillez saisir un nom d'habitude valide.",
	'A habit called "{name}" already exists.':
		'Une habitude nommée « {name} » existe déjà.',
	'Created habit "{name}".': 'Habitude « {name} » créée.',
	'Updated "{name}".': '« {name} » mise à jour.',
	'Paused "{name}".': '« {name} » mise en pause.',
	'Resumed "{name}".': '« {name} » reprise.',
	'Stopped tracking "{name}". Its history is kept in the note.':
		'Suivi de « {name} » arrêté. Son historique est conservé dans la note.',
	'Resumed tracking "{name}".': 'Suivi de « {name} » repris.',
	'Removed "{name}".': '« {name} » supprimée.',
	"Habit added to the dashboard.": "Habitude ajoutée au tableau de bord.",

	// Dashboard
	"Back to habits": "Retour aux habitudes",
	"View stats": "Voir les statistiques",
	"Export stats": "Exporter les statistiques",
	Weekly: "Hebdomadaire",
	Monthly: "Mensuel",
	"Previous day": "Jour précédent",
	"Next day": "Jour suivant",
	"Choose a date": "Choisir une date",
	"Add habit": "Ajouter une habitude",
	"No habits yet. Create your first habit to get started.":
		"Aucune habitude pour l'instant. Créez votre première habitude pour commencer.",
	Previous: "Précédent",
	Next: "Suivant",
	"Go to position {n}": "Aller à la position {n}",
	"Right-click or long-press for more options":
		"Clic droit ou appui long pour plus d'options",
	"Open habit note": "Ouvrir la note de l'habitude",
	"Open the note for {name}": "Ouvrir la note de {name}",
	Paused: "En pause",
	"Since {date} · right-click to resume":
		"Depuis le {date} · clic droit pour reprendre",
	"Paused on this day": "En pause ce jour-là",
	"Mark as done": "Marquer comme fait",
	"Mark as not done": "Marquer comme non fait",
	Done: "Fait",
	"Not done": "À faire",
	"Edit value": "Modifier la valeur",
	Value: "Valeur",
	"Decrease by 1": "Diminuer de 1",
	"Increase by 1": "Augmenter de 1",
	"Increase by {n}": "Augmenter de {n}",
	"Edit habit": "Modifier l'habitude",
	"Pause habit": "Mettre en pause",
	"Resume habit": "Reprendre l'habitude",
	"Stop tracking": "Arrêter le suivi",
	"Remove habit": "Supprimer l'habitude",
	'Stop tracking "{name}"? It leaves the dashboard and stats, but its note and full history are kept. You can resume tracking any time from the note\'s metrics view.':
		'Arrêter le suivi de « {name} » ? Elle quitte le tableau de bord et les statistiques, mais sa note et tout son historique sont conservés. Vous pouvez reprendre le suivi à tout moment depuis la vue des métriques de la note.',
	'Remove "{name}"? Its note will be moved to the trash.':
		'Supprimer « {name} » ? Sa note sera déplacée vers la corbeille.',
	Remove: "Supprimer",
	"Perfect!": "Parfait !",
	Today: "Aujourd'hui",
	Yesterday: "Hier",
	Tomorrow: "Demain",
	"Last 7 days": "7 derniers jours",
	"Last 30 days": "30 derniers jours",
	"This week": "Cette semaine",
	"This month": "Ce mois-ci",

	// Sidebar panel
	"Habits completed today": "Habitudes accomplies aujourd'hui",
	"No habits yet.": "Aucune habitude pour l'instant.",
	"Click to type a value": "Cliquez pour saisir une valeur",
	"Open note": "Ouvrir la note",

	// Stats view
	"No habits to show stats for yet.":
		"Aucune habitude à afficher dans les statistiques pour l'instant.",
	Completion: "Réussite",
	"Best streak": "Meilleure série",
	"Perfect days": "Jours parfaits",
	Completions: "Accomplissements",
	"Goals met": "Objectifs atteints",
	"{completed}/{days} days": "{completed}/{days} jours",
	"{total} total": "{total} au total",
	best: "record",
	"perfect week": "semaine parfaite",
	"perfect month": "mois parfait",
	"weekly goal": "objectif hebdomadaire",
	"monthly goal": "objectif mensuel",
	"{progress}/{goal} days · {label} · {pct}%":
		"{progress}/{goal} jours · {label} · {pct} %",

	// Habit metrics block
	'Place this block inside a habit note, or point it at one with "habit: <name>".':
		'Placez ce bloc dans une note d\'habitude, ou désignez-en une avec « habit: <nom> ».',
	'No habit called "{name}" was found.':
		'Aucune habitude nommée « {name} » n\'a été trouvée.',
	"No longer tracked since {date}. All history is kept.":
		"Suivi arrêté depuis le {date}. Tout l'historique est conservé.",
	"No longer tracked. All history is kept.":
		"Suivi arrêté. Tout l'historique est conservé.",
	"Resume tracking": "Reprendre le suivi",
	"Paused since {date}. Paused days don't count against streaks or stats.":
		"En pause depuis le {date}. Les jours en pause ne comptent ni pour les séries ni pour les statistiques.",
	"Paused. Paused days don't count against streaks or stats.":
		"En pause. Les jours en pause ne comptent ni pour les séries ni pour les statistiques.",
	"Current streak": "Série actuelle",
	"Days completed": "Jours accomplis",
	"30-day rate": "Taux sur 30 jours",
	"Weekly completion rate": "Taux de réussite hebdomadaire",
	Logged: "Enregistré",
	Target: "Objectif",

	// Export modal
	Title: "Titre",
	"Habits report": "Rapport d'habitudes",
	"Date range": "Plage de dates",
	"Custom range": "Plage personnalisée",
	From: "Du",
	To: "Au",
	"Up to {n} days.": "Jusqu'à {n} jours.",
	Content: "Contenu",
	"Summary tiles": "Tuiles de résumé",
	"Completion trend chart": "Graphique de tendance de réussite",
	"Daily grids": "Grilles quotidiennes",
	"Goal progress": "Progression des objectifs",
	Layout: "Mise en page",
	Orientation: "Orientation",
	Portrait: "Portrait",
	Landscape: "Paysage",
	Density: "Densité",
	Comfortable: "Confortable",
	Compact: "Compact",
	Monochrome: "Monochrome",
	"Ink-friendly greys instead of accent colours.":
		"Des gris économes en encre plutôt que des couleurs d'accent.",
	"Export PDF": "Exporter le PDF",
	"No habits to export yet.": "Aucune habitude à exporter pour l'instant.",
	"Completion trend": "Tendance de réussite",
	"(paused)": "(en pause)",
	"{rate}% · {total} · streak {current} (best {best})":
		"{rate} % · {total} · série {current} (record {best})",
	"Goal: {completed}/{goal} days met":
		"Objectif : {completed}/{goal} jours atteints",
	'Exported to "{path}" in your vault.':
		'Exporté vers « {path} » dans votre coffre.',
	"{range} · exported {date}": "{range} · exporté le {date}",

	// Habit modal
	"New habit": "Nouvelle habitude",
	Name: "Nom",
	Type: "Type",
	"Binary is done or not done. Repetition counts towards a target. Timed tracks minutes.":
		"Binaire : fait ou non fait. Répétition : compte vers un objectif. Chronométré : enregistre des minutes.",
	Binary: "Binaire",
	Repetition: "Répétition",
	Timed: "Chronométré",
	"Daily target (minutes)": "Objectif quotidien (minutes)",
	"Daily target": "Objectif quotidien",
	Unit: "Unité",
	"Optional label shown next to the count.":
		"Étiquette facultative affichée à côté du compteur.",
	Icon: "Icône",
	"Choose a Lucide icon or an emoji to represent this habit.":
		"Choisissez une icône Lucide ou un emoji pour représenter cette habitude.",
	Emoji: "Emoji",
	"Choose an emoji": "Choisir un emoji",
	"Clear icon": "Effacer l'icône",
	"Choose icon": "Choisir une icône",
	"Save changes": "Enregistrer les modifications",
	"Targets (optional)": "Objectifs (facultatif)",
	"Set an optional weekly or monthly goal for how many days you complete this habit. For example, hitting your daily goal on all 7 days is a weekly target of 7. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.":
		"Définissez un objectif hebdomadaire ou mensuel facultatif indiquant combien de jours vous accomplissez cette habitude. Par exemple, atteindre votre objectif quotidien les 7 jours équivaut à un objectif hebdomadaire de 7. Activez une option « parfait » pour viser automatiquement chaque jour de la période, quelle que soit sa durée.",
	"Perfect week": "Semaine parfaite",
	"Aim to complete this habit every day of the week.":
		"Visez à accomplir cette habitude chaque jour de la semaine.",
	"Weekly target": "Objectif hebdomadaire",
	"Optional. Days to complete per week (max 7).":
		"Facultatif. Jours à accomplir par semaine (max. 7).",
	None: "Aucun",
	"Perfect month": "Mois parfait",
	"Aim to complete this habit every day of the month.":
		"Visez à accomplir cette habitude chaque jour du mois.",
	"Monthly target": "Objectif mensuel",
	"Optional. Days to complete per month.":
		"Facultatif. Jours à accomplir par mois.",
	Colour: "Couleur",
	"Pick a colour from your theme, or choose a custom one.":
		"Choisissez une couleur de votre thème ou une couleur personnalisée.",
	"Your habit": "Votre habitude",

	// Icon and colour pickers
	"Search icons…": "Rechercher des icônes…",
	"Search emojis…": "Rechercher des émojis…",
	Accent: "Accent",
	Red: "Rouge",
	Orange: "Orange",
	Yellow: "Jaune",
	Green: "Vert",
	Cyan: "Cyan",
	Blue: "Bleu",
	Purple: "Violet",
	Pink: "Rose",

	// Comments
	"Comments on cards": "Commentaires sur les cartes",
	"Show a comment flap on dashboard cards for jotting a note about any day.":
		"Affiche un volet de commentaire sur les cartes du tableau de bord pour annoter n'importe quel jour.",
	"Add comment": "Ajouter un commentaire",
	"Flip back": "Retourner la carte",
	"Add a comment for this day…": "Ajoutez un commentaire pour ce jour…",
	Comments: "Commentaires",
	"+{n} more": "+{n} de plus",

	// Limit habits (experimental)
	Experimental: "Expérimental",
	"These features are still being tested and may change before they become permanent. Turning one off only hides it from menus — anything you created with it keeps working.":
		"Ces fonctionnalités sont encore en cours de test et peuvent changer avant de devenir permanentes. Les désactiver ne fait que les masquer des menus — tout ce que vous avez créé avec continue de fonctionner.",
	"Break bad habits": "Rompre avec les mauvaises habitudes",
	"Track habits you want to reduce or avoid by staying under a daily limit — for example at most 2 hours of gaming, or no smoking at all.":
		"Suivez les habitudes que vous voulez réduire ou éviter en restant sous une limite quotidienne — par exemple au plus 2 heures de jeu vidéo, ou ne pas fumer du tout.",
	Goal: "Objectif",
	"Reach a target for habits you are building. Stay under a limit for habits you are cutting down or giving up.":
		"Atteignez un objectif pour les habitudes que vous construisez. Restez sous une limite pour les habitudes que vous réduisez ou abandonnez.",
	"Reach a target": "Atteindre un objectif",
	"Stay under a limit": "Rester sous une limite",
	"Binary means avoiding it entirely. Repetition counts against a daily limit. Timed tracks minutes against a daily limit.":
		"Binaire signifie l'éviter complètement. Répétition compte par rapport à une limite quotidienne. Chronométré mesure des minutes par rapport à une limite quotidienne.",
	"Daily limit": "Limite quotidienne",
	"Daily limit (minutes)": "Limite quotidienne (minutes)",
	"0 means none at all.": "0 signifie pas du tout.",
	"Set an optional weekly or monthly goal for how many days you stay within your limit. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.":
		"Définissez un objectif hebdomadaire ou mensuel facultatif pour le nombre de jours où vous restez dans votre limite. Activez une bascule parfaite pour viser automatiquement chaque jour de la période, quelle que soit sa durée.",
	Clean: "Sans écart",
	Slipped: "Écart",
	"Mark as clean": "Marquer comme sans écart",
	"Mark as slipped": "Marquer comme écart",
	"Days within limit": "Jours dans la limite",
	Limit: "Limite",
};
