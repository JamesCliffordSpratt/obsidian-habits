import { App, debounce, MarkdownRenderChild, setIcon } from "obsidian";
import { t } from "../i18n";
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
import type { HabitDefinition, HabitFrequency } from "../types";
import {
	currentStreak,
	isComplete,
	isDue,
	isPausedOn,
	limitOf,
	trackingStartKey,
	longestStreak,
} from "../stats";
import { addDays, fromDateKey, toDateKey } from "../utils";

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
 * How many recent due dates to plot for weekly and monthly habits. Daily
 * habits keep their own 30-day and 12-week charts; the value is also used as
 * the sample size for each habit's recent completion rate.
 */
const RECENT_POINTS: Record<HabitFrequency, number> = {
	daily: 30,
	weekly: 16,
	monthly: 12,
};

/** Trailing window, in due periods, for the rolling completion-rate line. */
const ROLLING_WINDOW: Record<HabitFrequency, number> = {
	daily: 7,
	weekly: 4,
	monthly: 3,
};

/**
 * Renders the metrics view for a `habit-metrics` code block placed inside a
 * habit note: summary tiles, a 30-day activity chart and a 12-week
 * completion-rate trend, drawn with Chart.js in the theme's colours.
 */
export class HabitMetrics extends MarkdownRenderChild {
	private charts: Chart[] = [];
	/** Path of the habit note currently rendered, for live refresh. */
	private watchedPath = "";

	constructor(
		private app: App,
		private store: HabitStore,
		private sourcePath: string,
		private source: string,
		root: HTMLElement,
	) {
		super(root);
	}

	onload(): void {
		this.containerEl.addClass("habits-metrics");
		// Refresh when the rendered habit's note changes, so blocks that
		// live outside the habit note (via `habit: <name>`) stay current.
		const requestRender = debounce(() => this.render(), 250, true);
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				if (
					this.watchedPath !== "" &&
					file.path === this.watchedPath
				) {
					requestRender();
				}
			}),
		);
		this.render();
	}

	/** The habit named in the block source (`habit: <name>`), if any. */
	private requestedName(): string {
		const match = /^\s*habit\s*:\s*(.+?)\s*$/im.exec(this.source);
		if (!match) {
			return "";
		}
		return match[1].replace(/^["']|["']$/g, "");
	}

	private render(): void {
		this.destroyCharts();
		const root = this.containerEl;
		root.empty();

		const habits = this.store.getHabits();
		const requested = this.requestedName();
		const habit = requested
			? habits.find(
					(entry) =>
						entry.name.toLowerCase() ===
						requested.toLowerCase(),
				)
			: habits.find((entry) => entry.path === this.sourcePath);
		this.watchedPath = habit?.path ?? "";

		if (!habit) {
			root.createEl("p", {
				cls: "habits-metrics-empty",
				text: requested
					? t('No habit called "{name}" was found.', {
							name: requested,
						})
					: t(
							'Place this block inside a habit note, or point it at one with "habit: <name>".',
						),
			});
			return;
		}

		if (habit.stopped) {
			this.renderBanner(
				"circle-stop",
				habit.stopDate
					? t("No longer tracked since {date}. All history is kept.", {
							date: habit.stopDate,
						})
					: t("No longer tracked. All history is kept."),
				t("Resume tracking"),
				() => this.store.restartHabit(habit),
			);
		} else if (habit.paused) {
			const open = habit.pauses.find((pause) => pause.end === "");
			this.renderBanner(
				"pause",
				open
					? t(
							"Paused since {date}. Paused days don't count against streaks or stats.",
							{ date: open.start },
						)
					: t(
							"Paused. Paused days don't count against streaks or stats.",
						),
				t("Resume habit"),
				() => this.store.resumeHabit(habit),
			);
		}

		this.renderSummary(habit);
		if (habit.frequency === "daily") {
			this.renderDailyChart(habit);
			this.renderWeeklyChart(habit);
		} else {
			this.renderDueActivityChart(habit);
			this.renderDueRateChart(habit);
		}
	}

	/** Status banner with a resume action for paused or stopped habits. */
	private renderBanner(
		icon: string,
		text: string,
		buttonText: string,
		onClick: () => Promise<void>,
	): void {
		const banner = this.containerEl.createDiv({
			cls: "habits-metrics-banner",
		});
		const iconEl = banner.createSpan({
			cls: "habits-metrics-banner-icon",
		});
		setIcon(iconEl, icon);
		banner.createSpan({ cls: "habits-metrics-banner-text", text });
		const button = banner.createEl("button", {
			text: buttonText,
			attr: { type: "button" },
		});
		this.registerDomEvent(button, "click", () => {
			void onClick();
		});
	}

	onunload(): void {
		this.destroyCharts();
	}

	private destroyCharts(): void {
		for (const chart of this.charts) {
			chart.destroy();
		}
		this.charts = [];
	}

	/** Summary tiles: streaks, lifetime completions and the 30-day rate. */
	private renderSummary(habit: HabitDefinition): void {
		const today = new Date();
		let completedDays: number;
		if (habit.goalDirection === "max") {
			// Unlogged days count as within limit, so successes cannot be
			// counted from logged records alone; walk the tracked window.
			completedDays = 0;
			const start = fromDateKey(trackingStartKey(habit, today));
			if (start) {
				const end = toDateKey(today);
				for (
					let cursor = start;
					toDateKey(cursor) <= end;
					cursor = addDays(cursor, 1)
				) {
					if (isComplete(habit, toDateKey(cursor))) {
						completedDays++;
					}
				}
			}
		} else {
			completedDays = Object.keys(habit.records).filter((key) => {
				const date = fromDateKey(key);
				return (
					date !== null &&
					isDue(habit, date) &&
					isComplete(habit, key)
				);
			}).length;
		}

		// Rate is measured over the habit's recent due dates, so a weekly or
		// monthly habit isn't penalised for the days it isn't due.
		const recentDates = this.recentDueDates(
			habit,
			RECENT_POINTS[habit.frequency],
			today,
		);
		// Habits only start scoring on their start day; including earlier
		// dates would count days before the habit existed as misses.
		const startKey = trackingStartKey(habit, today);
		let recentDue = 0;
		let recentHits = 0;
		for (const date of recentDates) {
			const key = toDateKey(date);
			if (isPausedOn(habit, key)) {
				continue;
			}
			if (key < startKey) {
				continue;
			}
			recentDue++;
			if (isComplete(habit, key)) {
				recentHits++;
			}
		}

		const completedLabel =
			habit.goalDirection === "max"
				? t("Days within limit")
				: habit.frequency === "weekly"
					? t("Weeks completed")
					: habit.frequency === "monthly"
						? t("Months completed")
						: t("Days completed");
		const rateLabel =
			habit.frequency === "daily" ? t("30-day rate") : t("Recent rate");

		const tiles = [
			{
				value: String(currentStreak(habit, today)),
				label: t("Current streak"),
			},
			{
				value: String(longestStreak(habit, today)),
				label: t("Best streak"),
			},
			{ value: String(completedDays), label: completedLabel },
			{
				value:
					recentDue > 0
						? `${Math.round((recentHits / recentDue) * 100)}%`
						: "–",
				label: rateLabel,
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
		const red = this.resolveColor("", "var(--color-red, #e05d5d)");
		const isMax = habit.goalDirection === "max";

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
			const value = habit.records[key] ?? 0;
			values.push(value);
			// Over-limit days show red; other incomplete days (including
			// days before a limit habit started) stay dim and neutral.
			colors.push(
				isMax && value > limitOf(habit)
					? this.withAlpha(red, 0.8)
					: isComplete(habit, key)
						? green
						: this.withAlpha(accent, 0.45),
			);
		}

		const datasets: ChartDataset<"bar" | "line", number[]>[] = [
			{
				type: "bar",
				label: habit.unit || t("Logged"),
				data: values,
				backgroundColor: colors,
				borderRadius: 3,
			},
		];
		if (habit.type !== "binary" && habit.target > 0) {
			datasets.push({
				type: "line",
				label: isMax ? t("Limit") : t("Target"),
				data: new Array(DAILY_DAYS).fill(habit.target) as number[],
				borderColor: this.withAlpha(isMax ? red : green, 0.7),
				borderDash: [6, 4],
				borderWidth: 1.5,
				pointRadius: 0,
			});
		}

		this.createChart(t("Last 30 days"), {
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
				const key = toDateKey(day);
				if (isPausedOn(habit, key)) {
					continue;
				}
				// Days before the habit started don't count against it.
				if (key < trackingStartKey(habit, today)) {
					continue;
				}
				elapsed++;
				if (isComplete(habit, key)) {
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

		this.createChart(t("Weekly completion rate"), {
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

	/** The last `count` due dates on or before `end`, oldest first. */
	private recentDueDates(
		habit: HabitDefinition,
		count: number,
		end: Date,
	): Date[] {
		const dates: Date[] = [];
		let cursor = new Date(
			end.getFullYear(),
			end.getMonth(),
			end.getDate(),
		);
		// Guard against pathological loops on a brand-new habit.
		const maxScan = 366 * 10;
		let scanned = 0;
		while (dates.length < count && scanned < maxScan) {
			if (isDue(habit, cursor)) {
				dates.push(new Date(cursor));
			}
			cursor = addDays(cursor, -1);
			scanned++;
		}
		return dates.reverse();
	}

	/**
	 * Bar chart of the most recent due dates for a weekly or monthly habit,
	 * labelled with the actual date each one falls on. Complete periods show
	 * in theme green; a dashed line marks the target for counted/timed habits.
	 */
	private renderDueActivityChart(habit: HabitDefinition): void {
		const today = new Date();
		const dates = this.recentDueDates(
			habit,
			RECENT_POINTS[habit.frequency],
			today,
		);
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
		for (const date of dates) {
			const key = toDateKey(date);
			labels.push(
				date.toLocaleDateString(undefined, {
					day: "numeric",
					month: "short",
				}),
			);
			values.push(habit.records[key] ?? 0);
			colors.push(
				isComplete(habit, key)
					? green
					: this.withAlpha(accent, 0.45),
			);
		}

		const datasets: ChartDataset<"bar" | "line", number[]>[] = [
			{
				type: "bar",
				label: habit.unit || t("Logged"),
				data: values,
				backgroundColor: colors,
				borderRadius: 3,
			},
		];
		if (habit.type !== "binary" && habit.target > 0) {
			datasets.push({
				type: "line",
				label: t("Target"),
				data: new Array(dates.length).fill(habit.target) as number[],
				borderColor: this.withAlpha(green, 0.7),
				borderDash: [6, 4],
				borderWidth: 1.5,
				pointRadius: 0,
			});
		}

		const title =
			habit.frequency === "weekly"
				? t("Weekly activity")
				: t("Monthly activity");
		this.createChart(title, {
			type: "bar",
			data: { labels, datasets },
			options: this.baseOptions(habit.type === "binary" ? 1 : undefined),
		});
	}

	/**
	 * Line chart of a rolling completion rate over recent due periods, so a
	 * weekly or monthly habit shows a smooth trend rather than a 0/100 zig-zag.
	 */
	private renderDueRateChart(habit: HabitDefinition): void {
		const today = new Date();
		const window = ROLLING_WINDOW[habit.frequency];
		const dates = this.recentDueDates(
			habit,
			RECENT_POINTS[habit.frequency],
			today,
		);
		const accent = this.resolveColor(
			habit.color,
			"var(--interactive-accent)",
		);

		const labels: string[] = [];
		const rates: number[] = [];
		for (let i = 0; i < dates.length; i++) {
			labels.push(
				dates[i].toLocaleDateString(undefined, {
					day: "numeric",
					month: "short",
				}),
			);
			let considered = 0;
			let completed = 0;
			for (let j = Math.max(0, i - window + 1); j <= i; j++) {
				const key = toDateKey(dates[j]);
				if (isPausedOn(habit, key)) {
					continue;
				}
				considered++;
				if (isComplete(habit, key)) {
					completed++;
				}
			}
			rates.push(
				considered > 0
					? Math.round((completed / considered) * 100)
					: 0,
			);
		}

		const options = this.baseOptions(100);
		const yTicks = options.scales?.y?.ticks;
		if (yTicks) {
			(yTicks as { callback?: (value: unknown) => string }).callback = (
				value: unknown,
			) => `${String(value)}%`;
		}

		const title =
			habit.frequency === "weekly"
				? t("{n}-week completion rate", { n: window })
				: t("{n}-month completion rate", { n: window });
		this.createChart(title, {
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
		const probe = this.containerEl.doc.body.createSpan();
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
