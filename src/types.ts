/**
 * The three kinds of habit the plugin can track.
 *
 * - `binary`: done or not done on a given day.
 * - `repetition`: a count towards a target (e.g. 8 cups of water).
 * - `timed`: minutes spent towards a target (e.g. 30 minutes of exercise).
 */
export type HabitType = "binary" | "repetition" | "timed";

/**
 * How often a habit is due.
 *
 * - `daily`: due every day (the original behaviour).
 * - `weekly`: due on one or more chosen weekdays each week.
 * - `monthly`: due once a month, on a chosen day of the month.
 * - `interval`: due every N days, counted from the habit's start date
 *   (e.g. every 2 days for an alternate-day schedule).
 */
export type HabitFrequency = "daily" | "weekly" | "monthly" | "interval";

/**
 * Which way a habit's goal points.
 *
 * - `min`: reach a target — the classic habit (do at least this much).
 * - `max`: stay under a limit — for habits being reduced or avoided
 *   (e.g. at most 2 hours of gaming, or no smoking at all).
 *
 * Absent from frontmatter means `min`, so every note written before this
 * field existed keeps its original meaning untouched.
 */
export type GoalDirection = "min" | "max";

/**
 * The base order of habit cards in the dashboard and side panel.
 *
 * - `name`: alphabetical by note name (the original behaviour).
 * - `color`: by accent colour hue, so similar colours sit together.
 * - `startDate`: oldest habit first — the order habits were created in.
 * - `lastLogged`: most recently logged first.
 * - `group`: by group, following the arranged group order.
 * - `manual`: the order the user arranged in settings.
 */
export type HabitSortMode =
	| "name"
	| "color"
	| "startDate"
	| "lastLogged"
	| "group"
	| "manual";

/**
 * Shared styling for a group, stored once in the plugin settings (keyed
 * by group name) so every member card stays in step and renaming a
 * habit's group re-links it instead of duplicating style per note.
 */
export interface GroupStyle {
	/** Optional accent colour shared by the group ("" = none). */
	color: string;
	/** Optional Lucide icon id or emoji shown in group lips and headers. */
	icon: string;
}

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
	 * Whether the goal is a target to reach (`min`) or a limit to stay
	 * under (`max`). For `max` habits `target` is the limit — `0` means
	 * "none at all" — and a binary `max` habit's limit is always `0`
	 * (any logged value is a slip).
	 */
	goalDirection: GoalDirection;
	/** How often the habit is due. Defaults to `daily`. */
	frequency: HabitFrequency;
	/**
	 * Days of the week a weekly habit is due, as JavaScript `getDay` values
	 * (`0` = Sunday … `6` = Saturday), sorted and without duplicates. Only
	 * meaningful when `frequency` is `weekly`. Stored in frontmatter as a
	 * scalar `weekday` when there is one day (the original format) or as a
	 * `weekdays` list when there are several.
	 */
	weekdays: number[];
	/**
	 * Day of the month a monthly habit is due (`1`–`31`). Only meaningful when
	 * `frequency` is `monthly`. In months shorter than the chosen day it is
	 * clamped to the last day of that month (so `31` acts as "last day").
	 */
	monthDay: number;
	/**
	 * Number of days between due dates (`2`–`365`), counted from the habit's
	 * start date. Only meaningful when `frequency` is `interval`; `2` gives an
	 * alternate-day schedule.
	 */
	intervalDays: number;
	/**
	 * Optional time of day the habit is planned for, as 24-hour `HH:mm`.
	 * Purely informational: it is shown alongside the schedule on the habit's
	 * card and does not affect when the habit is due. Empty means no time.
	 */
	time: string;
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
	/**
	 * Optional group name used to build dashboard sections (e.g. an area
	 * of responsibility). Empty means ungrouped.
	 */
	group: string;
	/**
	 * When true and the habit's group has a colour, the card is shown in
	 * the group colour instead of its own.
	 */
	useGroupColor: boolean;
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
	goalDirection: GoalDirection;
	frequency: HabitFrequency;
	weekdays: number[];
	monthDay: number;
	intervalDays: number;
	time: string;
	target: number;
	unit: string;
	weeklyTarget: number;
	monthlyTarget: number;
	weeklyPerfect: boolean;
	monthlyPerfect: boolean;
	icon: string;
	color: string;
	group: string;
	useGroupColor: boolean;
}
