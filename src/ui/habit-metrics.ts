import { MarkdownRenderChild } from "obsidian";
import {
	BarController,
	BarElement,
	CategoryScale,
	Chart,
	Filler,
	LineController,
	LineElement,
	LinearScale,
	PointElement,
	Tooltip,
	type ChartConfiguration,
	type ChartDataset,
} from "chart.js";
import type { HabitStore } from "../habit-store";
import type { HabitDefinition } from "../types";
import { currentStreak, isComplete, longestStreak } from "../stats";
import { addDays, toDateKey } from "../utils";

Chart.register(
	BarController,
	BarElement,
	CategoryScale,
	Filler,
	LineController,
	LineElement,
	LinearScale,
	PointElement,
	Tooltip,
);

const DAILY_DAYS = 30;
const WEEKLY_WEEKS = 12;

/**
 * Renders the metrics view for a `habit-metrics` code block placed inside a
 * habit note: summary tiles, a 30-day activity chart and a 12-week
 * completion-rate trend, drawn with Chart.js in the theme's colours.
 */
export class HabitMetrics extends MarkdownRenderChild {
	private charts: Chart[] = [];

	constructor(
		private store: HabitStore,
		private sourcePath: string,
		root: HTMLElement,
	) {
		super(root);
	}

	onload(): void {
		this.containerEl.addClass("habits-metrics");

		const habit = this.store
			.getHabits()
			.find((entry) => entry.path === this.sourcePath);
		if (!habit) {
			this.containerEl.createEl("p", {
				cls: "habits-metrics-empty",
				text: "Place this block inside a habit note to see its metrics.",
			});
			return;
		}

		this.renderSummary(habit);
		this.renderDailyChart(habit);
		this.renderWeeklyChart(habit);
	}

	onunload(): void {
		for (const chart of this.charts) {
			chart.destroy();
		}
		this.charts = [];
	}

	/** Summary tiles: streaks, lifetime completions and the 30-day rate. */
	private renderSummary(habit: HabitDefinition): void {
		const today = new Date();
		const completedDays = Object.keys(habit.records).filter((key) =>
			isComplete(habit, key),
		).length;

		let recentHits = 0;
		for (let i = 0; i < DAILY_DAYS; i++) {
			if (isComplete(habit, toDateKey(addDays(today, -i)))) {
				recentHits++;
			}
		}

		const tiles = [
			{
				value: String(currentStreak(habit, today)),
				label: "Current streak",
			},
			{ value: String(longestStreak(habit)), label: "Best streak" },
			{ value: String(completedDays), label: "Days completed" },
			{
				value: `${Math.round((recentHits / DAILY_DAYS) * 100)}%`,
				label: "30-day rate",
			},
		];

		const wrap = this.containerEl.createDiv({
			cls: "habits-stats-summary",
		});
		for (const tile of tiles) {
			const el = wrap.createDiv({ cls: "habits-stat-tile" });
			el.createDiv({ cls: "habits-stat-value", text: tile.value });
			el.createDiv({ cls: "habits-stat-label", text: tile.label });
		}
	}

	/** Bar chart of the last 30 days; complete days show in theme green. */
	private renderDailyChart(habit: HabitDefinition): void {
		const today = new Date();
		const accent = this.resolveColor(
			habit.color,
			"var(--interactive-accent)",
		);
		const green = this.resolveColor(
			"",
			"var(--color-green, var(--text-success))",
		);

		const labels: string[] = [];
		const values: number[] = [];
		const colors: string[] = [];
		for (let i = DAILY_DAYS - 1; i >= 0; i--) {
			const day = addDays(today, -i);
			const key = toDateKey(day);
			labels.push(
				day.toLocaleDateString(undefined, {
					day: "numeric",
					month: "short",
				}),
			);
			values.push(habit.records[key] ?? 0);
			colors.push(
				isComplete(habit, key) ? green : this.withAlpha(accent, 0.45),
			);
		}

		const datasets: ChartDataset<"bar" | "line", number[]>[] = [
			{
				type: "bar",
				label: habit.unit || "Logged",
				data: values,
				backgroundColor: colors,
				borderRadius: 3,
			},
		];
		if (habit.type !== "binary" && habit.target > 0) {
			datasets.push({
				type: "line",
				label: "Target",
				data: new Array(DAILY_DAYS).fill(habit.target) as number[],
				borderColor: this.withAlpha(green, 0.7),
				borderDash: [6, 4],
				borderWidth: 1.5,
				pointRadius: 0,
			});
		}

		this.createChart("Last 30 days", {
			type: "bar",
			data: { labels, datasets },
			options: this.baseOptions(habit.type === "binary" ? 1 : undefined),
		});
	}

	/** Line chart of the completion rate per week for the last 12 weeks. */
	private renderWeeklyChart(habit: HabitDefinition): void {
		const today = new Date();
		const base = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
		);
		const thisMonday = addDays(base, -((base.getDay() + 6) % 7));
		const accent = this.resolveColor(
			habit.color,
			"var(--interactive-accent)",
		);

		const labels: string[] = [];
		const rates: number[] = [];
		for (let week = WEEKLY_WEEKS - 1; week >= 0; week--) {
			const start = addDays(thisMonday, -7 * week);
			labels.push(
				start.toLocaleDateString(undefined, {
					day: "numeric",
					month: "short",
				}),
			);
			let elapsed = 0;
			let completed = 0;
			for (let i = 0; i < 7; i++) {
				const day = addDays(start, i);
				if (day.getTime() > base.getTime()) {
					break;
				}
				elapsed++;
				if (isComplete(habit, toDateKey(day))) {
					completed++;
				}
			}
			rates.push(
				elapsed > 0 ? Math.round((completed / elapsed) * 100) : 0,
			);
		}

		const options = this.baseOptions(100);
		const yTicks = options.scales?.y?.ticks;
		if (yTicks) {
			(yTicks as { callback?: (value: unknown) => string }).callback = (
				value: unknown,
			) => `${String(value)}%`;
		}

		this.createChart("Weekly completion rate", {
			type: "line",
			data: {
				labels,
				datasets: [
					{
						type: "line",
						label: "Completion",
						data: rates,
						borderColor: accent,
						backgroundColor: this.withAlpha(accent, 0.18),
						fill: true,
						tension: 0.3,
						pointRadius: 3,
						pointBackgroundColor: accent,
					},
				],
			},
			options,
		});
	}

	/** Shared chart options wired to the theme's text and grid colours. */
	private baseOptions(suggestedMax?: number) {
		const text = this.resolveColor("", "var(--text-muted)");
		const grid = this.withAlpha(
			this.resolveColor("", "var(--background-modifier-border)"),
			0.6,
		);
		return {
			responsive: true,
			maintainAspectRatio: false,
			animation: { duration: 300 },
			plugins: { legend: { display: false } },
			scales: {
				x: {
					grid: { display: false },
					ticks: {
						color: text,
						maxRotation: 0,
						autoSkip: true,
						maxTicksLimit: 8,
					},
				},
				y: {
					beginAtZero: true,
					suggestedMax,
					grid: { color: grid },
					ticks: { color: text, precision: 0 } as {
						color: string;
						precision: number;
						callback?: (value: unknown) => string;
					},
				},
			},
		};
	}

	/** Titled section containing a responsive chart canvas. */
	private createChart(
		title: string,
		config: ChartConfiguration<"bar" | "line", number[], string>,
	): void {
		const section = this.containerEl.createDiv({
			cls: "habits-metrics-section",
		});
		section.createDiv({ cls: "habits-metrics-title", text: title });
		const wrap = section.createDiv({ cls: "habits-metrics-canvas" });
		const canvas = wrap.createEl("canvas");
		this.charts.push(new Chart(canvas, config));
	}

	/**
	 * Resolve a CSS colour (including `var(...)` references and the habit's
	 * own accent) to a concrete rgb value Chart.js can use.
	 */
	private resolveColor(preferred: string, fallback: string): string {
		const probe = this.containerEl.doc.body.createEl("span");
		probe.style.color = preferred || fallback;
		const resolved = probe.win.getComputedStyle(probe).color;
		probe.remove();
		return resolved || "#888888";
	}

	/** Apply an alpha channel to an `rgb(r, g, b)` colour string. */
	private withAlpha(color: string, alpha: number): string {
		const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);
		if (!match) {
			return color;
		}
		return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
	}
}
