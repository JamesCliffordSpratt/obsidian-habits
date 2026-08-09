import {
	App,
	MarkdownRenderChild,
	debounce,
	normalizePath,
	setIcon,
} from "obsidian";
import { t } from "../i18n";
import type { HabitStore } from "../habit-store";
import type { HabitsPluginSettings } from "../settings";
import type { HabitDefinition } from "../types";
import { getStatsRange, habitStats, type DateRange } from "../stats";
import {
	formatTimeOfDay,
	groupHabits,
	habitScheduleLabel,
	sectionLabel,
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
		const sections = groupHabits(
			this.sortByTime(habits),
			true,
			this.getSettings().groupOrder,
		);
		const showSections =
			sections.length > 1 || (sections[0] && sections[0].key !== "");

		const table = root.createEl("table", { cls: "habits-table" });
		const head = table.createEl("thead").createEl("tr");
		head.createEl("th", { text: t("Habit") });
		head.createEl("th", { text: t("Schedule") });
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
					attr: { colspan: String(2 + columns.length) },
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
	 * The schedule cell always names the cadence — a daily habit reads
	 * "Daily" rather than the empty label cards use — plus the planned
	 * time when one is set.
	 */
	private scheduleText(habit: HabitDefinition): string {
		const schedule = habitScheduleLabel(habit) || t("Daily");
		return habit.time
			? `${schedule} · ${formatTimeOfDay(habit.time)}`
			: schedule;
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
	 * earliest first (the day's timeline), then untimed habits by name.
	 * Grouping itself happens afterwards and preserves this order.
	 */
	private sortByTime(habits: HabitDefinition[]): HabitDefinition[] {
		return [...habits].sort(
			(a, b) =>
				Number(a.time === "") - Number(b.time === "") ||
				a.time.localeCompare(b.time) ||
				a.name.localeCompare(b.name),
		);
	}
}
