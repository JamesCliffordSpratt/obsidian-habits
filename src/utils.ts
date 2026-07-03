import type { Component } from "obsidian";

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
		return "Today";
	}
	if (isSameDay(date, addDays(today, -1))) {
		return "Yesterday";
	}
	if (isSameDay(date, addDays(today, 1))) {
		return "Tomorrow";
	}
	return date.toLocaleDateString(undefined, {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

/** Parse a `YYYY-MM-DD` key into a local date, or null if malformed. */
export function fromDateKey(key: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
	if (!match) {
		return null;
	}
	return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
