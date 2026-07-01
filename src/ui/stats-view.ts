import type { HabitDefinition } from "../types";
import { addDays, toDateKey } from "../utils";
import { applyHabitIcon } from "./icon-suggest-modal";
import {
	habitStats,
	isComplete,
	perfectDays,
	periodLength,
	type StatsPeriod,
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
	today: Date,
): void {
	container.empty();
	container.addClass("habits-stats");

	const length = periodLength(period);
	const start = addDays(today, -(length - 1));

	container.createDiv({
		cls: "habits-stats-range",
		text: `${period === "weekly" ? "Last 7 days" : "Last 30 days"} · ${formatShort(start)} – ${formatShort(today)}`,
	});

	if (habits.length === 0) {
		container.createDiv({
			cls: "habits-empty",
			text: "No habits to show stats for yet.",
		});
		return;
	}

	const allStats = habits.map((habit) => habitStats(habit, today, period));
	const totalDays = allStats.reduce((sum, s) => sum + s.days, 0);
	const totalCompleted = allStats.reduce((sum, s) => sum + s.completed, 0);
	const overallRate =
		totalDays > 0 ? Math.round((totalCompleted / totalDays) * 100) : 0;
	const bestCurrent = allStats.reduce((max, s) => Math.max(max, s.current), 0);
	const perfect = perfectDays(habits, today, period);

	const summary = container.createDiv({ cls: "habits-stats-summary" });
	tile(summary, `${overallRate}%`, "Completion");
	tile(summary, `${bestCurrent}`, "Best streak");
	tile(summary, `${perfect}`, "Perfect days");
	tile(summary, `${totalCompleted}`, "Completions");

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
		top.createSpan({
			cls: "habits-stats-streak",
			text: `🔥 ${stats.current}`,
		});

		const heatmap = row.createDiv({ cls: "habits-stats-heatmap" });
		for (let d = 0; d < length; d++) {
			const key = toDateKey(addDays(today, -(length - 1) + d));
			const value = habit.records[key] ?? 0;
			const cell = heatmap.createDiv({ cls: "habits-stats-cell" });
			if (isComplete(habit, key)) {
				cell.addClass("is-complete");
			} else if (value > 0) {
				cell.addClass("is-partial");
			}
			cell.setAttr("aria-label", `${key}: ${value}`);
		}

		const unit = habit.unit || (habit.type === "timed" ? "min" : "");
		const totalText =
			habit.type === "binary"
				? `${stats.completed}/${stats.days} days`
				: `${stats.total}${unit ? ` ${unit}` : ""} total`;
		row.createDiv({
			cls: "habits-stats-meta",
			text: `${Math.round(stats.rate * 100)}% · ${totalText} · best 🔥 ${stats.best}`,
		});
	});
}
