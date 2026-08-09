import {
	App,
	MarkdownRenderChild,
	debounce,
	normalizePath,
	setIcon,
	type Events,
} from "obsidian";
import { t } from "../i18n";
import type { HabitStore } from "../habit-store";
import type { HabitsPluginSettings } from "../settings";
import type { HabitDefinition } from "../types";
import {
	getStatsRange,
	habitStats,
	isDue,
	isPausedOn,
	limitOf,
	type DateRange,
} from "../stats";
import {
	formatTimeOfDay,
	groupHabits,
	habitScheduleLabel,
	sectionLabel,
	toDateKey,
} from "../utils";

/** One column of period counts: a header label and its date range. */
interface PeriodColumn {
	label: string;
	range: DateRange;
}

/**
 * Renders a `habits-table` code block: one row per active habit with its
 * schedule and completed/due counts for the current week and the last three
 * calendar months. Counts come from {@link habitStats}, so they follow the
 * same rules as everywhere else — only due days count, paused days and days
 * before the habit existed are excluded, and periods cut off at today.
 */
export class HabitsTable extends MarkdownRenderChild {
	constructor(
		private app: App,
		private store: HabitStore,
		private getSettings: () => HabitsPluginSettings,
		private pluginEvents: Events,
		root: HTMLElement,
	) {
		super(root);
	}

	onload(): void {
		this.containerEl.addClass("habits-table-block");
		// Same freshness contract as the dashboard: re-render whenever a
		// habit note changes on disk, from any pane, device sync included.
		const requestRender = debounce(() => this.render(), 250, true);
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				if (this.isHabitFile(file.path)) {
					requestRender();
				}
			}),
		);
		this.registerEvent(
			this.app.vault.on("create", (file) => {
				if (this.isHabitFile(file.path)) {
					requestRender();
				}
			}),
		);
		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (this.isHabitFile(file.path)) {
					requestRender();
				}
			}),
		);
		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (
					this.isHabitFile(file.path) ||
					this.isHabitFile(oldPath)
				) {
					requestRender();
				}
			}),
		);
		this.registerEvent(
			this.pluginEvents.on("settings-changed", () => {
				requestRender();
			}),
		);
		this.render();
	}

	/** True when the path lives inside the configured habits folder. */
	private isHabitFile(path: string): boolean {
		const folder = normalizePath(this.getSettings().habitsFolder);
		return path === folder || path.startsWith(`${folder}/`);
	}

	private render(): void {
		const root = this.containerEl;
		root.empty();

		const habits = this.store
			.getHabits()
			.filter((habit) => !habit.stopped);
		if (habits.length === 0) {
			root.createDiv({
				cls: "habits-table-empty",
				text: t("No habits to show stats for yet."),
			});
			return;
		}

		const today = new Date();
		const columns = this.periodColumns(today);
		const settings = this.getSettings();
		const sections = groupHabits(
			this.sortByTime(habits),
			settings.tableGrouping,
			settings.groupOrder,
		);
		const showSections =
			sections.length > 1 || (sections[0] && sections[0].key !== "");

		const table = root.createEl("table", { cls: "habits-table" });
		const head = table.createEl("thead").createEl("tr");
		head.createEl("th", { text: t("Habit") });
		head.createEl("th", { text: t("Schedule") });
		head.createEl("th", { text: t("Today") });
		for (const column of columns) {
			head.createEl("th", {
				cls: "habits-table-count",
				text: column.label,
			});
		}

		const body = table.createEl("tbody");
		for (const section of sections) {
			if (showSections) {
				const row = body.createEl("tr", {
					cls: "habits-table-group",
				});
				row.createEl("td", {
					text: sectionLabel(section.key),
					attr: { colspan: String(3 + columns.length) },
				});
			}
			for (const habit of section.habits) {
				this.renderRow(body, habit, columns, today);
			}
		}
	}

	private renderRow(
		body: HTMLElement,
		habit: HabitDefinition,
		columns: PeriodColumn[],
		today: Date,
	): void {
		const row = body.createEl("tr");

		const nameCell = row.createEl("td", { cls: "habits-table-name" });
		const link = nameCell.createEl("a", {
			cls: "habits-table-link",
			text: habit.name,
		});
		this.registerDomEvent(link, "click", (evt) => {
			evt.preventDefault();
			void this.app.workspace.openLinkText(habit.path, "", false);
		});
		if (habit.paused) {
			const badge = nameCell.createSpan({
				cls: "habits-table-paused",
				attr: { "aria-label": t("Paused") },
			});
			setIcon(badge, "pause");
		}

		row.createEl("td", {
			cls: "habits-table-schedule",
			text: this.scheduleText(habit),
		});

		const todayCell = row.createEl("td", { cls: "habits-table-today" });
		this.renderTodayCell(todayCell, habit, today);

		for (const column of columns) {
			const stats = habitStats(habit, column.range, today);
			row.createEl("td", {
				cls: "habits-table-count",
				text:
					stats.days > 0
						? `${stats.completed}/${stats.days}`
						: "–",
			});
		}
	}

	/**
	 * The interactive Today column, sitting between the schedule and the
	 * period counts: log today's value without leaving the table.
	 * Binary habits get the Done/Not done pill, limit habits the
	 * slip toggle, counted and timed habits a compact stepper. Habits not
	 * due today show a dash; paused habits a pause glyph. The cell redraws
	 * itself optimistically on click — the count columns catch up when the
	 * note change comes back through the metadata cache.
	 */
	private renderTodayCell(
		cell: HTMLElement,
		habit: HabitDefinition,
		today: Date,
	): void {
		cell.empty();
		const dateKey = toDateKey(today);

		if (isPausedOn(habit, dateKey)) {
			const badge = cell.createSpan({
				cls: "habits-table-paused",
				attr: { "aria-label": t("Paused") },
			});
			setIcon(badge, "pause");
			return;
		}
		if (!isDue(habit, today)) {
			cell.createSpan({ cls: "habits-table-notdue", text: "–" });
			return;
		}

		const value = habit.records[dateKey] ?? 0;
		const commit = async (next: number): Promise<void> => {
			const clamped = Math.max(0, next);
			// Mirror the write locally so the cell can redraw immediately;
			// the store keeps zero-values out of frontmatter, so do the same.
			if (clamped > 0) {
				habit.records[dateKey] = clamped;
			} else {
				delete habit.records[dateKey];
			}
			this.renderTodayCell(cell, habit, today);
			await this.store.setRecord(habit, dateKey, clamped);
		};

		if (habit.type === "binary" && habit.goalDirection === "max") {
			const slipped = value >= 1;
			const pill = this.createPill(
				cell,
				slipped ? "x" : "check",
				slipped ? t("Slipped") : t("Clean"),
				slipped ? t("Mark as clean") : t("Mark as slipped"),
				slipped,
			);
			pill.addClass("habits-table-slip");
			this.registerDomEvent(pill, "click", () => {
				void commit(slipped ? 0 : 1);
			});
			return;
		}

		if (habit.type === "binary") {
			const done = value >= 1;
			const pill = this.createPill(
				cell,
				done ? "check" : "circle",
				done ? t("Done") : t("Not done"),
				done ? t("Mark as not done") : t("Mark as done"),
				done,
			);
			this.registerDomEvent(pill, "click", () => {
				void commit(done ? 0 : 1);
			});
			return;
		}

		// Counted and timed habits: [−] value/goal [+]. Timed habits step
		// in 5-minute chunks, matching the spirit of the panel's steppers.
		const step = habit.type === "timed" ? 5 : 1;
		const goal =
			habit.goalDirection === "max" ? limitOf(habit) : habit.target;
		const stepper = cell.createDiv({ cls: "habits-table-stepper" });
		const minus = stepper.createEl("button", {
			cls: "habits-icon-button habits-table-mini",
			attr: { type: "button", "aria-label": t("Decrease by 1") },
		});
		setIcon(minus, "minus");
		this.registerDomEvent(minus, "click", () => {
			void commit(value - step);
		});
		stepper.createSpan({
			cls: "habits-table-value",
			text: `${value}/${goal}`,
		});
		const plus = stepper.createEl("button", {
			cls: "habits-icon-button habits-table-mini",
			attr: {
				type: "button",
				"aria-label": t("Increase by {n}", { n: step }),
			},
		});
		setIcon(plus, "plus");
		this.registerDomEvent(plus, "click", () => {
			void commit(value + step);
		});
	}

	/** The Done/Not done-style pill used by the binary today controls. */
	private createPill(
		cell: HTMLElement,
		icon: string,
		label: string,
		ariaLabel: string,
		active: boolean,
	): HTMLButtonElement {
		const pill = cell.createEl("button", {
			cls: "habits-table-toggle",
			attr: {
				type: "button",
				"aria-label": ariaLabel,
				"aria-pressed": String(active),
			},
		});
		pill.toggleClass("is-done", active);
		const glyph = pill.createSpan({ cls: "habits-table-toggle-icon" });
		setIcon(glyph, icon);
		pill.createSpan({ text: label });
		return pill;
	}

	/**
	 * The schedule cell always names the cadence — a daily habit reads
	 * "Daily" rather than the empty label cards use — plus the planned
	 * time when one is set.
	 */
	private scheduleText(habit: HabitDefinition): string {
		const schedule = habitScheduleLabel(habit) || t("Daily");
		const times = habit.times.map(formatTimeOfDay).join(", ");
		return times ? `${schedule} · ${times}` : schedule;
	}

	/**
	 * The four count columns: the current calendar week (Monday-first,
	 * matching the stats view) and the current plus two previous calendar
	 * months, labelled with locale month names.
	 */
	private periodColumns(today: Date): PeriodColumn[] {
		const columns: PeriodColumn[] = [
			{
				label: t("This week"),
				range: getStatsRange(today, "weekly", "calendar"),
			},
		];
		for (let back = 0; back < 3; back++) {
			const start = new Date(
				today.getFullYear(),
				today.getMonth() - back,
				1,
			);
			const end = new Date(
				today.getFullYear(),
				today.getMonth() - back + 1,
				0,
			);
			columns.push({
				label: start.toLocaleDateString(undefined, {
					month: "short",
				}),
				range: { start, end },
			});
		}
		return columns;
	}

	/**
	 * Table order within each group: habits with a planned time first,
	 * earliest first (the day's timeline, using each habit's first time),
	 * then untimed habits by name. Grouping itself happens afterwards and
	 * preserves this order.
	 */
	private sortByTime(habits: HabitDefinition[]): HabitDefinition[] {
		const first = (habit: HabitDefinition) => habit.times[0] ?? "";
		return [...habits].sort(
			(a, b) =>
				Number(first(a) === "") - Number(first(b) === "") ||
				first(a).localeCompare(first(b)) ||
				a.name.localeCompare(b.name),
		);
	}
}
