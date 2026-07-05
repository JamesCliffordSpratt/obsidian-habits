import {
	debounce,
	Events,
	ItemView,
	Menu,
	normalizePath,
	setIcon,
	setTooltip,
	WorkspaceLeaf,
} from "obsidian";
import type { HabitStore } from "../habit-store";
import type { HabitsPluginSettings } from "../settings";
import type { HabitDefinition } from "../types";
import { isComplete, isPausedOn } from "../stats";
import { registerLongPress, toDateKey } from "../utils";
import { t } from "../i18n";
import { HabitModal } from "./habit-modal";
import { ConfirmModal } from "./confirm-modal";
import { applyHabitIcon } from "./icon-suggest-modal";

export const HABITS_PANEL_VIEW_TYPE = "habits-panel";

/**
 * Compact sidebar view for logging today's habits on the fly.
 *
 * Designed for narrow widths: one slim row per habit with the smallest
 * possible controls, a today summary in the header, and the same
 * incomplete → completed → paused ordering as the dashboard.
 */
export class HabitsPanelView extends ItemView {
	private habits: HabitDefinition[] = [];
	/** Suppresses event-driven reloads while a row celebration plays. */
	private suppressAutoReload = false;

	constructor(
		leaf: WorkspaceLeaf,
		private store: HabitStore,
		private getSettings: () => HabitsPluginSettings,
		private pluginEvents: Events,
	) {
		super(leaf);
	}

	getViewType(): string {
		return HABITS_PANEL_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t("Habits");
	}

	getIcon(): string {
		return "list-checks";
	}

	async onOpen(): Promise<void> {
		this.contentEl.addClass("habits-panel");

		const requestReload = debounce(() => this.autoReload(), 250, true);
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				if (this.isHabitFile(file.path)) {
					requestReload();
				}
			}),
		);
		this.registerEvent(
			this.app.vault.on("create", (file) => {
				if (this.isHabitFile(file.path)) {
					requestReload();
				}
			}),
		);
		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (this.isHabitFile(file.path)) {
					requestReload();
				}
			}),
		);
		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (
					this.isHabitFile(file.path) ||
					this.isHabitFile(oldPath)
				) {
					requestReload();
				}
			}),
		);
		this.registerEvent(
			this.pluginEvents.on("settings-changed", () => {
				requestReload();
			}),
		);

		this.reload();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	/** True when the path lives inside the configured habits folder. */
	private isHabitFile(path: string): boolean {
		const folder = normalizePath(this.getSettings().habitsFolder);
		return path === folder || path.startsWith(`${folder}/`);
	}

	private autoReload(): void {
		if (this.suppressAutoReload) {
			return;
		}
		const active = this.contentEl.doc.activeElement;
		if (
			active instanceof HTMLInputElement &&
			this.contentEl.contains(active)
		) {
			return;
		}
		this.reload();
	}

	private reload(): void {
		this.habits = this.store
			.getHabits()
			.filter((habit) => !habit.stopped);
		this.render();
	}

	private todayKey(): string {
		return toDateKey(new Date());
	}

	private valueOf(habit: HabitDefinition): number {
		return habit.records[this.todayKey()] ?? 0;
	}

	private isDone(habit: HabitDefinition): boolean {
		return isComplete(habit, this.todayKey());
	}

	private isPausedToday(habit: HabitDefinition): boolean {
		return isPausedOn(habit, this.todayKey());
	}

	/** Incomplete first, completed next, paused parked at the end. */
	private ordered(): HabitDefinition[] {
		const active = this.habits.filter(
			(habit) => !this.isPausedToday(habit),
		);
		return [
			...active.filter((habit) => !this.isDone(habit)),
			...active.filter((habit) => this.isDone(habit)),
			...this.habits.filter((habit) => this.isPausedToday(habit)),
		];
	}

	private render(): void {
		const root = this.contentEl;
		root.empty();

		const header = root.createDiv({ cls: "habits-panel-header" });
		const title = header.createDiv({ cls: "habits-panel-title" });
		title.createSpan({ text: t("Today") });
		title.createSpan({
			cls: "habits-panel-date",
			text: new Date().toLocaleDateString(undefined, {
				weekday: "short",
				day: "numeric",
				month: "short",
			}),
		});

		const trackable = this.habits.filter(
			(habit) => !this.isPausedToday(habit),
		);
		const doneCount = trackable.filter((habit) =>
			this.isDone(habit),
		).length;
		if (trackable.length > 0) {
			const count = header.createDiv({ cls: "habits-panel-count" });
			count.setText(`${doneCount}/${trackable.length}`);
			count.toggleClass("is-all-done", doneCount === trackable.length);
			setTooltip(count, t("Habits completed today"));
		}

		const add = header.createEl("button", {
			cls: "habits-icon-button habits-panel-add",
			attr: { type: "button", "aria-label": t("Add habit") },
		});
		setIcon(add, "plus");
		this.registerDomEvent(add, "click", () => {
			new HabitModal(this.app, this.store, () => this.reload()).open();
		});

		if (this.habits.length === 0) {
			const empty = root.createDiv({ cls: "habits-panel-empty" });
			empty.createEl("p", { text: t("No habits yet.") });
			const button = empty.createEl("button", {
				cls: "mod-cta",
				text: t("Create habit"),
				attr: { type: "button" },
			});
			this.registerDomEvent(button, "click", () => {
				new HabitModal(this.app, this.store, () =>
					this.reload(),
				).open();
			});
			return;
		}

		const list = root.createDiv({ cls: "habits-panel-list" });
		for (const habit of this.ordered()) {
			this.renderRow(list, habit);
		}
	}

	private renderRow(list: HTMLElement, habit: HabitDefinition): void {
		const row = list.createDiv({ cls: "habits-panel-row" });
		if (habit.color) {
			row.setCssProps({ "--habits-accent": habit.color });
		}
		this.registerDomEvent(row, "contextmenu", (evt: MouseEvent) => {
			evt.preventDefault();
			this.showRowMenu(habit, evt.clientX, evt.clientY);
		});
		registerLongPress(this, row, (x, y) => {
			this.showRowMenu(habit, x, y);
		});

		const main = row.createDiv({ cls: "habits-panel-row-main" });
		if (habit.icon) {
			const icon = main.createSpan({ cls: "habits-panel-icon" });
			applyHabitIcon(icon, habit.icon);
		}
		const name = main.createEl("button", {
			cls: "habits-panel-name",
			text: habit.name,
			attr: {
				type: "button",
				"aria-label": t("Open the note for {name}", { name: habit.name }),
			},
		});
		setTooltip(name, t("Open habit note"));
		this.registerDomEvent(name, "click", () => {
			void this.app.workspace.openLinkText(habit.path, "", false);
		});

		if (this.isPausedToday(habit)) {
			row.addClass("is-paused");
			const resume = main.createEl("button", {
				cls: "habits-icon-button habits-panel-mini",
				attr: { type: "button", "aria-label": t("Resume habit") },
			});
			setIcon(resume, "play");
			setTooltip(resume, t("Resume habit"));
			this.registerDomEvent(resume, "click", async () => {
				await this.store.resumeHabit(habit);
				this.reload();
			});
			return;
		}

		const done = this.isDone(habit);
		row.toggleClass("is-done", done);

		if (habit.type === "binary") {
			const toggle = main.createEl("button", {
				cls: "habits-panel-toggle",
				attr: {
					type: "button",
					"aria-label": done ? t("Mark as not done") : t("Mark as done"),
					"aria-pressed": String(done),
				},
			});
			setIcon(toggle, done ? "check" : "circle");
			this.registerDomEvent(toggle, "click", async () => {
				await this.commit(habit, done ? 0 : 1, row);
			});
			return;
		}

		const value = this.valueOf(habit);
		const timed = habit.type === "timed";
		const valueBtn = main.createEl("button", {
			cls: "habits-panel-value",
			text: `${value}/${habit.target}`,
			attr: { type: "button", "aria-label": t("Edit value") },
		});
		setTooltip(valueBtn, t("Click to type a value"));
		this.registerDomEvent(valueBtn, "click", () => {
			this.editRowValue(habit, row, valueBtn);
		});

		const minus = main.createEl("button", {
			cls: "habits-icon-button habits-panel-mini",
			attr: { type: "button", "aria-label": t("Decrease by 1") },
		});
		setIcon(minus, "minus");
		this.registerDomEvent(minus, "click", async () => {
			await this.commit(habit, value - 1, row);
		});

		if (timed) {
			// Time gets logged in chunks, so offer 1, 5 and 10 minutes.
			for (const step of [1, 5, 10]) {
				const btn = main.createEl("button", {
					cls: "habits-icon-button habits-panel-mini habits-panel-step",
					text: `+${step}`,
					attr: {
						type: "button",
						"aria-label": t("Increase by {n}", { n: step }),
					},
				});
				this.registerDomEvent(btn, "click", async () => {
					await this.commit(habit, value + step, row);
				});
			}
		} else {
			const plus = main.createEl("button", {
				cls: "habits-icon-button habits-panel-mini",
				attr: { type: "button", "aria-label": t("Increase by 1") },
			});
			setIcon(plus, "plus");
			this.registerDomEvent(plus, "click", async () => {
				await this.commit(habit, value + 1, row);
			});
		}

		const progress = row.createDiv({ cls: "habits-panel-progress" });
		const fill = progress.createDiv({
			cls: "habits-panel-progress-fill",
		});
		const pct =
			habit.target > 0
				? Math.min(100, Math.round((value / habit.target) * 100))
				: 0;
		fill.setCssProps({ "--habits-progress": `${pct}%` });
		if (done) {
			progress.addClass("is-complete");
		}
	}

	/** Swap the value readout for an input so the user can type a value. */
	private editRowValue(
		habit: HabitDefinition,
		row: HTMLElement,
		valueBtn: HTMLElement,
	): void {
		const input = createEl("input", {
			cls: "habits-panel-value-input",
			attr: {
				type: "number",
				min: "0",
				step: "1",
				inputmode: "numeric",
				"aria-label": t("Value"),
			},
		});
		input.value = String(this.valueOf(habit));
		valueBtn.replaceWith(input);
		input.focus();
		input.select();

		let done = false;
		const finish = async (save: boolean): Promise<void> => {
			if (done) {
				return;
			}
			done = true;
			if (save) {
				const parsed = Number(input.value);
				if (Number.isFinite(parsed)) {
					await this.commit(
						habit,
						Math.max(0, Math.round(parsed)),
						row,
					);
					return;
				}
			}
			this.reload();
		};

		this.registerDomEvent(input, "keydown", (evt: KeyboardEvent) => {
			if (evt.key === "Enter") {
				evt.preventDefault();
				void finish(true);
			} else if (evt.key === "Escape") {
				evt.preventDefault();
				void finish(false);
			}
		});
		this.registerDomEvent(input, "blur", () => {
			void finish(true);
		});
	}

	/** Write a value for today, celebrating a fresh completion briefly. */
	private async commit(
		habit: HabitDefinition,
		value: number,
		row: HTMLElement,
	): Promise<void> {
		const wasDone = this.isDone(habit);
		const clamped = Math.max(0, value);
		const dateKey = this.todayKey();
		if (clamped > 0) {
			habit.records[dateKey] = clamped;
		} else {
			delete habit.records[dateKey];
		}

		this.suppressAutoReload = true;
		try {
			await this.store.setRecord(habit, dateKey, clamped);
			if (!wasDone && this.isDone(habit)) {
				row.addClass("is-celebrating");
				const flash = row.createDiv({ cls: "habits-panel-flash" });
				const icon = flash.createSpan({
					cls: "habits-panel-flash-icon",
				});
				setIcon(icon, "circle-check");
				await sleep(650);
			}
		} finally {
			this.suppressAutoReload = false;
		}
		this.reload();
	}

	/** Last time a row menu opened; guards double-fire on long-press. */
	private lastMenuAt = 0;

	private showRowMenu(habit: HabitDefinition, x: number, y: number): void {
		const now = Date.now();
		if (now - this.lastMenuAt < 500) {
			return;
		}
		this.lastMenuAt = now;
		const menu = new Menu();
		menu.addItem((item) =>
			item
				.setTitle(t("Open note"))
				.setIcon("file-text")
				.onClick(() => {
					void this.app.workspace.openLinkText(
						habit.path,
						"",
						false,
					);
				}),
		);
		menu.addItem((item) =>
			item
				.setTitle(t("Edit habit"))
				.setIcon("pencil")
				.onClick(() => {
					new HabitModal(
						this.app,
						this.store,
						() => this.reload(),
						habit,
					).open();
				}),
		);
		if (habit.paused) {
			menu.addItem((item) =>
				item
					.setTitle(t("Resume habit"))
					.setIcon("play")
					.onClick(async () => {
						await this.store.resumeHabit(habit);
						this.reload();
					}),
			);
		} else {
			menu.addItem((item) =>
				item
					.setTitle(t("Pause habit"))
					.setIcon("pause")
					.onClick(async () => {
						await this.store.pauseHabit(habit);
						this.reload();
					}),
			);
		}
		menu.addItem((item) =>
			item
				.setTitle(t("Stop tracking"))
				.setIcon("circle-stop")
				.onClick(() => {
					new ConfirmModal(this.app, {
						title: t("Stop tracking"),
						message: t(
							'Stop tracking "{name}"? It leaves the dashboard and stats, but its note and full history are kept. You can resume tracking any time from the note\'s metrics view.',
							{ name: habit.name },
						),
						confirmText: t("Stop tracking"),
						onConfirm: async () => {
							await this.store.stopHabit(habit);
							this.reload();
						},
					}).open();
				}),
		);
		menu.addItem((item) =>
			item
				.setTitle(t("Remove habit"))
				.setIcon("trash")
				.onClick(() => {
					new ConfirmModal(this.app, {
						title: t("Remove habit"),
						message: t(
							'Remove "{name}"? Its note will be moved to the trash.',
							{ name: habit.name },
						),
						confirmText: t("Remove"),
						danger: true,
						onConfirm: async () => {
							await this.store.deleteHabit(habit);
							this.reload();
						},
					}).open();
				}),
		);
		menu.showAtPosition({ x, y });
	}
}
