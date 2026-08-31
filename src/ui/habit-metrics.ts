import {
	App,
	debounce,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	setIcon,
	TFile,
} from "obsidian";
import "./chart-setup";
import { t } from "../i18n";
import {
	Chart,
	type ChartConfiguration,
	type ChartDataset,
} from "chart.js";
import type { MatrixDataPoint } from "chartjs-chart-matrix";
import { resolveColor, withAlpha } from "./color-utils";
import { monthGrid, mountHeatmapChart, pointsFromGrid, weekGrid } from "./heatmap";
import type { HabitStore } from "../habit-store";
import type { HabitDefinition, HabitFrequency } from "../types";
import {
	currentStreak,
	isActive,
	isComplete,
	isDue,
	isFlexible,
	isPausedOn,
	limitOf,
	trackingStartKey,
	longestStreak,
} from "../stats";
import { addDays, fromDateKey, toDateKey } from "../utils";

const DAILY_DAYS = 30;
const WEEKLY_WEEKS = 12;
/** Width, in weeks, of the multi-month history heatmap (~6 months). */
const HISTORY_WEEKS = 26;

/** A day's state on the activity heatmaps, driving both colour and tooltip. */
type HeatmapState =
	| "future"
	| "prestart"
	| "notdue"
	| "outside"
	| "paused"
	| "complete"
	| "over"
	| "partial"
	| "empty";

interface HeatmapPoint extends MatrixDataPoint {
	key: string;
	value: number;
	state: HeatmapState;
}

/** Which section of a habit's metrics block is on screen. */
type MetricsView = "charts" | "month" | "history";

/**
 * How many recent due dates to plot for weekly and monthly habits. Daily
 * habits keep their own 30-day and 12-week charts; the value is also used as
 * the sample size for each habit's recent completion rate.
 */
const RECENT_POINTS: Record<HabitFrequency, number> = {
	daily: 30,
	weekly: 16,
	monthly: 12,
	interval: 16,
	flexibleWeekly: 16,
	flexibleMonthly: 12,
};

/** Trailing window, in due periods, for the rolling completion-rate line. */
const ROLLING_WINDOW: Record<HabitFrequency, number> = {
	daily: 7,
	weekly: 4,
	monthly: 3,
	interval: 5,
	flexibleWeekly: 4,
	flexibleMonthly: 3,
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
	/**
	 * Which section is on screen. Set once from the block
	 * source on load, then mutated in place by the tab clicks so a refresh
	 * triggered by our own source rewrite (see {@link persistView}) doesn't
	 * stomp it back to whatever was last saved.
	 */
	private view: MetricsView = "charts";

	constructor(
		private app: App,
		private store: HabitStore,
		private sourcePath: string,
		private source: string,
		root: HTMLElement,
		private ctx: MarkdownPostProcessorContext,
	) {
		super(root);
	}

	onload(): void {
		this.containerEl.addClass("habits-metrics");
		this.view = this.requestedView();
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

	/** The view named in the block source (`view: month`/`view: history`), if any. */
	private requestedView(): MetricsView {
		const match = /^\s*view\s*:\s*(.+?)\s*$/im.exec(this.source);
		const value = match?.[1].toLowerCase();
		return value === "month" || value === "history" ? value : "charts";
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
		// With no `habit: <name>` override, the block is inherently tied to
		// its own note, so it must keep watching that note even while it
		// isn't a recognised habit yet — otherwise adding `type: binary`
		// (turning a plain note into one) would go undetected, and the
		// block would keep showing its "not a habit note" message until
		// the note is reopened.
		this.watchedPath = requested ? (habit?.path ?? "") : this.sourcePath;

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
		this.renderViewTabs();
		if (this.view === "month") {
			this.renderMonthHeatmap(habit);
		} else if (this.view === "history") {
			this.renderHistoryHeatmap(habit);
		} else if (habit.frequency === "daily") {
			this.renderDailyChart(habit);
			this.renderWeeklyChart(habit);
		} else {
			this.renderDueActivityChart(habit);
			this.renderDueRateChart(habit);
		}
	}

	/** Charts/Month/History tab bar. */
	private renderViewTabs(): void {
		const tabs = this.containerEl.createDiv({ cls: "habits-metrics-tabs" });
		const makeTab = (view: MetricsView, label: string): void => {
			const button = tabs.createEl("button", {
				cls: "habits-metrics-tab",
				text: label,
				attr: { type: "button" },
			});
			button.toggleClass("is-active", this.view === view);
			this.registerDomEvent(button, "click", () => {
				if (this.view === view) {
					return;
				}
				this.view = view;
				void this.persistView(view);
				this.render();
			});
		};
		makeTab("charts", t("Charts"));
		makeTab("month", t("Month"));
		makeTab("history", t("History"));
	}

	/**
	 * Save the chosen view onto the block's own `view:` source line, so it
	 * reopens on the same tab next time. Best-effort: if the section can't
	 * be located (e.g. the block is mid-edit), the in-memory tab selection
	 * still stands, it just won't survive a reload.
	 */
	private async persistView(view: MetricsView): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(this.sourcePath);
		if (!(file instanceof TFile)) {
			return;
		}
		const info = this.ctx.getSectionInfo(this.containerEl);
		if (!info) {
			return;
		}
		const { lineStart, lineEnd } = info;
		await this.app.vault.process(file, (content) => {
			const lines = content.split("\n");
			if (lines[lineStart] === undefined || lines[lineEnd] === undefined) {
				return content;
			}
			const inner = lines
				.slice(lineStart + 1, lineEnd)
				.filter((line) => !/^\s*view\s*:/i.test(line));
			if (view !== "charts") {
				inner.push(`view: ${view}`);
			}
			return [
				...lines.slice(0, lineStart + 1),
				...inner,
				...lines.slice(lineEnd),
			].join("\n");
		});
	}

	/**
	 * A day's colour/tooltip state on either heatmap. Days the habit isn't
	 * due (weekends for a weekday-only habit, most of the month for a
	 * monthly one) read as `notdue` ahead of every other state — including
	 * `future` and `paused` — so a day that was never going to happen never
	 * reads as a miss.
	 */
	private heatmapState(
		habit: HabitDefinition,
		key: string,
		date: Date,
		todayKey: string,
		startKey: string,
	): { state: HeatmapState; value: number } {
		const value = habit.records[key] ?? 0;
		if (key < startKey) {
			return { state: "prestart", value };
		}
		if (!isActive(habit, date)) {
			return { state: "notdue", value };
		}
		if (key > todayKey) {
			return { state: "future", value };
		}
		if (isPausedOn(habit, key)) {
			return { state: "paused", value };
		}
		if (isComplete(habit, key)) {
			return { state: "complete", value };
		}
		if (habit.goalDirection === "max" && value > limitOf(habit)) {
			return { state: "over", value };
		}
		return { state: value > 0 ? "partial" : "empty", value };
	}

	/** Cell fill for a heatmap state, coloured by the habit's own accent. */
	private heatmapFill(state: HeatmapState, accent: string, red: string, neutral: string): string {
		switch (state) {
			case "complete":
				return accent;
			case "partial":
				return withAlpha(accent, 0.45);
			case "over":
				return withAlpha(red, 0.8);
			case "paused":
			case "future":
				return "transparent";
			case "outside":
			case "prestart":
			case "notdue":
				return withAlpha(neutral, 0.25);
			default:
				return neutral;
		}
	}

	/** Cell border for a heatmap state; only paused/future days get one. */
	private heatmapBorder(
		state: HeatmapState,
		neutral: string,
	): { color: string; width: number } {
		if (state === "paused" || state === "future") {
			return { color: withAlpha(neutral, 0.8), width: 1 };
		}
		return { color: "transparent", width: 0 };
	}

	/** Tooltip lines for a heatmap cell. */
	private heatmapTooltip(point: HeatmapPoint, habit: HabitDefinition): string[] {
		const date = fromDateKey(point.key);
		const dateLabel = date
			? date.toLocaleDateString(undefined, {
					day: "numeric",
					month: "short",
					year: "numeric",
				})
			: point.key;
		const unit = habit.unit || (habit.type === "timed" ? "min" : "");
		const stateLabel: Record<HeatmapState, string> = {
			future: t("Upcoming"),
			prestart: t("Not tracked yet"),
			notdue: t("Not due"),
			outside: t("Outside this month"),
			paused: t("Paused"),
			complete: t("Complete"),
			over: t("Over limit"),
			partial: t("Logged"),
			empty: t("Not logged"),
		};
		const lines = [dateLabel, stateLabel[point.state]];
		const skipsValue: HeatmapState[] = ["future", "prestart", "notdue", "outside"];
		if (habit.type !== "binary" && !skipsValue.includes(point.state)) {
			lines.push(`${point.value}${unit ? ` ${unit}` : ""}`);
		}
		return lines;
	}

	/**
	 * Calendar-style heatmap of the current month: weekdays across, weeks
	 * down, matching a normal wall calendar. Leading/trailing days from the
	 * neighbouring months fill out the grid and are shown dimmed.
	 */
	private renderMonthHeatmap(habit: HabitDefinition): void {
		const today = new Date();
		const todayKey = toDateKey(today);
		const startKey = trackingStartKey(habit, today);
		const grid = monthGrid(today);

		const points = pointsFromGrid(grid, (cell) => {
			const info = cell.inRange
				? this.heatmapState(habit, cell.key, cell.date, todayKey, startKey)
				: { state: "outside" as HeatmapState, value: 0 };
			return {
				v: info.value,
				key: cell.key,
				value: info.value,
				state: info.state,
			};
		});

		const title = t("{month} heatmap", {
			month: today.toLocaleDateString(undefined, {
				month: "long",
				year: "numeric",
			}),
		});
		this.renderHeatmapChart(habit, title, points, grid.xLabels, grid.yLabels);
	}

	/**
	 * GitHub-style activity heatmap: one column per week over the last
	 * {@link HISTORY_WEEKS} (~6 months), Monday to Sunday top to bottom.
	 */
	private renderHistoryHeatmap(habit: HabitDefinition): void {
		const today = new Date();
		const todayKey = toDateKey(today);
		const startKey = trackingStartKey(habit, today);
		const grid = weekGrid(today, HISTORY_WEEKS);

		const points = pointsFromGrid(grid, (cell) => {
			const info = this.heatmapState(habit, cell.key, cell.date, todayKey, startKey);
			return {
				v: info.value,
				key: cell.key,
				value: info.value,
				state: info.state,
			};
		});

		this.renderHeatmapChart(
			habit,
			t("Last {n} weeks", { n: HISTORY_WEEKS }),
			points,
			grid.xLabels,
			grid.yLabels,
			grid.monthTicks,
		);
	}

	/** Shared matrix-chart builder for both heatmap views. */
	private renderHeatmapChart(
		habit: HabitDefinition,
		title: string,
		points: HeatmapPoint[],
		xLabels: string[],
		yLabels: string[],
		/** Column tick text, e.g. only the weeks where the month changes. */
		xTickLabels?: string[],
	): void {
		const accent = resolveColor(
			this.containerEl,
			habit.color,
			"var(--interactive-accent)",
		);
		const red = resolveColor(this.containerEl, "", "var(--color-red, #e05d5d)");
		const neutral = resolveColor(
			this.containerEl,
			"",
			"var(--background-modifier-border)",
		);
		const text = resolveColor(this.containerEl, "", "var(--text-muted)");

		mountHeatmapChart(
			this.containerEl,
			this.charts,
			title,
			points,
			xLabels,
			yLabels,
			{
				background: points.map((p) =>
					this.heatmapFill(p.state, accent, red, neutral),
				),
				border: points.map(
					(p) => this.heatmapBorder(p.state, neutral).color,
				),
				borderWidth: points.map(
					(p) => this.heatmapBorder(p.state, neutral).width,
				),
			},
			(point) => this.heatmapTooltip(point, habit),
			text,
			xTickLabels,
		);
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
				: habit.frequency === "flexibleWeekly" ||
						(habit.frequency === "weekly" &&
							habit.weekdays.length === 1)
					? t("Weeks completed")
					: habit.frequency === "flexibleMonthly" ||
							habit.frequency === "monthly"
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
		const accent = resolveColor(this.containerEl,
			habit.color,
			"var(--interactive-accent)",
		);
		const green = resolveColor(this.containerEl,
			"",
			"var(--color-green, var(--text-success))",
		);
		const red = resolveColor(this.containerEl,"", "var(--color-red, #e05d5d)");
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
					? withAlpha(red, 0.8)
					: isComplete(habit, key)
						? green
						: withAlpha(accent, 0.45),
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
		// A flexible habit's target is a per-period goal; drawn as a flat
		// daily line it would misleadingly read as a daily one.
		if (habit.type !== "binary" && habit.target > 0 && !isFlexible(habit)) {
			datasets.push({
				type: "line",
				label: isMax ? t("Limit") : t("Target"),
				data: new Array(DAILY_DAYS).fill(habit.target) as number[],
				borderColor: withAlpha(isMax ? red : green, 0.7),
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
		const accent = resolveColor(this.containerEl,
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
			if (isFlexible(habit)) {
				// A per-day ratio would inflate the rate for any week
				// satisfied early (isComplete stays true for the rest of
				// it), so this is a plain pass/fail for the week instead —
				// as of its last elapsed day.
				const weekEnd = addDays(start, 6);
				const through =
					weekEnd.getTime() > base.getTime() ? base : weekEnd;
				const throughKey = toDateKey(through);
				const trackable = throughKey >= trackingStartKey(habit, today);
				rates.push(
					trackable && isComplete(habit, throughKey) ? 100 : 0,
				);
				continue;
			}
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
						backgroundColor: withAlpha(accent, 0.18),
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
		const accent = resolveColor(this.containerEl,
			habit.color,
			"var(--interactive-accent)",
		);
		const green = resolveColor(this.containerEl,
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
					: withAlpha(accent, 0.45),
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
				borderColor: withAlpha(green, 0.7),
				borderDash: [6, 4],
				borderWidth: 1.5,
				pointRadius: 0,
			});
		}

		const title =
			habit.frequency === "weekly"
				? t("Weekly activity")
				: habit.frequency === "interval"
					? t("Activity on due days")
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
		const accent = resolveColor(this.containerEl,
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
				: habit.frequency === "interval"
					? t("Completion rate over {n} due days", { n: window })
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
						backgroundColor: withAlpha(accent, 0.18),
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
		const text = resolveColor(this.containerEl,"", "var(--text-muted)");
		const grid = withAlpha(
			resolveColor(this.containerEl,"", "var(--background-modifier-border)"),
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
}
