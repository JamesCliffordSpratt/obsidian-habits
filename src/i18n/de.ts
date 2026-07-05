/** German translations, keyed by the English source string. */
export const de: Record<string, string> = {
	// Commands and ribbon
	"Create habit": "Gewohnheit erstellen",
	"Insert dashboard": "Dashboard einfügen",
	"Insert habit metrics": "Gewohnheits-Metriken einfügen",
	"Open panel": "Seitenleiste öffnen",
	"Open habits panel": "Gewohnheiten-Seitenleiste öffnen",
	Habits: "Gewohnheiten",

	// Settings
	"Habits folder": "Gewohnheiten-Ordner",
	"Folder where each habit is stored as its own note. It is created automatically if it does not exist.":
		"Ordner, in dem jede Gewohnheit als eigene Notiz gespeichert wird. Er wird automatisch erstellt, falls er nicht existiert.",
	"Follow daily note date": "Datum der täglichen Notiz übernehmen",
	"When a dashboard is embedded in a daily note (a note whose name contains a date like 2026-07-01), open it on that note's date instead of today.":
		"Wenn ein Dashboard in eine tägliche Notiz eingebettet ist (eine Notiz, deren Name ein Datum wie 2026-07-01 enthält), öffnet es sich mit dem Datum dieser Notiz statt mit heute.",
	"Cards per view": "Karten pro Ansicht",
	"How many habit cards the carousel shows at once on wider screens.":
		"Wie viele Gewohnheitskarten das Karussell auf breiten Bildschirmen gleichzeitig anzeigt.",
	"Cards per view on mobile": "Karten pro Ansicht auf dem Handy",
	"How many habit cards the carousel shows at once on phone-sized screens.":
		"Wie viele Gewohnheitskarten das Karussell auf Handy-Bildschirmen gleichzeitig anzeigt.",

	// Confirm dialog defaults
	Cancel: "Abbrechen",
	Confirm: "Bestätigen",

	// Store notices
	'Could not find the note for "{name}".':
		'Die Notiz für „{name}" wurde nicht gefunden.',
	"Please enter a valid habit name.":
		"Bitte gib einen gültigen Namen für die Gewohnheit ein.",
	'A habit called "{name}" already exists.':
		'Eine Gewohnheit namens „{name}" existiert bereits.',
	'Created habit "{name}".': 'Gewohnheit „{name}" erstellt.',
	'Updated "{name}".': '„{name}" aktualisiert.',
	'Paused "{name}".': '„{name}" pausiert.',
	'Resumed "{name}".': '„{name}" fortgesetzt.',
	'Stopped tracking "{name}". Its history is kept in the note.':
		'„{name}" wird nicht mehr verfolgt. Der Verlauf bleibt in der Notiz erhalten.',
	'Resumed tracking "{name}".': '„{name}" wird wieder verfolgt.',
	'Removed "{name}".': '„{name}" entfernt.',
	"Habit added to the dashboard.":
		"Gewohnheit zum Dashboard hinzugefügt.",

	// Dashboard
	"Back to habits": "Zurück zu den Gewohnheiten",
	"View stats": "Statistiken anzeigen",
	"Export stats": "Statistiken exportieren",
	Weekly: "Wöchentlich",
	Monthly: "Monatlich",
	"Previous day": "Vorheriger Tag",
	"Next day": "Nächster Tag",
	"Choose a date": "Datum wählen",
	"Add habit": "Gewohnheit hinzufügen",
	"No habits yet. Create your first habit to get started.":
		"Noch keine Gewohnheiten. Erstelle deine erste Gewohnheit, um loszulegen.",
	Previous: "Zurück",
	Next: "Weiter",
	"Go to position {n}": "Zu Position {n} springen",
	"Right-click or long-press for more options":
		"Rechtsklick oder langes Drücken für weitere Optionen",
	"Open habit note": "Notiz der Gewohnheit öffnen",
	"Open the note for {name}": "Notiz für {name} öffnen",
	Paused: "Pausiert",
	"Since {date} · right-click to resume":
		"Seit {date} · Rechtsklick zum Fortsetzen",
	"Paused on this day": "An diesem Tag pausiert",
	"Mark as done": "Als erledigt markieren",
	"Mark as not done": "Als nicht erledigt markieren",
	Done: "Erledigt",
	"Not done": "Offen",
	"Edit value": "Wert bearbeiten",
	Value: "Wert",
	"Decrease by 1": "Um 1 verringern",
	"Increase by 1": "Um 1 erhöhen",
	"Increase by {n}": "Um {n} erhöhen",
	"Edit habit": "Gewohnheit bearbeiten",
	"Pause habit": "Gewohnheit pausieren",
	"Resume habit": "Gewohnheit fortsetzen",
	"Stop tracking": "Nicht mehr verfolgen",
	"Remove habit": "Gewohnheit entfernen",
	'Stop tracking "{name}"? It leaves the dashboard and stats, but its note and full history are kept. You can resume tracking any time from the note\'s metrics view.':
		'„{name}" nicht mehr verfolgen? Sie verschwindet aus dem Dashboard und den Statistiken, aber ihre Notiz und ihr gesamter Verlauf bleiben erhalten. Du kannst die Verfolgung jederzeit über die Metrik-Ansicht der Notiz fortsetzen.',
	'Remove "{name}"? Its note will be moved to the trash.':
		'„{name}" entfernen? Ihre Notiz wird in den Papierkorb verschoben.',
	Remove: "Entfernen",
	"Perfect!": "Perfekt!",
	Today: "Heute",
	Yesterday: "Gestern",
	Tomorrow: "Morgen",
	"Last 7 days": "Letzte 7 Tage",
	"Last 30 days": "Letzte 30 Tage",
	"This week": "Diese Woche",
	"This month": "Dieser Monat",

	// Sidebar panel
	"Habits completed today": "Heute erledigte Gewohnheiten",
	"No habits yet.": "Noch keine Gewohnheiten.",
	"Click to type a value": "Klicken, um einen Wert einzugeben",
	"Open note": "Notiz öffnen",

	// Stats view
	"No habits to show stats for yet.":
		"Noch keine Gewohnheiten für Statistiken vorhanden.",
	Completion: "Erfüllung",
	"Best streak": "Beste Serie",
	"Perfect days": "Perfekte Tage",
	Completions: "Erledigungen",
	"Goals met": "Ziele erreicht",
	"{completed}/{days} days": "{completed}/{days} Tage",
	"{total} total": "{total} insgesamt",
	best: "Rekord",
	"perfect week": "perfekte Woche",
	"perfect month": "perfekter Monat",
	"weekly goal": "Wochenziel",
	"monthly goal": "Monatsziel",
	"{progress}/{goal} days · {label} · {pct}%":
		"{progress}/{goal} Tage · {label} · {pct} %",

	// Habit metrics block
	'Place this block inside a habit note, or point it at one with "habit: <name>".':
		'Platziere diesen Block in einer Gewohnheitsnotiz oder verweise mit „habit: <Name>" auf eine.',
	'No habit called "{name}" was found.':
		'Keine Gewohnheit namens „{name}" gefunden.',
	"No longer tracked since {date}. All history is kept.":
		"Seit {date} nicht mehr verfolgt. Der gesamte Verlauf bleibt erhalten.",
	"No longer tracked. All history is kept.":
		"Nicht mehr verfolgt. Der gesamte Verlauf bleibt erhalten.",
	"Resume tracking": "Verfolgung fortsetzen",
	"Paused since {date}. Paused days don't count against streaks or stats.":
		"Pausiert seit {date}. Pausierte Tage zählen weder gegen Serien noch gegen Statistiken.",
	"Paused. Paused days don't count against streaks or stats.":
		"Pausiert. Pausierte Tage zählen weder gegen Serien noch gegen Statistiken.",
	"Current streak": "Aktuelle Serie",
	"Days completed": "Erledigte Tage",
	"30-day rate": "30-Tage-Quote",
	"Weekly completion rate": "Wöchentliche Erfüllungsquote",
	Logged: "Erfasst",
	Target: "Ziel",

	// Export modal
	Title: "Titel",
	"Habits report": "Gewohnheiten-Bericht",
	"Date range": "Zeitraum",
	"Custom range": "Benutzerdefinierter Zeitraum",
	From: "Von",
	To: "Bis",
	"Up to {n} days.": "Bis zu {n} Tage.",
	Content: "Inhalt",
	"Summary tiles": "Zusammenfassungs-Kacheln",
	"Completion trend chart": "Trend-Diagramm der Erfüllung",
	"Daily grids": "Tagesraster",
	"Goal progress": "Zielfortschritt",
	Layout: "Layout",
	Orientation: "Ausrichtung",
	Portrait: "Hochformat",
	Landscape: "Querformat",
	Density: "Dichte",
	Comfortable: "Komfortabel",
	Compact: "Kompakt",
	Monochrome: "Monochrom",
	"Ink-friendly greys instead of accent colours.":
		"Tintensparende Grautöne statt Akzentfarben.",
	"Export PDF": "PDF exportieren",
	"No habits to export yet.":
		"Noch keine Gewohnheiten zum Exportieren.",
	"Completion trend": "Erfüllungstrend",
	"(paused)": "(pausiert)",
	"{rate}% · {total} · streak {current} (best {best})":
		"{rate} % · {total} · Serie {current} (Rekord {best})",
	"Goal: {completed}/{goal} days met":
		"Ziel: {completed}/{goal} Tage erreicht",
	'Exported to "{path}" in your vault.':
		'Nach „{path}" in deinem Vault exportiert.',
	"{range} · exported {date}": "{range} · exportiert am {date}",

	// Habit modal
	"New habit": "Neue Gewohnheit",
	Name: "Name",
	Type: "Typ",
	"Binary is done or not done. Repetition counts towards a target. Timed tracks minutes.":
		"Binär ist erledigt oder nicht erledigt. Wiederholung zählt auf ein Ziel hin. Zeitbasiert erfasst Minuten.",
	Binary: "Binär",
	Repetition: "Wiederholung",
	Timed: "Zeitbasiert",
	"Daily target (minutes)": "Tagesziel (Minuten)",
	"Daily target": "Tagesziel",
	Unit: "Einheit",
	"Optional label shown next to the count.":
		"Optionale Beschriftung neben dem Zähler.",
	Icon: "Symbol",
	"Choose a Lucide icon or an emoji to represent this habit.":
		"Wähle ein Lucide-Symbol oder ein Emoji für diese Gewohnheit.",
	Emoji: "Emoji",
	"Choose an emoji": "Emoji wählen",
	"Clear icon": "Symbol entfernen",
	"Choose icon": "Symbol wählen",
	"Save changes": "Änderungen speichern",
	"Targets (optional)": "Ziele (optional)",
	"Set an optional weekly or monthly goal for how many days you complete this habit. For example, hitting your daily goal on all 7 days is a weekly target of 7. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.":
		"Lege optional ein Wochen- oder Monatsziel fest, an wie vielen Tagen du diese Gewohnheit erfüllst. Wer sein Tagesziel z. B. an allen 7 Tagen erreicht, hat ein Wochenziel von 7. Aktiviere einen Perfekt-Schalter, um automatisch jeden Tag des Zeitraums anzustreben, egal wie lang er ist.",
	"Perfect week": "Perfekte Woche",
	"Aim to complete this habit every day of the week.":
		"Strebe an, diese Gewohnheit an jedem Tag der Woche zu erfüllen.",
	"Weekly target": "Wochenziel",
	"Optional. Days to complete per week (max 7).":
		"Optional. Zu erfüllende Tage pro Woche (max. 7).",
	None: "Keins",
	"Perfect month": "Perfekter Monat",
	"Aim to complete this habit every day of the month.":
		"Strebe an, diese Gewohnheit an jedem Tag des Monats zu erfüllen.",
	"Monthly target": "Monatsziel",
	"Optional. Days to complete per month.":
		"Optional. Zu erfüllende Tage pro Monat.",
	Colour: "Farbe",
	"Pick a colour from your theme, or choose a custom one.":
		"Wähle eine Farbe aus deinem Theme oder eine eigene.",
	"Your habit": "Deine Gewohnheit",

	// Icon and colour pickers
	"Search icons…": "Symbole suchen…",
	"Search emojis…": "Emojis suchen…",
	Accent: "Akzent",
	Red: "Rot",
	Orange: "Orange",
	Yellow: "Gelb",
	Green: "Grün",
	Cyan: "Cyan",
	Blue: "Blau",
	Purple: "Lila",
	Pink: "Rosa",
};
