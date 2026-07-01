/**
 * The three kinds of habit the plugin can track.
 *
 * - `binary`: done or not done on a given day.
 * - `repetition`: a count towards a target (e.g. 8 cups of water).
 * - `timed`: minutes spent towards a target (e.g. 30 minutes of exercise).
 */
export type HabitType = "binary" | "repetition" | "timed";

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
	 * Optional target for a week. For `binary` this is days completed; for
	 * `repetition`/`timed` it is the total value. `0` means no target.
	 */
	weeklyTarget: number;
	/** Optional target for a month, interpreted like `weeklyTarget`. */
	monthlyTarget: number;
	/** Optional Lucide icon id shown on the card. */
	icon: string;
	/** Optional accent colour (any valid CSS colour). */
	color: string;
	/** Date the habit started, as `YYYY-MM-DD`. */
	startDate: string;
	/**
	 * Logged values keyed by day (`YYYY-MM-DD`).
	 *
	 * - `binary`: `1` for done, `0`/absent for not done.
	 * - `repetition`: the count logged that day.
	 * - `timed`: the number of minutes logged that day.
	 */
	records: Record<string, number>;
}

/** Options used when creating a new habit note. */
export interface NewHabitOptions {
	name: string;
	type: HabitType;
	target: number;
	unit: string;
	weeklyTarget: number;
	monthlyTarget: number;
	icon: string;
	color: string;
}
