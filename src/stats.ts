import type { HabitDefinition } from "./types";
import { addDays, fromDateKey, toDateKey } from "./utils";

const MS_PER_DAY = 86_400_000;

export type StatsPeriod = "weekly" | "monthly";

/** Number of days covered by a stats period. */
export function periodLength(period: StatsPeriod): number {
	return period === "weekly" ? 7 : 30;
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
	let cursor = new Date(today);
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

/** Aggregate a single habit's stats over the given period ending today. */
export function habitStats(
	habit: HabitDefinition,
	today: Date,
	period: StatsPeriod,
): HabitPeriodStats {
	const length = periodLength(period);
	let completed = 0;
	let total = 0;
	for (let i = 0; i < length; i++) {
		const key = toDateKey(addDays(today, -(length - 1) + i));
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
	}
	return {
		days: length,
		completed,
		total,
		rate: length > 0 ? completed / length : 0,
		current: currentStreak(habit, today),
		best: longestStreak(habit),
	};
}

/** Count days in the period where every habit was complete. */
export function perfectDays(
	habits: HabitDefinition[],
	today: Date,
	period: StatsPeriod,
): number {
	if (habits.length === 0) {
		return 0;
	}
	const length = periodLength(period);
	let count = 0;
	for (let i = 0; i < length; i++) {
		const key = toDateKey(addDays(today, -(length - 1) + i));
		if (habits.every((habit) => isComplete(habit, key))) {
			count++;
		}
	}
	return count;
}
