/**
 * The three kinds of habit the plugin can track.
 *
 * - `binary`: done or not done on a given day.
 * - `repetition`: a count towards a target (e.g. 8 cups of water).
 * - `timed`: minutes spent towards a target (e.g. 30 minutes of exercise).
 */
export type HabitType = "binary" | "repetition" | "timed";

/**
 * A period during which a habit was paused (inclusive of both ends).
 * An empty `end` means the pause is still ongoing.
 */
export interface HabitPause {
	start: string;
	end: string;
}

/**
 * A single habit, parsed from a note in the habits folder.
 *
 * The note's frontmatter holds the definition, and a `records` map holds the
 * value logged for each day (keyed by `YYYY-MM-DD`).
 */
export interface HabitDefinition {
	/** Path of the backing note. Used as a stable identifier. */
	path: string;
	/** Display name, taken from the note's basename. */
	name: string;
	/** The kind of habit. */
	type: HabitType;
	/**
	 * Daily target. For `repetition` this is a count; for `timed` it is a
	 * number of minutes. Ignored for `binary`.
	 */
	target: number;
	/** Optional unit label shown next to the value (e.g. "cups"). */
	unit: string;
	/**
	 * Optional weekly goal: the number of days the daily goal should be met.
	 * `0` means no target. Ignored when `weeklyPerfect` is true.
	 */
	weeklyTarget: number;
	/** Optional monthly goal, interpreted like `weeklyTarget`. */
	monthlyTarget: number;
	/** When true, the weekly goal is every day of the week. */
	weeklyPerfect: boolean;
	/** When true, the monthly goal is every day of the month. */
	monthlyPerfect: boolean;
	/** Optional Lucide icon id shown on the card. */
	icon: string;
	/** Optional accent colour (any valid CSS colour). */
	color: string;
	/** Date the habit started, as `YYYY-MM-DD`. */
	startDate: string;
	/** True while an open pause exists. Paused days are skipped by stats. */
	paused: boolean;
	/** Every pause period recorded for the habit, including any open one. */
	pauses: HabitPause[];
	/** True when the habit is no longer tracked but keeps its history. */
	stopped: boolean;
	/** Date tracking stopped, as `YYYY-MM-DD` (empty when tracking). */
	stopDate: string;
	/**
	 * Logged values keyed by day (`YYYY-MM-DD`).
	 *
	 * - `binary`: `1` for done, `0`/absent for not done.
	 * - `repetition`: the count logged that day.
	 * - `timed`: the number of minutes logged that day.
	 */
	records: Record<string, number>;
	/** Per-day comments keyed by `YYYY-MM-DD`. */
	comments: Record<string, string>;
}

/** Options used when creating a new habit note. */
export interface NewHabitOptions {
	name: string;
	type: HabitType;
	target: number;
	unit: string;
	weeklyTarget: number;
	monthlyTarget: number;
	weeklyPerfect: boolean;
	monthlyPerfect: boolean;
	icon: string;
	color: string;
}
