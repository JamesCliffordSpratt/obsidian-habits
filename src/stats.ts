import type { HabitDefinition } from "./types";
import { addDays, daysInMonth, fromDateKey, toDateKey } from "./utils";

const MS_PER_DAY = 86_400_000;

export type StatsPeriod = "weekly" | "monthly" | "custom";
export type StatsRangeMode = "rolling" | "calendar";

/**
 * Longest span a custom range may cover. Keeps the per-habit heatmaps
 * renderable — a full year is 366 cells; an accidental decade would be
 * thousands.
 */
export const MAX_CUSTOM_DAYS = 366;

export interface DateRange {
	start: Date;
	end: Date;
}

/** Midnight of the given date, in local time. */
function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Monday of the week containing the given date. */
function startOfWeek(date: Date): Date {
	const base = startOfDay(date);
	const offset = (base.getDay() + 6) % 7; // Monday = 0
	return addDays(base, -offset);
}

/** Number of whole days from start to end, inclusive. */
export function rangeLength(range: DateRange): number {
	return (
		Math.round((range.start.getTime() - range.end.getTime()) / -MS_PER_DAY) +
		1
	);
}

/**
 * Bring a user-picked custom range into canonical form: reversed ends are
 * swapped, times are stripped, and the span is capped at
 * {@link MAX_CUSTOM_DAYS} (keeping the chosen end). Without a range, the
 * last 14 days are used as a sensible starting point.
 */
export function normalizeCustomRange(
	custom: DateRange | undefined,
	today: Date,
): DateRange {
	const base = startOfDay(today);
	if (!custom) {
		return { start: addDays(base, -13), end: base };
	}
	let start = startOfDay(custom.start);
	let end = startOfDay(custom.end);
	if (start.getTime() > end.getTime()) {
		[start, end] = [end, start];
	}
	if (rangeLength({ start, end }) > MAX_CUSTOM_DAYS) {
		start = addDays(end, -(MAX_CUSTOM_DAYS - 1));
	}
	return { start, end };
}

/**
 * Resolve the date range for a period and mode.
 *
 * - rolling: the last 7 or 30 days ending today.
 * - calendar: the current week (Monday–Sunday) or current month (dynamic).
 * - custom period: the user-picked range (normalized); `mode` is ignored.
 */
export function getStatsRange(
	today: Date,
	period: StatsPeriod,
	mode: StatsRangeMode,
	custom?: DateRange,
): DateRange {
	if (period === "custom") {
		return normalizeCustomRange(custom, today);
	}
	const base = startOfDay(today);
	if (mode === "rolling") {
		const length = period === "weekly" ? 7 : 30;
		return { start: addDays(base, -(length - 1)), end: base };
	}
	if (period === "weekly") {
		const start = startOfWeek(base);
		return { start, end: addDays(start, 6) };
	}
	const start = new Date(base.getFullYear(), base.getMonth(), 1);
	const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
	return { start, end };
}

/**
 * The day of the month a monthly habit falls due in the given month, clamped
 * to the month's length. A habit set to the 31st therefore lands on the last
 * day of shorter months (e.g. 28 or 29 in February) rather than being skipped.
 */
export function effectiveMonthDay(
	year: number,
	month: number,
	monthDay: number,
): number {
	const length = daysInMonth(year, month);
	return Math.min(Math.max(1, monthDay), length);
}

/**
 * True when the habit is due on the given date.
 *
 * - `daily` habits are due every day.
 * - `weekly` habits are due on their chosen weekday.
 * - `monthly` habits are due on their chosen day of the month, clamped to the
 *   month's last day when the month is shorter.
 */
export function isDue(habit: HabitDefinition, date: Date): boolean {
	if (habit.frequency === "weekly") {
		return date.getDay() === habit.weekday;
	}
	if (habit.frequency === "monthly") {
		return (
			date.getDate() ===
			effectiveMonthDay(
				date.getFullYear(),
				date.getMonth(),
				habit.monthDay,
			)
		);
	}
	return true;
}

/**
 * The limit a `max` habit must stay under. Binary limit habits are always
 * "none at all" (any logged value is a slip); counter and timed habits use
 * `target` as the limit, where `0` is a valid "zero allowed" limit.
 */
export function limitOf(habit: HabitDefinition): number {
	if (habit.type === "binary") {
		return 0;
	}
	return Math.max(0, habit.target);
}

/**
 * The first day a habit counts towards scoring.
 *
 * Days before a habit existed must not count at all: for `max` habits an
 * unlogged day scores as "within limit", so without a lower bound every day
 * since the beginning of time would count as a success — and for `min`
 * habits every pre-start day would count as a failure, deflating rates.
 * Habits normally carry a `startDate`; for hand-written notes without one,
 * the earliest record is used, and a habit with neither only starts scoring
 * today.
 */
export function trackingStartKey(
	habit: HabitDefinition,
	today: Date = new Date(),
): string {
	if (habit.startDate !== "") {
		return habit.startDate;
	}
	const keys = Object.keys(habit.records);
	if (keys.length > 0) {
		return keys.reduce((min, key) => (key < min ? key : min));
	}
	return toDateKey(today);
}

/**
 * True when a habit met its goal on the given day.
 *
 * For `min` habits: the logged value reached the target.
 * For `max` habits: the logged value stayed at or under the limit — an
 * unlogged day counts as within limit, but only from the habit's start
 * day onward (see {@link limitStartKey}).
 */
export function isComplete(habit: HabitDefinition, dateKey: string): boolean {
	const value = habit.records[dateKey] ?? 0;
	if (habit.goalDirection === "max") {
		if (dateKey < trackingStartKey(habit)) {
			return false;
		}
		return value <= limitOf(habit);
	}
	if (habit.type === "binary") {
		return value >= 1;
	}
	return habit.target > 0 ? value >= habit.target : value > 0;
}

/** True when the habit was paused on the given day. */
export function isPausedOn(habit: HabitDefinition, dateKey: string): boolean {
	return habit.pauses.some(
		(pause) =>
			dateKey >= pause.start &&
			(pause.end === "" || dateKey <= pause.end),
	);
}

/**
 * Consecutive complete due periods ending with the most recent one.
 *
 * For daily habits every day is a period. For weekly and monthly habits only
 * their due dates count, so the streak measures consecutive weeks or months
 * completed. Paused due dates are skipped entirely (they neither break nor
 * extend a streak), and the most recent due date may still be blank (e.g. a
 * due date that is today) without breaking the streak.
 */
export function currentStreak(habit: HabitDefinition, today: Date): number {
	let cursor = startOfDay(today);
	let streak = 0;
	let graceUsed = false;
	for (;;) {
		if (!isDue(habit, cursor)) {
			cursor = addDays(cursor, -1);
			continue;
		}
		const key = toDateKey(cursor);
		if (isPausedOn(habit, key)) {
			cursor = addDays(cursor, -1);
			continue;
		}
		if (isComplete(habit, key)) {
			streak++;
		} else if (
			streak === 0 &&
			!graceUsed &&
			habit.goalDirection !== "max"
		) {
			// The most recent due date may still be blank (e.g. today). Limit
			// habits get no grace: for them a blank day already counts as
			// within limit, so an incomplete day is a real slip (or a day
			// before the habit started) and the streak genuinely ends there.
			graceUsed = true;
		} else {
			break;
		}
		cursor = addDays(cursor, -1);
	}
	return streak;
}

/**
 * The longest run of consecutive complete due periods ever recorded. Days on
 * which the habit is not due are ignored, and paused due dates inside a run do
 * not break it.
 *
 * `min` habits anchor the scan on logged completions. `max` habits cannot
 * (silence is success, so there may be no logged "completions" at all);
 * they scan the whole tracked window, from the habit's start day to today.
 */
export function longestStreak(
	habit: HabitDefinition,
	today: Date = new Date(),
): number {
	let first: Date | null;
	let last: Date | null;
	if (habit.goalDirection === "max") {
		first = fromDateKey(trackingStartKey(habit, today));
		last = startOfDay(today);
		if (!first || first.getTime() > last.getTime()) {
			return 0;
		}
	} else {
		const completedKeys = Object.keys(habit.records)
			.filter((key) => isComplete(habit, key))
			.sort();
		if (completedKeys.length === 0) {
			return 0;
		}
		first = fromDateKey(completedKeys[0]);
		last = fromDateKey(completedKeys[completedKeys.length - 1]);
	}
	if (!first || !last) {
		return 0;
	}

	let best = 0;
	let run = 0;
	let cursor = first;
	while (cursor.getTime() <= last.getTime()) {
		if (isDue(habit, cursor)) {
			const key = toDateKey(cursor);
			if (isComplete(habit, key)) {
				run++;
				best = Math.max(best, run);
			} else if (!isPausedOn(habit, key)) {
				run = 0;
			}
		}
		cursor = addDays(cursor, 1);
	}
	return best;
}

export interface HabitPeriodStats {
	days: number;
	completed: number;
	total: number;
	rate: number;
	current: number;
	best: number;
}

/** The last day of the range to count towards metrics (never in the future). */
function elapsedEnd(range: DateRange, today: Date): number {
	return Math.min(range.end.getTime(), startOfDay(today).getTime());
}

/**
 * Aggregate a single habit's stats over the elapsed days of a range.
 * Days before the habit's tracking start (see {@link trackingStartKey}) are
 * excluded entirely — the habit did not exist yet, so they count neither as
 * successes nor as failures.
 */
export function habitStats(
	habit: HabitDefinition,
	range: DateRange,
	today: Date,
): HabitPeriodStats {
	const end = elapsedEnd(range, today);
	const startKey = trackingStartKey(habit, today);
	let days = 0;
	let completed = 0;
	let total = 0;
	let cursor = new Date(range.start);
	while (cursor.getTime() <= end) {
		const key = toDateKey(cursor);
		if (
			key < startKey ||
			!isDue(habit, cursor) ||
			isPausedOn(habit, key)
		) {
			cursor = addDays(cursor, 1);
			continue;
		}
		days++;
		const value = habit.records[key] ?? 0;
		if (habit.goalDirection === "max") {
			// For limit habits `total` is consumption (slips for binary),
			// and a completed day is one that stayed within the limit.
			total += value;
			if (isComplete(habit, key)) {
				completed++;
			}
		} else if (habit.type === "binary") {
			if (value >= 1) {
				completed++;
				total++;
			}
		} else {
			total += value;
			if (isComplete(habit, key)) {
				completed++;
			}
		}
		cursor = addDays(cursor, 1);
	}
	return {
		days,
		completed,
		total,
		rate: days > 0 ? completed / days : 0,
		current: currentStreak(habit, today),
		best: longestStreak(habit, today),
	};
}

/**
 * Count elapsed days in the range where every habit was complete.
 * Habits paused on a given day are ignored for that day, as are habits not
 * yet being tracked; a day with every habit paused or untracked cannot be
 * perfect.
 */
export function perfectDays(
	habits: HabitDefinition[],
	range: DateRange,
	today: Date,
): number {
	if (habits.length === 0) {
		return 0;
	}
	const end = elapsedEnd(range, today);
	const startKeys = habits.map((habit) => trackingStartKey(habit, today));
	let count = 0;
	let cursor = new Date(range.start);
	while (cursor.getTime() <= end) {
		const key = toDateKey(cursor);
		const date = cursor;
		const active = habits.filter(
			(habit, i) =>
				key >= startKeys[i] &&
				isDue(habit, date) &&
				!isPausedOn(habit, key),
		);
		if (
			active.length > 0 &&
			active.every((habit) => isComplete(habit, key))
		) {
			count++;
		}
		cursor = addDays(cursor, 1);
	}
	return count;
}
