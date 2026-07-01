import type { HabitDefinition } from "./types";
import { addDays, fromDateKey, toDateKey } from "./utils";

const MS_PER_DAY = 86_400_000;

export type StatsPeriod = "weekly" | "monthly";
export type StatsRangeMode = "rolling" | "calendar";

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
 * Resolve the date range for a period and mode.
 *
 * - rolling: the last 7 or 30 days ending today.
 * - calendar: the current week (Monday–Sunday) or current month (dynamic).
 */
export function getStatsRange(
	today: Date,
	period: StatsPeriod,
	mode: StatsRangeMode,
): DateRange {
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

/** True when a habit met its goal on the given day. */
export function isComplete(habit: HabitDefinition, dateKey: string): boolean {
	const value = habit.records[dateKey] ?? 0;
	if (habit.type === "binary") {
		return value >= 1;
	}
	return habit.target > 0 ? value >= habit.target : value > 0;
}

/** Consecutive complete days ending today (or yesterday if today is blank). */
export function currentStreak(habit: HabitDefinition, today: Date): number {
	let cursor = startOfDay(today);
	if (!isComplete(habit, toDateKey(cursor))) {
		cursor = addDays(cursor, -1);
		if (!isComplete(habit, toDateKey(cursor))) {
			return 0;
		}
	}
	let streak = 0;
	while (isComplete(habit, toDateKey(cursor))) {
		streak++;
		cursor = addDays(cursor, -1);
	}
	return streak;
}

/** The longest run of consecutive complete days ever recorded. */
export function longestStreak(habit: HabitDefinition): number {
	const dayIndices = Object.keys(habit.records)
		.filter((key) => isComplete(habit, key))
		.map((key) => {
			const date = fromDateKey(key);
			return date ? Math.round(date.getTime() / MS_PER_DAY) : Number.NaN;
		})
		.filter((index) => !Number.isNaN(index))
		.sort((a, b) => a - b);

	let best = 0;
	let run = 0;
	let previous = Number.NaN;
	for (const index of dayIndices) {
		run = !Number.isNaN(previous) && index - previous === 1 ? run + 1 : 1;
		best = Math.max(best, run);
		previous = index;
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

/** Aggregate a single habit's stats over the elapsed days of a range. */
export function habitStats(
	habit: HabitDefinition,
	range: DateRange,
	today: Date,
): HabitPeriodStats {
	const end = elapsedEnd(range, today);
	let days = 0;
	let completed = 0;
	let total = 0;
	let cursor = new Date(range.start);
	while (cursor.getTime() <= end) {
		const key = toDateKey(cursor);
		days++;
		const value = habit.records[key] ?? 0;
		if (habit.type === "binary") {
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
		best: longestStreak(habit),
	};
}

/** Count elapsed days in the range where every habit was complete. */
export function perfectDays(
	habits: HabitDefinition[],
	range: DateRange,
	today: Date,
): number {
	if (habits.length === 0) {
		return 0;
	}
	const end = elapsedEnd(range, today);
	let count = 0;
	let cursor = new Date(range.start);
	while (cursor.getTime() <= end) {
		const key = toDateKey(cursor);
		if (habits.every((habit) => isComplete(habit, key))) {
			count++;
		}
		cursor = addDays(cursor, 1);
	}
	return count;
}
