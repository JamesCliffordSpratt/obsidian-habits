import { moment, type Component } from "obsidian";
import { t } from "./i18n";
import type { HabitDefinition, HabitSortMode } from "./types";

/**
 * Invoke `onTrigger` when the user holds a touch on `el` for half a second
 * without moving — the mobile stand-in for a right-click.
 */
export function registerLongPress(
	component: Component,
	el: HTMLElement,
	onTrigger: (x: number, y: number) => void,
): void {
	let timer: number | null = null;
	let startX = 0;
	let startY = 0;
	const clear = (): void => {
		if (timer !== null) {
			el.win.clearTimeout(timer);
			timer = null;
		}
	};
	component.registerDomEvent(el, "touchstart", (evt: TouchEvent) => {
		const touch = evt.touches[0];
		if (!touch) {
			return;
		}
		startX = touch.clientX;
		startY = touch.clientY;
		clear();
		timer = el.win.setTimeout(() => {
			timer = null;
			onTrigger(startX, startY);
		}, 500);
	});
	component.registerDomEvent(el, "touchmove", (evt: TouchEvent) => {
		const touch = evt.touches[0];
		if (!touch) {
			return;
		}
		if (
			Math.abs(touch.clientX - startX) > 10 ||
			Math.abs(touch.clientY - startY) > 10
		) {
			clear();
		}
	});
	component.registerDomEvent(el, "touchend", clear);
	component.registerDomEvent(el, "touchcancel", clear);
}

/** Format a date as a `YYYY-MM-DD` key using local time. */
export function toDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/** Return a new date offset from `date` by the given number of days. */
export function addDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
}

/** True when two dates fall on the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
	return toDateKey(a) === toDateKey(b);
}

/**
 * Remove characters that are not allowed in vault file names so a habit name
 * can be safely used as a note title.
 */
export function sanitizeFileName(name: string): string {
	return name
		.replace(/[\\/:*?"<>|#^[\]]/g, " ")
		.replace(/\s+/g, " ")
		.replace(/^\.+/, "")
		.trim();
}

/** Human-readable label for a date, e.g. "Today", "Yesterday" or a full date. */
export function friendlyDateLabel(date: Date, today: Date): string {
	if (isSameDay(date, today)) {
		return t("Today");
	}
	if (isSameDay(date, addDays(today, -1))) {
		return t("Yesterday");
	}
	if (isSameDay(date, addDays(today, 1))) {
		return t("Tomorrow");
	}
	return date.toLocaleDateString(undefined, {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

/** Number of days in the given month (`month` is 0-based, as in `Date`). */
export function daysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

/** Parse a `YYYY-MM-DD` key into a local date, or null if malformed. */
export function fromDateKey(key: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
	if (!match) {
		return null;
	}
	return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Moment.js format tokens the note-date extractor understands, longest
 * first so `MMMM` wins over `MM`. Each maps to a regex snippet and notes
 * whether it matches digits (used to add digit boundaries around the
 * pattern, so `YYYYMMDD` does not match inside a longer number).
 */
const FORMAT_TOKENS: [token: string, pattern: string, digits: boolean][] = [
	["YYYY", "\\d{4}", true],
	["YY", "\\d{2}", true],
	["MMMM", "\\p{L}+", false],
	["MMM", "\\p{L}+\\.?", false],
	["MM", "\\d{2}", true],
	["M", "\\d{1,2}", true],
	["DD", "\\d{2}", true],
	["Do", "\\d{1,2}\\p{L}*", true],
	["D", "\\d{1,2}", true],
	["dddd", "\\p{L}+", false],
	["ddd", "\\p{L}+\\.?", false],
	["dd", "\\p{L}+", false],
];

/**
 * Build a regex that finds text shaped like `format` inside a note name,
 * or null when the format uses tokens the extractor does not know.
 */
function noteDatePattern(format: string): RegExp | null {
	let source = "";
	let startsWithDigits = false;
	let endsWithDigits = false;
	let i = 0;
	outer: while (i < format.length) {
		// Moment treats [bracketed] text as literal characters.
		if (format[i] === "[") {
			const close = format.indexOf("]", i);
			const literal = format.slice(i + 1, close < 0 ? undefined : close);
			source += escapeRegExp(literal);
			if (literal.length > 0) {
				endsWithDigits = false;
			}
			i = close < 0 ? format.length : close + 1;
			continue;
		}
		for (const [token, pattern, digits] of FORMAT_TOKENS) {
			if (format.startsWith(token, i)) {
				source += pattern;
				if (source === pattern) {
					startsWithDigits = digits;
				}
				endsWithDigits = digits;
				i += token.length;
				continue outer;
			}
		}
		if (/[A-Za-z]/.test(format[i])) {
			// An unrecognised format token; let the caller fall back to
			// parsing the whole note name with Moment instead.
			return null;
		}
		source += escapeRegExp(format[i]);
		endsWithDigits = false;
		i++;
	}
	if (source.length === 0) {
		return null;
	}
	// Wrap the date in a capture group and require digit boundaries where
	// the pattern starts or ends with digits, so `YYYYMMDD` cannot match
	// inside a longer number. A lookbehind would be neater, but iOS
	// versions before 16.4 do not support them.
	source = "(" + source + ")";
	if (startsWithDigits) {
		source = "(?:^|\\D)" + source;
	}
	if (endsWithDigits) {
		source += "(?!\\d)";
	}
	return new RegExp(source, "u");
}

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The slice of a parsed Moment object that note-date parsing uses. */
interface ParsedMoment {
	isValid(): boolean;
	toDate(): Date;
}

/**
 * Obsidian's bundled Moment.js, typed by hand. Moment's own type
 * definitions are not always resolvable in stricter lint setups, which
 * would otherwise make every call through `moment` unsafely typed.
 */
const parseMoment = moment as unknown as (
	input: string,
	format: string,
	strict: boolean,
) => ParsedMoment;

/**
 * Extract a date from a note name using a Moment.js format such as
 * `YYYY-MM-DD` or `YYYYMMDD`. The date may sit anywhere in the name
 * ("20260701 Monday" matches with `YYYYMMDD`), and the matched text must
 * also parse strictly so ordinary numbers are not mistaken for dates.
 */
export function parseNoteDate(name: string, format: string): Date | null {
	const trimmed = format.trim();
	if (!trimmed) {
		return null;
	}
	const pattern = noteDatePattern(trimmed);
	if (pattern) {
		const match = pattern.exec(name);
		if (match) {
			const parsed = parseMoment(match[1], trimmed, true);
			if (parsed.isValid()) {
				return parsed.toDate();
			}
		}
		return null;
	}
	// Formats with tokens the extractor does not know still work when the
	// note name is exactly the date.
	const whole = parseMoment(name, trimmed, true);
	return whole.isValid() ? whole.toDate() : null;
}

/**
 * Hue (0–360) of a habit's accent colour, used to order colours so
 * similar ones sit together. Only hex colours are parsed — that is what
 * the habit modal's colour picker produces; anything else returns `null`
 * and sorts after the coloured habits.
 */
function colorHue(color: string): number | null {
	const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
	if (!match) {
		return null;
	}
	let hex = match[1];
	if (hex.length === 3) {
		hex = hex.replace(/./g, (c) => c + c);
	}
	const r = parseInt(hex.slice(0, 2), 16) / 255;
	const g = parseInt(hex.slice(2, 4), 16) / 255;
	const b = parseInt(hex.slice(4, 6), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	if (max === min) {
		// Greys have no hue; park them just after the coloured habits.
		return 360;
	}
	const d = max - min;
	let hue: number;
	if (max === r) {
		hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
	} else if (max === g) {
		hue = ((b - r) / d + 2) * 60;
	} else {
		hue = ((r - g) / d + 4) * 60;
	}
	return hue;
}

/** The most recent day a habit was logged, or "" when it never was. */
function lastLoggedDay(habit: HabitDefinition): string {
	let latest = "";
	for (const day of Object.keys(habit.records)) {
		if (day > latest) {
			latest = day;
		}
	}
	return latest;
}

/**
 * Order habits for display. `habits` arrives name-sorted from the store,
 * and every mode falls back to that name order for ties, so the result
 * is always stable. `manualOrder` holds note paths as arranged in
 * settings; habits missing from it (created since) go to the end.
 */
export function sortHabits(
	habits: HabitDefinition[],
	mode: HabitSortMode,
	manualOrder: readonly string[],
): HabitDefinition[] {
	const sorted = [...habits];
	switch (mode) {
		case "color": {
			sorted.sort((a, b) => {
				const ha = a.color ? colorHue(a.color) : null;
				const hb = b.color ? colorHue(b.color) : null;
				if (ha === null && hb === null) {
					return a.name.localeCompare(b.name);
				}
				if (ha === null || hb === null) {
					return ha === null ? 1 : -1;
				}
				return ha - hb || a.name.localeCompare(b.name);
			});
			break;
		}
		case "startDate": {
			sorted.sort(
				(a, b) =>
					a.startDate.localeCompare(b.startDate) ||
					a.name.localeCompare(b.name),
			);
			break;
		}
		case "lastLogged": {
			sorted.sort(
				(a, b) =>
					lastLoggedDay(b).localeCompare(lastLoggedDay(a)) ||
					a.name.localeCompare(b.name),
			);
			break;
		}
		case "manual": {
			const position = new Map(
				manualOrder.map((path, index) => [path, index]),
			);
			sorted.sort((a, b) => {
				const pa = position.get(a.path) ?? Number.MAX_SAFE_INTEGER;
				const pb = position.get(b.path) ?? Number.MAX_SAFE_INTEGER;
				return pa - pb || a.name.localeCompare(b.name);
			});
			break;
		}
		case "name":
			// Already the store's order; nothing to do.
			break;
	}
	return sorted;
}
