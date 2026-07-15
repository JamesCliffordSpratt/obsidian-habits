import { moment, type Component } from "obsidian";
import { t } from "./i18n";

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
			const parsed = moment(match[1], trimmed, true);
			if (parsed.isValid()) {
				return parsed.toDate();
			}
		}
		return null;
	}
	// Formats with tokens the extractor does not know still work when the
	// note name is exactly the date.
	const whole = moment(name, trimmed, true);
	return whole.isValid() ? whole.toDate() : null;
}
