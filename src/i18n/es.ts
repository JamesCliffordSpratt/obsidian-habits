/** Spanish translations, keyed by the English source string. */
export const es: Record<string, string> = {
	// Commands and ribbon
	"Create habit": "Crear hábito",
	"Insert dashboard": "Insertar panel de hábitos",
	"Insert habit metrics": "Insertar métricas de hábito",
	"Open panel": "Abrir panel",
	"Open habits panel": "Abrir el panel de hábitos",
	Habits: "Hábitos",

	// Settings
	"Habits folder": "Carpeta de hábitos",
	"Folder where each habit is stored as its own note. It is created automatically if it does not exist.":
		"Carpeta donde cada hábito se guarda como una nota propia. Se crea automáticamente si no existe.",
	"Follow daily note date": "Seguir la fecha de la nota diaria",
	"When a dashboard is embedded in a daily note (a note whose name contains a date like 2026-07-01), open it on that note's date instead of today.":
		"Cuando un panel está insertado en una nota diaria (una nota cuyo nombre contiene una fecha como 2026-07-01), se abre en la fecha de esa nota en lugar de hoy.",
	"Cards per view": "Tarjetas por vista",
	"How many habit cards the carousel shows at once on wider screens.":
		"Cuántas tarjetas de hábitos muestra el carrusel a la vez en pantallas anchas.",
	"Cards per view on mobile": "Tarjetas por vista en el móvil",
	"How many habit cards the carousel shows at once on phone-sized screens.":
		"Cuántas tarjetas de hábitos muestra el carrusel a la vez en pantallas de teléfono.",

	// Confirm dialog defaults
	Cancel: "Cancelar",
	Confirm: "Confirmar",

	// Store notices
	'Could not find the note for "{name}".':
		'No se encontró la nota de "{name}".',
	"Please enter a valid habit name.":
		"Introduce un nombre de hábito válido.",
	'A habit called "{name}" already exists.':
		'Ya existe un hábito llamado "{name}".',
	'Created habit "{name}".': 'Hábito "{name}" creado.',
	'Updated "{name}".': '"{name}" actualizado.',
	'Paused "{name}".': '"{name}" pausado.',
	'Resumed "{name}".': '"{name}" reanudado.',
	'Stopped tracking "{name}". Its history is kept in the note.':
		'Se dejó de seguir "{name}". Su historial se conserva en la nota.',
	'Resumed tracking "{name}".': 'Se reanudó el seguimiento de "{name}".',
	'Removed "{name}".': '"{name}" eliminado.',
	"Habit added to the dashboard.": "Hábito añadido al panel.",

	// Dashboard
	"Back to habits": "Volver a los hábitos",
	"View stats": "Ver estadísticas",
	"Export stats": "Exportar estadísticas",
	Weekly: "Semanal",
	Monthly: "Mensual",
	"Previous day": "Día anterior",
	"Next day": "Día siguiente",
	"Choose a date": "Elegir una fecha",
	"Add habit": "Añadir hábito",
	"No habits yet. Create your first habit to get started.":
		"Aún no hay hábitos. Crea tu primer hábito para empezar.",
	Previous: "Anterior",
	Next: "Siguiente",
	"Go to position {n}": "Ir a la posición {n}",
	"Right-click or long-press for more options":
		"Clic derecho o pulsación larga para más opciones",
	"Open habit note": "Abrir la nota del hábito",
	"Open the note for {name}": "Abrir la nota de {name}",
	Paused: "Pausado",
	"Since {date} · right-click to resume":
		"Desde {date} · clic derecho para reanudar",
	"Paused on this day": "Pausado en este día",
	"Mark as done": "Marcar como hecho",
	"Mark as not done": "Marcar como no hecho",
	Done: "Hecho",
	"Not done": "Pendiente",
	"Edit value": "Editar valor",
	Value: "Valor",
	"Decrease by 1": "Reducir en 1",
	"Increase by 1": "Aumentar en 1",
	"Increase by {n}": "Aumentar en {n}",
	"Edit habit": "Editar hábito",
	"Pause habit": "Pausar hábito",
	"Resume habit": "Reanudar hábito",
	"Stop tracking": "Dejar de seguir",
	"Remove habit": "Eliminar hábito",
	'Stop tracking "{name}"? It leaves the dashboard and stats, but its note and full history are kept. You can resume tracking any time from the note\'s metrics view.':
		'¿Dejar de seguir "{name}"? Desaparece del panel y de las estadísticas, pero su nota y todo su historial se conservan. Puedes reanudar el seguimiento en cualquier momento desde la vista de métricas de la nota.',
	'Remove "{name}"? Its note will be moved to the trash.':
		'¿Eliminar "{name}"? Su nota se moverá a la papelera.',
	Remove: "Eliminar",
	"Perfect!": "¡Perfecto!",
	Today: "Hoy",
	Yesterday: "Ayer",
	Tomorrow: "Mañana",
	"Last 7 days": "Últimos 7 días",
	"Last 30 days": "Últimos 30 días",
	"This week": "Esta semana",
	"This month": "Este mes",

	// Sidebar panel
	"Habits completed today": "Hábitos completados hoy",
	"No habits yet.": "Aún no hay hábitos.",
	"Click to type a value": "Haz clic para escribir un valor",
	"Open note": "Abrir nota",

	// Stats view
	"No habits to show stats for yet.":
		"Aún no hay hábitos para mostrar estadísticas.",
	Completion: "Cumplimiento",
	"Best streak": "Mejor racha",
	"Perfect days": "Días perfectos",
	Completions: "Completados",
	"Goals met": "Metas logradas",
	"{completed}/{days} days": "{completed}/{days} días",
	"{total} total": "{total} en total",
	best: "mejor",
	"perfect week": "semana perfecta",
	"perfect month": "mes perfecto",
	"weekly goal": "meta semanal",
	"monthly goal": "meta mensual",
	"{progress}/{goal} days · {label} · {pct}%":
		"{progress}/{goal} días · {label} · {pct}%",

	// Habit metrics block
	'Place this block inside a habit note, or point it at one with "habit: <name>".':
		'Coloca este bloque dentro de una nota de hábito, o indícale uno con "habit: <nombre>".',
	'No habit called "{name}" was found.':
		'No se encontró ningún hábito llamado "{name}".',
	"No longer tracked since {date}. All history is kept.":
		"Sin seguimiento desde {date}. Todo el historial se conserva.",
	"No longer tracked. All history is kept.":
		"Sin seguimiento. Todo el historial se conserva.",
	"Resume tracking": "Reanudar seguimiento",
	"Paused since {date}. Paused days don't count against streaks or stats.":
		"Pausado desde {date}. Los días en pausa no afectan a las rachas ni a las estadísticas.",
	"Paused. Paused days don't count against streaks or stats.":
		"Pausado. Los días en pausa no afectan a las rachas ni a las estadísticas.",
	"Current streak": "Racha actual",
	"Days completed": "Días completados",
	"30-day rate": "Tasa de 30 días",
	"Weekly completion rate": "Tasa de cumplimiento semanal",
	Logged: "Registrado",
	Target: "Objetivo",

	// Export modal
	Title: "Título",
	"Habits report": "Informe de hábitos",
	"Date range": "Rango de fechas",
	"Custom range": "Rango personalizado",
	From: "Desde",
	To: "Hasta",
	"Up to {n} days.": "Hasta {n} días.",
	Content: "Contenido",
	"Summary tiles": "Mosaicos de resumen",
	"Completion trend chart": "Gráfico de tendencia de cumplimiento",
	"Daily grids": "Cuadrículas diarias",
	"Goal progress": "Progreso de metas",
	Layout: "Diseño",
	Orientation: "Orientación",
	Portrait: "Vertical",
	Landscape: "Horizontal",
	Density: "Densidad",
	Comfortable: "Cómodo",
	Compact: "Compacto",
	Monochrome: "Monocromo",
	"Ink-friendly greys instead of accent colours.":
		"Grises que ahorran tinta en lugar de colores de acento.",
	"Export PDF": "Exportar PDF",
	"No habits to export yet.": "Aún no hay hábitos para exportar.",
	"Completion trend": "Tendencia de cumplimiento",
	"(paused)": "(pausado)",
	"{rate}% · {total} · streak {current} (best {best})":
		"{rate}% · {total} · racha {current} (mejor {best})",
	"Goal: {completed}/{goal} days met":
		"Meta: {completed}/{goal} días logrados",
	'Exported to "{path}" in your vault.':
		'Exportado a "{path}" en tu bóveda.',
	"{range} · exported {date}": "{range} · exportado el {date}",

	// Habit modal
	"New habit": "Nuevo hábito",
	Name: "Nombre",
	Type: "Tipo",
	"Binary is done or not done. Repetition counts towards a target. Timed tracks minutes.":
		"Binario es hecho o no hecho. Repetición cuenta hacia un objetivo. Temporizado registra minutos.",
	Binary: "Binario",
	Repetition: "Repetición",
	Timed: "Temporizado",
	"Daily target (minutes)": "Objetivo diario (minutos)",
	"Daily target": "Objetivo diario",
	Unit: "Unidad",
	"Optional label shown next to the count.":
		"Etiqueta opcional que se muestra junto al recuento.",
	Icon: "Icono",
	"Choose a Lucide icon or an emoji to represent this habit.":
		"Elige un icono de Lucide o un emoji para representar este hábito.",
	Emoji: "Emoji",
	"Choose an emoji": "Elegir un emoji",
	"Clear icon": "Quitar icono",
	"Choose icon": "Elegir icono",
	"Save changes": "Guardar cambios",
	"Targets (optional)": "Metas (opcional)",
	"Set an optional weekly or monthly goal for how many days you complete this habit. For example, hitting your daily goal on all 7 days is a weekly target of 7. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.":
		"Establece una meta semanal o mensual opcional de cuántos días completas este hábito. Por ejemplo, lograr tu objetivo diario los 7 días es una meta semanal de 7. Activa un interruptor de perfección para aspirar automáticamente a todos los días del período, sea cual sea su duración.",
	"Perfect week": "Semana perfecta",
	"Aim to complete this habit every day of the week.":
		"Aspira a completar este hábito todos los días de la semana.",
	"Weekly target": "Meta semanal",
	"Optional. Days to complete per week (max 7).":
		"Opcional. Días a completar por semana (máx. 7).",
	None: "Ninguno",
	"Perfect month": "Mes perfecto",
	"Aim to complete this habit every day of the month.":
		"Aspira a completar este hábito todos los días del mes.",
	"Monthly target": "Meta mensual",
	"Optional. Days to complete per month.":
		"Opcional. Días a completar por mes.",
	Colour: "Color",
	"Pick a colour from your theme, or choose a custom one.":
		"Elige un color de tu tema o escoge uno personalizado.",
	"Your habit": "Tu hábito",

	// Icon and colour pickers
	"Search icons…": "Buscar iconos…",
	"Search emojis…": "Buscar emojis…",
	Accent: "Acento",
	Red: "Rojo",
	Orange: "Naranja",
	Yellow: "Amarillo",
	Green: "Verde",
	Cyan: "Cian",
	Blue: "Azul",
	Purple: "Morado",
	Pink: "Rosa",

	// Comments
	"Comments on cards": "Comentarios en las tarjetas",
	"Show a comment flap on dashboard cards for jotting a note about any day.":
		"Muestra una pestaña de comentarios en las tarjetas del panel para anotar cualquier día.",
	"Add comment": "Añadir comentario",
	"Flip back": "Volver a girar",
	"Add a comment for this day…": "Añade un comentario para este día…",
	Comments: "Comentarios",
	"+{n} more": "+{n} más",

	// Limit habits (experimental)
	Experimental: "Experimental",
	"These features are still being tested and may change before they become permanent. Turning one off only hides it from menus — anything you created with it keeps working.":
		"Estas funciones aún se están probando y pueden cambiar antes de ser permanentes. Desactivarlas solo las oculta de los menús: todo lo que hayas creado con ellas sigue funcionando.",
	"Break bad habits": "Romper malos hábitos",
	"Track habits you want to reduce or avoid by staying under a daily limit — for example at most 2 hours of gaming, or no smoking at all.":
		"Controla hábitos que quieres reducir o evitar manteniéndote por debajo de un límite diario — por ejemplo, como máximo 2 horas de videojuegos, o no fumar en absoluto.",
	Goal: "Objetivo",
	"Reach a target for habits you are building. Stay under a limit for habits you are cutting down or giving up.":
		"Alcanza una meta para hábitos que estás construyendo. Mantente bajo un límite para hábitos que estás reduciendo o dejando.",
	"Reach a target": "Alcanzar una meta",
	"Stay under a limit": "Mantenerse bajo un límite",
	"Binary means avoiding it entirely. Repetition counts against a daily limit. Timed tracks minutes against a daily limit.":
		"Binario significa evitarlo por completo. Repetición cuenta contra un límite diario. Cronometrado mide minutos contra un límite diario.",
	"Daily limit": "Límite diario",
	"Daily limit (minutes)": "Límite diario (minutos)",
	"0 means none at all.": "0 significa nada en absoluto.",
	"Set an optional weekly or monthly goal for how many days you stay within your limit. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.":
		"Establece una meta semanal o mensual opcional de cuántos días te mantienes dentro de tu límite. Activa un interruptor de perfección para aspirar automáticamente a todos los días del período, sea cual sea su duración.",
	Clean: "Limpio",
	Slipped: "Recaída",
	"Mark as clean": "Marcar como limpio",
	"Mark as slipped": "Marcar como recaída",
	"Days within limit": "Días dentro del límite",
	Limit: "Límite",
};
