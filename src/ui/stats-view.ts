import { setIcon } from "obsidian";
import { t } from "../i18n";
import type { HabitDefinition } from "../types";
import { addDays, toDateKey } from "../utils";
import { applyHabitIcon } from "./icon-suggest-modal";
import {
	getStatsRange,
	habitStats,
	isComplete,
	isDue,
	isPausedOn,
	limitStartKey,
	perfectDays,
	rangeLength,
	type StatsPeriod,
	type StatsRangeMode,
} from "../stats";

function formatShort(date: Date): string {
	return date.toLocaleDateString(undefined, {
		day: "numeric",
		month: "short",
	});
}

function tile(parent: HTMLElement, value: string, label: string): void {
	const el = parent.createDiv({ cls: "habits-stat-tile" });
	el.createDiv({ cls: "habits-stat-value", text: value });
	el.createDiv({ cls: "habits-stat-label", text: label });
}

/** Render the stats view (summary tiles + per-habit heatmaps) into a container. */
export function renderStatsView(
	container: HTMLElement,
	habits: HabitDefinition[],
	period: StatsPeriod,
	mode: StatsRangeMode,
	today: Date,
): void {
	container.empty();
	container.addClass("habits-stats");

	const range = getStatsRange(today, period, mode);
	const length = rangeLength(range);

	const title =
		mode === "rolling"
			? period === "weekly"
				? t("Last 7 days")
				: t("Last 30 days")
			: period === "weekly"
				? t("This week")
				: t("This month");
	const subtitle =
		mode === "calendar" && period === "monthly"
			? today.toLocaleDateString(undefined, {
					month: "long",
					year: "numeric",
				})
			: `${formatShort(range.start)} – ${formatShort(range.end)}`;

	container.createDiv({
		cls: "habits-stats-range",
		text: `${title} · ${subtitle}`,
	});

	if (habits.length === 0) {
		container.createDiv({
			cls: "habits-empty",
			text: t("No habits to show stats for yet."),
		});
		return;
	}

	const todayKey = toDateKey(today);
	const allStats = habits.map((habit) => habitStats(habit, range, today));
	const totalDays = allStats.reduce((sum, s) => sum + s.days, 0);
	const totalCompleted = allStats.reduce((sum, s) => sum + s.completed, 0);
	const overallRate =
		totalDays > 0 ? Math.round((totalCompleted / totalDays) * 100) : 0;
	const bestCurrent = allStats.reduce((max, s) => Math.max(max, s.current), 0);
	const perfect = perfectDays(habits, range, today);

	const isPerfect = (habit: HabitDefinition): boolean =>
		period === "weekly" ? habit.weeklyPerfect : habit.monthlyPerfect;
	const goalOf = (habit: HabitDefinition): number => {
		if (isPerfect(habit)) {
			return length;
		}
		return period === "weekly" ? habit.weeklyTarget : habit.monthlyTarget;
	};
	const progressOf = (i: number): number => allStats[i].completed;
	let goalsTotal = 0;
	let goalsMet = 0;
	habits.forEach((habit, i) => {
		if (goalOf(habit) > 0) {
			goalsTotal++;
			if (progressOf(i) >= goalOf(habit)) {
				goalsMet++;
			}
		}
	});

	const summary = container.createDiv({ cls: "habits-stats-summary" });
	tile(summary, `${overallRate}%`, t("Completion"));
	tile(summary, `${bestCurrent}`, t("Best streak"));
	tile(summary, `${perfect}`, t("Perfect days"));
	tile(summary, `${totalCompleted}`, t("Completions"));
	if (goalsTotal > 0) {
		tile(summary, `${goalsMet}/${goalsTotal}`, t("Goals met"));
	}

	const list = container.createDiv({ cls: "habits-stats-list" });
	habits.forEach((habit, i) => {
		const stats = allStats[i];
		const row = list.createDiv({ cls: "habits-stats-row" });
		if (habit.color) {
			row.setCssProps({ "--habits-accent": habit.color });
		}

		const top = row.createDiv({ cls: "habits-stats-row-top" });
		const name = top.createDiv({ cls: "habits-stats-name" });
		if (habit.icon) {
			const icon = name.createSpan({ cls: "habits-card-icon" });
			applyHabitIcon(icon, habit.icon);
		}
		name.createSpan({ text: habit.name });
		const streak = top.createSpan({ cls: "habits-stats-streak" });
		const flame = streak.createSpan({ cls: "habits-stats-flame" });
		setIcon(flame, "flame");
		streak.createSpan({ text: `${stats.current}` });

		const heatmap = row.createDiv({ cls: "habits-stats-heatmap" });
		for (let d = 0; d < length; d++) {
			const date = addDays(range.start, d);
			const key = toDateKey(date);
			const value = habit.records[key] ?? 0;
			const cell = heatmap.createDiv({ cls: "habits-stats-cell" });
			if (!isDue(habit, date)) {
				cell.addClass("is-notdue");
			} else if (key > todayKey) {
				cell.addClass("is-future");
			} else if (isPausedOn(habit, key)) {
				cell.addClass("is-paused");
			} else if (isComplete(habit, key)) {
				cell.addClass("is-complete");
			} else if (habit.goalDirection === "max") {
				// For a limit habit "not complete" is either a day over the
				// limit or a day before the habit started; pre-start days
				// stay neutral rather than reading as failures.
				if (key >= limitStartKey(habit, today)) {
					cell.addClass("is-over");
				}
			} else if (value > 0) {
				cell.addClass("is-partial");
			}
			cell.setAttr("aria-label", `${key}: ${value}`);
		}

		const unit = habit.unit || (habit.type === "timed" ? "min" : "");
		const totalText =
			habit.type === "binary"
				? t("{completed}/{days} days", {
						completed: stats.completed,
						days: stats.days,
					})
				: t("{total} total", {
						total: `${stats.total}${unit ? ` ${unit}` : ""}`,
					});
		const meta = row.createDiv({ cls: "habits-stats-meta" });
		meta.createSpan({
			text: `${Math.round(stats.rate * 100)}% · ${totalText} · ${t("best")} `,
		});
		const bestFlame = meta.createSpan({ cls: "habits-stats-flame" });
		setIcon(bestFlame, "flame");
		meta.createSpan({ text: `${stats.best}` });

		const goal = goalOf(habit);
		if (goal > 0) {
			const progress = progressOf(i);
			const pct = Math.min(100, Math.round((progress / goal) * 100));
			const bar = row.createDiv({ cls: "habits-goal-bar" });
			if (progress >= goal) {
				bar.addClass("is-complete");
			}
			bar
				.createDiv({ cls: "habits-goal-fill" })
				.setCssProps({ "--habits-progress": `${pct}%` });
			const goalName = isPerfect(habit)
				? period === "weekly"
					? t("perfect week")
					: t("perfect month")
				: period === "weekly"
					? t("weekly goal")
					: t("monthly goal");
			row.createDiv({
				cls: "habits-stats-goal-label",
				text: t("{progress}/{goal} days · {label} · {pct}%", {
					progress,
					goal,
					label: goalName,
					pct,
				}),
			});
		}
	});
}
