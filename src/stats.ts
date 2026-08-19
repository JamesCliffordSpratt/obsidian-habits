import type { HabitDefinition } from "./types";
import {
	addDays,
	daysInMonth,
	fromDateKey,
	isFlexibleFrequency,
	toDateKey,
} from "./utils";

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

/** True for the two "N times per period, any day" frequencies. */
export function isFlexible(habit: HabitDefinition): boolean {
	return isFlexibleFrequency(habit.frequency);
}

/**
 * Whether a habit's card should show and be interactive on `date`.
 *
 * For every other frequency this is exactly {@link isDue}. Flexible
 * habits are due (in the stats sense) only on their period's last day —
 * see {@link isDue} — but need to be actionable every day so the user can
 * log an occurrence whenever it actually happens.
 */
export function isActive(habit: HabitDefinition, date: Date): boolean {
	return isDue(habit, date) || isFlexible(habit);
}

/** The Monday–Sunday week, or calendar month, containing `date`. */
export function flexiblePeriodRange(
	habit: HabitDefinition,
	date: Date,
): DateRange {
	if (habit.frequency === "flexibleWeekly") {
		const start = startOfWeek(date);
		return { start, end: addDays(start, 6) };
	}
	const base = startOfDay(date);
	return {
		start: new Date(base.getFullYear(), base.getMonth(), 1),
		end: new Date(base.getFullYear(), base.getMonth() + 1, 0),
	};
}

/** The period immediately before `range` (mirrors its week/month shape). */
function previousPeriodRange(
	habit: HabitDefinition,
	range: DateRange,
): DateRange {
	if (habit.frequency === "flexibleWeekly") {
		const start = addDays(range.start, -7);
		return { start, end: addDays(start, 6) };
	}
	const prevEnd = addDays(range.start, -1);
	return {
		start: new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1),
		end: prevEnd,
	};
}

/** The period immediately after `range` (mirrors its week/month shape). */
function nextPeriodRange(
	habit: HabitDefinition,
	range: DateRange,
): DateRange {
	if (habit.frequency === "flexibleWeekly") {
		const start = addDays(range.start, 7);
		return { start, end: addDays(start, 6) };
	}
	const nextStart = addDays(range.end, 1);
	return {
		start: nextStart,
		end: new Date(nextStart.getFullYear(), nextStart.getMonth() + 1, 0),
	};
}

/** Every day in `range` is paused — a whole period to leave out of streaks. */
function periodFullyPaused(habit: HabitDefinition, range: DateRange): boolean {
	let cursor = new Date(range.start);
	while (cursor.getTime() <= range.end.getTime()) {
		if (!isPausedOn(habit, toDateKey(cursor))) {
			return false;
		}
		cursor = addDays(cursor, 1);
	}
	return true;
}

/** Sum of `records` within `range`, from its start through `throughDate`. */
function periodTotalThrough(
	habit: HabitDefinition,
	range: DateRange,
	throughDate: Date,
): number {
	const end =
		throughDate.getTime() < range.end.getTime() ? throughDate : range.end;
	let total = 0;
	let cursor = new Date(range.start);
	while (cursor.getTime() <= end.getTime()) {
		total += habit.records[toDateKey(cursor)] ?? 0;
		cursor = addDays(cursor, 1);
	}
	return total;
}

/**
 * A flexible habit's period-cumulative total, from the start of the period
 * containing `date` through `date` itself. On a non-canonical day this is a
 * live "have I hit quota yet this period" reading; on the period's last day
 * it is the authoritative full-period total.
 */
export function flexiblePeriodTotal(
	habit: HabitDefinition,
	date: Date,
): number {
	return periodTotalThrough(habit, flexiblePeriodRange(habit, date), date);
}

/** Whether a period total reaches a flexible habit's "times per period" goal. */
function meetsFlexibleTarget(habit: HabitDefinition, total: number): boolean {
	return habit.target > 0 ? total >= habit.target : total > 0;
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
 * The day an interval habit's every-N-days cycle counts from: its start
 * date, or the earliest record for hand-written notes without one. `null`
 * means no anchor exists yet (a brand-new note with no records).
 */
export function intervalAnchor(habit: HabitDefinition): Date | null {
	if (habit.startDate !== "") {
		return fromDateKey(habit.startDate);
	}
	const keys = Object.keys(habit.records);
	if (keys.length > 0) {
		return fromDateKey(keys.reduce((min, key) => (key < min ? key : min)));
	}
	return null;
}

/**
 * True when the habit is due on the given date.
 *
 * - `daily` habits are due every day.
 * - `weekly` habits are due on their chosen weekdays.
 * - `monthly` habits are due on their chosen day of the month, clamped to the
 *   month's last day when the month is shorter.
 * - `interval` habits are due every N days counted from their anchor (see
 *   {@link intervalAnchor}); dates before the anchor are never due, and a
 *   habit with no anchor yet behaves as daily until one exists.
 * - `flexibleWeekly`/`flexibleMonthly` habits are due, in this stats sense,
 *   only on the last day of their period (Sunday, or the month's last day)
 *   — the one canonical day a whole period's outcome is scored on. Use
 *   {@link isActive} for "should this show up today" instead; it is true
 *   every day for these two frequencies.
 */
export function isDue(habit: HabitDefinition, date: Date): boolean {
	if (habit.frequency === "flexibleWeekly") {
		return date.getDay() === 0; // Sunday: the last day of a Monday-start week
	}
	if (habit.frequency === "flexibleMonthly") {
		return (
			date.getDate() === daysInMonth(date.getFullYear(), date.getMonth())
		);
	}
	if (habit.frequency === "weekly") {
		return habit.weekdays.includes(date.getDay());
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
	if (habit.frequency === "interval") {
		const anchor = intervalAnchor(habit);
		if (!anchor) {
			return true;
		}
		// Both dates are local midnights; rounding absorbs the odd hour a
		// DST transition adds or removes inside the span.
		const days = Math.round(
			(startOfDay(date).getTime() - anchor.getTime()) / MS_PER_DAY,
		);
		return days >= 0 && days % Math.max(1, habit.intervalDays) === 0;
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
 * For `flexibleWeekly`/`flexibleMonthly` habits: the running total for the
 * period containing `dateKey`, summed from the period's start through
 * `dateKey` itself, reaches `target`. Well-defined for any day, not just
 * the period's canonical last day — see {@link flexiblePeriodTotal}.
 * For `min` habits: the logged value reached the target.
 * For `max` habits: the logged value stayed at or under the limit — an
 * unlogged day counts as within limit, but only from the habit's start
 * day onward (see {@link limitStartKey}).
 */
export function isComplete(habit: HabitDefinition, dateKey: string): boolean {
	if (isFlexible(habit)) {
		const date = fromDateKey(dateKey);
		return date ? meetsFlexibleTarget(habit, flexiblePeriodTotal(habit, date)) : false;
	}
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
 * {@link currentStreak} for a flexible habit: walks period by period (weeks
 * or months) rather than day by day, since evaluating every day of an
 * in-progress, not-yet-satisfied period would falsely look like a string of
 * broken days. The current, still-open period counts if it is already
 * satisfied and otherwise doesn't break anything — there is still time left
 * in it, the same idea as the existing "today may still be blank" grace,
 * just at period granularity. Every fully elapsed period after that is a
 * plain pass/fail, so no grace is needed there.
 */
function flexibleCurrentStreak(habit: HabitDefinition, today: Date): number {
	const habitStart = fromDateKey(trackingStartKey(habit, today));
	let range = flexiblePeriodRange(habit, today);
	let streak = 0;

	if (toDateKey(range.end) !== toDateKey(startOfDay(today))) {
		if (
			habitStart &&
			range.end.getTime() >= habitStart.getTime() &&
			!periodFullyPaused(habit, range) &&
			meetsFlexibleTarget(habit, periodTotalThrough(habit, range, today))
		) {
			streak++;
		}
		range = previousPeriodRange(habit, range);
	}

	for (;;) {
		if (habitStart && range.end.getTime() < habitStart.getTime()) {
			break;
		}
		if (periodFullyPaused(habit, range)) {
			range = previousPeriodRange(habit, range);
			continue;
		}
		if (meetsFlexibleTarget(habit, periodTotalThrough(habit, range, range.end))) {
			streak++;
		} else {
			break;
		}
		range = previousPeriodRange(habit, range);
	}
	return streak;
}

/** {@link longestStreak} for a flexible habit; see {@link flexibleCurrentStreak}. */
function flexibleLongestStreak(habit: HabitDefinition, today: Date): number {
	const habitStart = fromDateKey(trackingStartKey(habit, today));
	if (!habitStart) {
		return 0;
	}
	const todayRange = flexiblePeriodRange(habit, today);
	let range = flexiblePeriodRange(habit, habitStart);
	let best = 0;
	let run = 0;
	while (range.start.getTime() <= todayRange.start.getTime()) {
		if (periodFullyPaused(habit, range)) {
			range = nextPeriodRange(habit, range);
			continue;
		}
		const isCurrent = range.start.getTime() === todayRange.start.getTime();
		const through = isCurrent ? today : range.end;
		if (meetsFlexibleTarget(habit, periodTotalThrough(habit, range, through))) {
			run++;
			best = Math.max(best, run);
		} else if (!isCurrent) {
			// An unmet but still-open current period doesn't reset the run —
			// mirrors flexibleCurrentStreak's grace for it.
			run = 0;
		}
		range = nextPeriodRange(habit, range);
	}
	return best;
}

/**
 * Consecutive complete due periods ending with the most recent one.
 *
 * For daily habits every day is a period. For weekly and monthly habits only
 * their due dates count, so the streak measures consecutive weeks or months
 * completed. Paused due dates are skipped entirely (they neither break nor
 * extend a streak), and the most recent due date may still be blank (e.g. a
 * due date that is today) without breaking the streak. Flexible habits
 * delegate to {@link flexibleCurrentStreak}, which walks whole periods
 * instead of days.
 */
export function currentStreak(habit: HabitDefinition, today: Date): number {
	if (isFlexible(habit)) {
		return flexibleCurrentStreak(habit, today);
	}
	let cursor = startOfDay(today);
	let streak = 0;
	let graceUsed = false;
	// An interval habit is never due before its anchor, so without a floor
	// the walk below would search backwards forever.
	const floor =
		habit.frequency === "interval" ? intervalAnchor(habit) : null;
	for (;;) {
		if (floor && cursor.getTime() < floor.getTime()) {
			break;
		}
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
 * Flexible habits delegate to {@link flexibleLongestStreak}.
 */
export function longestStreak(
	habit: HabitDefinition,
	today: Date = new Date(),
): number {
	if (isFlexible(habit)) {
		return flexibleLongestStreak(habit, today);
	}
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
		if (isFlexible(habit)) {
			// isDue only gates this loop through on the period's last day, so
			// `cursor` is the period end here and this total is the whole
			// period's, not just this one day's.
			total += flexiblePeriodTotal(habit, cursor);
			if (isComplete(habit, key)) {
				completed++;
			}
		} else if (habit.goalDirection === "max") {
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
