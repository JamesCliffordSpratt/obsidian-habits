/** German translations, keyed by the English source string. */
export const de: Record<string, string> = {
	// Commands and ribbon
	"Create habit": "Gewohnheit erstellen",
	"Insert dashboard": "Dashboard einfügen",
	"Insert habit metrics": "Gewohnheits-Metriken einfügen",
	"Insert habits table": "Gewohnheitstabelle einfügen",
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
	"Daily note date format": "Datumsformat der täglichen Notiz",
	"Moment.js format used to read the date from a daily note's name, such as YYYY-MM-DD or YYYYMMDD.":
		"Moment.js-Format, mit dem das Datum aus dem Namen einer täglichen Notiz gelesen wird, zum Beispiel YYYY-MM-DD oder YYYYMMDD.",

	// Sorting
	"Sort habits by": "Gewohnheiten sortieren nach",
	"The base order of habit cards in the dashboard and side panel.":
		"Die Grundreihenfolge der Gewohnheitskarten im Dashboard und im Seitenpanel.",
	"Name (A–Z)": "Name (A–Z)",
	Color: "Farbe",
	"Last logged": "Zuletzt protokolliert",
	Manual: "Manuell",
	"Manual order": "Manuelle Reihenfolge",
	"Drag the cards into the order you want. New habits join the end of the list.":
		"Ziehe die Karten in die gewünschte Reihenfolge. Neue Gewohnheiten werden am Ende der Liste eingefügt.",
	"Move completed cards to the end":
		"Erledigte Karten ans Ende verschieben",
	"Completed habits drift to the end of the queue and paused ones park behind them. Turn this off to keep every card in its sorted position.":
		"Erledigte Gewohnheiten wandern ans Ende der Warteschlange, pausierte dahinter. Deaktiviere dies, damit jede Karte an ihrer sortierten Position bleibt.",
	Group: "Gruppe",
	Ungrouped: "Ohne Gruppe",
	"Optional group used to build dashboard sections — for example an area of responsibility.":
		"Optionale Gruppe für Abschnitte im Dashboard — zum Beispiel ein Verantwortungsbereich.",
	"e.g. Health": "z. B. Gesundheit",
	"Group color": "Gruppenfarbe",
	"Optional color shared by every habit in this group.":
		"Optionale Farbe, die alle Gewohnheiten dieser Gruppe teilen.",
	"Group icon": "Gruppensymbol",
	"Shown in the group lip on cards and in section headers.":
		"Wird in der Gruppenleiste auf Karten und in Abschnittsüberschriften angezeigt.",
	"Use group color for this card": "Gruppenfarbe für diese Karte verwenden",
	"Show this card in the group color instead of its own.":
		"Zeigt diese Karte in der Gruppenfarbe statt in ihrer eigenen.",
	General: "Allgemein",
	Sorting: "Sortierung",
	Groups: "Gruppen",
	"How to move through your habit cards: a paged carousel with arrows, a grid that wraps onto new rows, or a fixed-height grid that scrolls vertically. The stats page follows the same choice.":
		"Wie du durch deine Gewohnheitskarten navigierst: ein seitenweises Karussell mit Pfeilen, ein Raster, das in neue Zeilen umbricht, oder ein Raster mit fester Höhe, das vertikal scrollt. Die Statistikseite folgt derselben Auswahl.",
	"Enable groups": "Gruppen aktivieren",
	"Show habits in sections by their group, with a group lip on each card.":
		"Zeigt Gewohnheiten in Abschnitten nach Gruppe, mit einer Gruppenleiste auf jeder Karte.",
	"Group order": "Gruppenreihenfolge",
	"Drag the groups into the order you want. Sections follow the same order.":
		"Ziehe die Gruppen in die gewünschte Reihenfolge. Abschnitte folgen derselben Reihenfolge.",
	"Group the habits table": "Gewohnheitstabelle gruppieren",
	"Group the rows of habits-table blocks by habit group, with a heading row per group. Turn off for one flat list ordered by planned time.":
		"Gruppiert die Zeilen von habits-table-Blöcken nach Gewohnheitsgruppe, mit einer Überschriftszeile pro Gruppe. Ausschalten für eine flache Liste, sortiert nach geplanter Uhrzeit.",
	"Manage groups": "Gruppen verwalten",
	"See every habit by group and drag cards between groups.":
		"Zeigt alle Gewohnheiten nach Gruppe und erlaubt das Ziehen von Karten zwischen Gruppen.",
	Open: "Öffnen",
	"New group": "Neue Gruppe",
	Add: "Hinzufügen",
	"Drag habits between groups to reassign them, or within a group to reorder them.":
		"Ziehe Gewohnheiten zwischen Gruppen, um sie neu zuzuordnen, oder innerhalb einer Gruppe, um sie zu sortieren.",
	"No habits": "Keine Gewohnheiten",
	"Edit group style": "Gruppenstil bearbeiten",
	"Delete group": "Gruppe löschen",
	'Delete "{name}"? Its habits are kept and become ungrouped.':
		'Gruppe "{name}" löschen? Ihre Gewohnheiten bleiben erhalten und werden gruppenlos.',
	Delete: "Löschen",
	"Dashboard layout": "Dashboard-Layout",
	Carousel: "Karussell",
	Grid: "Raster",
	"Vertical scroll": "Vertikales Scrollen",
	"Cards per view": "Karten pro Ansicht",
	"How many habit cards fit side by side on wider screens.":
		"Wie viele Gewohnheitskarten auf breiten Bildschirmen nebeneinander passen.",
	"Cards per view on mobile": "Karten pro Ansicht auf dem Handy",
	"How many habit cards fit side by side on phone-sized screens.":
		"Wie viele Gewohnheitskarten auf Handy-Bildschirmen nebeneinander passen.",

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

	// Comments
	"Comments on cards": "Kommentare auf Karten",
	"Show a comment flap on dashboard cards for jotting a note about any day.":
		"Zeigt eine Kommentarlasche auf den Dashboard-Karten, um Notizen zu einzelnen Tagen festzuhalten.",
	"Add comment": "Kommentar hinzufügen",
	"Flip back": "Zurückdrehen",
	"Add a comment for this day…": "Füge einen Kommentar für diesen Tag hinzu…",
	Comments: "Kommentare",
	"+{n} more": "+{n} weitere",

	// Limit habits (experimental)
	Experimental: "Experimentell",
	"These features are still being tested and may change before they become permanent. Turning one off only hides it from menus — anything you created with it keeps working.":
		"Diese Funktionen werden noch getestet und können sich ändern, bevor sie dauerhaft werden. Das Ausschalten blendet sie nur aus den Menüs aus — alles, was du damit erstellt hast, funktioniert weiter.",
	"Break bad habits": "Schlechte Gewohnheiten ablegen",
	"Track habits you want to reduce or avoid by staying under a daily limit — for example at most 2 hours of gaming, or no smoking at all.":
		"Verfolge Gewohnheiten, die du reduzieren oder vermeiden möchtest, indem du unter einem Tageslimit bleibst — zum Beispiel höchstens 2 Stunden Gaming oder gar nicht rauchen.",
	Goal: "Ziel",
	"Reach a target for habits you are building. Stay under a limit for habits you are cutting down or giving up.":
		"Erreiche ein Ziel bei Gewohnheiten, die du aufbaust. Bleibe unter einem Limit bei Gewohnheiten, die du reduzierst oder aufgibst.",
	"Reach a target": "Ein Ziel erreichen",
	"Stay under a limit": "Unter einem Limit bleiben",
	"Binary means avoiding it entirely. Repetition counts against a daily limit. Timed tracks minutes against a daily limit.":
		"Binär bedeutet, es ganz zu vermeiden. Wiederholung zählt gegen ein Tageslimit. Zeit misst Minuten gegen ein Tageslimit.",
	"Daily limit": "Tageslimit",
	"Daily limit (minutes)": "Tageslimit (Minuten)",
	"0 means none at all.": "0 bedeutet gar nicht.",
	"Set an optional weekly or monthly goal for how many days you stay within your limit. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.":
		"Lege ein optionales Wochen- oder Monatsziel fest, an wie vielen Tagen du innerhalb deines Limits bleibst. Aktiviere einen Perfekt-Schalter, um automatisch jeden Tag des Zeitraums anzustreben, egal wie lang er ist.",
	Clean: "Sauber",
	Slipped: "Ausgerutscht",
	"Mark as clean": "Als sauber markieren",
	"Mark as slipped": "Als ausgerutscht markieren",
	"Days within limit": "Tage im Limit",
	Limit: "Limit",

	// Frequencies and per-note metrics
	Frequency: "Häufigkeit",
	Daily: "Täglich",
	"Days of week": "Wochentage",
	Habit: "Gewohnheit",
	Schedule: "Zeitplan",
	"Time of day": "Uhrzeit",
	"Optional times this habit is planned for — once or several times a day. Shown on the habit's card.":
		"Optionale Uhrzeiten, zu denen diese Gewohnheit geplant ist — einmal oder mehrmals täglich. Werden auf der Karte der Gewohnheit angezeigt.",
	"Add time": "Uhrzeit hinzufügen",
	"Remove time": "Uhrzeit entfernen",
	"Every N days": "Alle N Tage",
	"Repeat every": "Wiederholen alle",
	"Day of month": "Tag des Monats",
	"How often this habit is due. Weekly and monthly habits only appear on their due date.":
		"Wie oft diese Gewohnheit fällig ist. Wöchentliche und monatliche Gewohnheiten erscheinen nur an ihrem Fälligkeitstag.",
	"The weekdays this habit is due on. Pick as many as you need.":
		"Die Wochentage, an denen diese Gewohnheit fällig ist. Wähle so viele wie nötig.",
	"Number of days between due dates, counted from the habit's start date. Use 2 for an alternate-day schedule.":
		"Anzahl der Tage zwischen den Fälligkeiten, gezählt ab dem Startdatum der Gewohnheit. 2 ergibt einen Rhythmus von jedem zweiten Tag.",
	"The day of the month this habit is due. In shorter months it falls due on the last day, so 31 always lands on the final day of the month.":
		"Der Tag des Monats, an dem diese Gewohnheit fällig ist. In kürzeren Monaten fällt sie auf den letzten Tag, sodass 31 immer auf den letzten Tag des Monats fällt.",
	"Every {day}": "Jeden {day}",
	"Monthly · day {day}": "Monatlich · Tag {day}",
	"Every other day": "Jeden zweiten Tag",
	"Every {n} days": "Alle {n} Tage",
	"No habits are due on this day.":
		"An diesem Tag sind keine Gewohnheiten fällig.",
	"Nothing due today.": "Heute ist nichts fällig.",
	"Weekly activity": "Wöchentliche Aktivität",
	"Monthly activity": "Monatliche Aktivität",
	"Activity on due days": "Aktivität an Fälligkeitstagen",
	"Completion rate over {n} due days":
		"Erfolgsquote über {n} Fälligkeitstage",
	"Weeks completed": "Abgeschlossene Wochen",
	"Months completed": "Abgeschlossene Monate",
	"Recent rate": "Aktuelle Quote",
	"{n}-week completion rate": "Erfüllungsquote über {n} Wochen",
	"{n}-month completion rate": "Erfüllungsquote über {n} Monate",

	// AI summaries
	"AI summaries": "KI-Zusammenfassungen",
	"AI summary": "KI-Zusammenfassung",
	"Show an AI-generated summary with feedback and advice on the stats page tabs. Uses an OpenAI-compatible service you configure below; your habit stats are sent to it only when you press the generate button.":
		"Zeigt eine KI-generierte Zusammenfassung mit Feedback und Tipps auf den Tabs der Statistik-Seite. Verwendet einen OpenAI-kompatiblen Dienst, den du unten konfigurierst; deine Gewohnheits-Statistiken werden erst gesendet, wenn du den Erstellen-Button drückst.",
	"AI base URL": "KI-Basis-URL",
	"Base URL of an OpenAI-compatible API. Works with OpenAI, OpenRouter, or local servers like Ollama (http://localhost:11434/v1).":
		"Basis-URL einer OpenAI-kompatiblen API. Funktioniert mit OpenAI, OpenRouter oder lokalen Servern wie Ollama (http://localhost:11434/v1).",
	"AI API key": "KI-API-Schlüssel",
	"Stored locally in this vault's plugin data. Leave blank for local servers that need no key.":
		"Wird lokal in den Plugin-Daten dieses Vaults gespeichert. Für lokale Server ohne Schlüssel leer lassen.",
	"AI model": "KI-Modell",
	"Model name the service should use.":
		"Name des Modells, das der Dienst verwenden soll.",
	"Generate summary": "Zusammenfassung erstellen",
	Regenerate: "Neu erstellen",
	"Get feedback and advice on your habits for this period. Your stats are sent to the AI service you configured only when you press the button.":
		"Erhalte Feedback und Tipps zu deinen Gewohnheiten in diesem Zeitraum. Deine Statistiken werden erst an den konfigurierten KI-Dienst gesendet, wenn du den Button drückst.",
	"Thinking…": "Denkt nach …",
	"Could not generate a summary: {message}":
		"Zusammenfassung konnte nicht erstellt werden: {message}",
	"Adds an AI-generated overview with feedback and advice. Your habit stats are sent to your configured AI service.":
		"Fügt einen KI-generierten Überblick mit Feedback und Tipps hinzu. Deine Gewohnheits-Statistiken werden an den konfigurierten KI-Dienst gesendet.",
	"Generating AI summary…": "KI-Zusammenfassung wird erstellt …",
	"The AI summary will be generated when you export.":
		"Die KI-Zusammenfassung wird beim Exportieren erstellt.",

	// Custom stats range
	Custom: "Benutzerdefiniert",
	"Start date": "Startdatum",
	"End date": "Enddatum",

	// Heatmap start markers
	"not tracked yet": "noch nicht erfasst",
	"started tracking on {date}": "Erfassung ab {date}",

	// Stats carousel
	"Stats rows per page": "Statistik-Zeilen pro Seite",
	"How many habits each stats page shows.":
		"Wie viele Gewohnheiten jede Statistik-Seite anzeigt.",
};
