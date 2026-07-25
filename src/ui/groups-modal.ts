import { App, Modal, Setting } from "obsidian";
import type { HabitStore } from "../habit-store";
import type { HabitsPluginSettings } from "../settings";
import type { HabitDefinition } from "../types";
import { t } from "../i18n";
import { habitAccent, sectionLabel, sortHabits } from "../utils";
import { applyHabitIcon } from "./icon-suggest-modal";

/**
 * Overview of every habit by group, opened from the plugin settings.
 * Each group renders as a labelled container of habit chips; dragging a
 * chip into another container reassigns the habit's group (written to
 * its note's frontmatter). An "Ungrouped" container at the end doubles
 * as the way to remove a habit from its group.
 */
export class GroupsModal extends Modal {
	/** Habits held locally so reassignments show without waiting on the
	 * metadata cache to catch up. */
	private habits: HabitDefinition[] = [];
	/** Groups created in this session that have no members yet. */
	private newGroups: string[] = [];

	constructor(
		app: App,
		private store: HabitStore,
		private getSettings: () => HabitsPluginSettings,
	) {
		super(app);
	}

	onOpen(): void {
		this.modalEl.addClass("habits-groups-modal");
		const settings = this.getSettings();
		this.habits = sortHabits(
			this.store.getHabits().filter((habit) => !habit.stopped),
			settings.sortMode,
			settings.manualOrder,
			settings.groups,
		);
		this.build();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	/** Every group name to render: members, styled groups, session-new. */
	private groupNames(): string[] {
		const names = new Set<string>();
		for (const habit of this.habits) {
			const group = habit.group.trim();
			if (group) {
				names.add(group);
			}
		}
		for (const name of Object.keys(this.getSettings().groups)) {
			names.add(name);
		}
		for (const name of this.newGroups) {
			names.add(name);
		}
		const order = this.getSettings().groupOrder;
		const position = new Map(order.map((name, index) => [name, index]));
		return Array.from(names).sort((a, b) => {
			const pa = position.get(a) ?? Number.MAX_SAFE_INTEGER;
			const pb = position.get(b) ?? Number.MAX_SAFE_INTEGER;
			return pa - pb || a.localeCompare(b);
		});
	}

	private build(): void {
		const { contentEl } = this;
		contentEl.empty();

		new Setting(contentEl).setName(t("Groups")).setHeading();
		contentEl.createEl("p", {
			cls: "habits-groups-hint",
			text: t("Drag habits between groups to reassign them."),
		});

		let pending = "";
		new Setting(contentEl).setName(t("New group")).addText((text) =>
			text.setPlaceholder(t("e.g. Health")).onChange((value) => {
				pending = value;
			}),
		).addButton((button) =>
			button
				.setButtonText(t("Add"))
				.setCta()
				.onClick(() => {
					const cleaned = pending.trim();
					if (cleaned && !this.groupNames().includes(cleaned)) {
						this.newGroups.push(cleaned);
					}
					this.build();
				}),
		);

		const board = contentEl.createDiv({ cls: "habits-groups-board" });
		for (const name of this.groupNames()) {
			this.renderSection(board, name);
		}
		// The catch-all container: dropping here ungroups a habit.
		this.renderSection(board, "");
	}

	private renderSection(board: HTMLElement, group: string): void {
		const settings = this.getSettings();
		const section = board.createDiv({ cls: "habits-groups-section" });
		section.dataset.group = group;

		const header = section.createDiv({ cls: "habits-group-header" });
		const style = settings.groups[group];
		if (style?.icon) {
			const icon = header.createSpan({ cls: "habits-group-icon" });
			applyHabitIcon(icon, style.icon);
			if (style.color) {
				icon.setCssProps({ "--habits-accent": style.color });
			}
		} else if (style?.color) {
			const swatch = header.createSpan({
				cls: "habits-group-swatch",
			});
			swatch.setCssProps({ "--habits-accent": style.color });
		}
		header.createSpan({
			cls: "habits-group-label",
			text: sectionLabel(group),
		});

		const chips = section.createDiv({ cls: "habits-groups-chips" });
		const members = this.habits.filter(
			(habit) => habit.group.trim() === group,
		);
		if (members.length === 0) {
			chips.createSpan({
				cls: "habits-groups-empty",
				text: t("No habits"),
			});
			return;
		}
		for (const habit of members) {
			const chip = chips.createDiv({ cls: "habits-groups-chip" });
			const accent = habitAccent(habit, settings.groups);
			if (accent) {
				chip.setCssProps({ "--habits-accent": accent });
			}
			if (habit.icon) {
				const icon = chip.createSpan({
					cls: "habits-groups-chip-icon",
				});
				applyHabitIcon(icon, habit.icon);
			}
			chip.createSpan({
				cls: "habits-groups-chip-name",
				text: habit.name,
			});
			this.registerChipDrag(chip, habit);
		}
	}

	/**
	 * Pointer-based dragging between group containers. Listeners sit on
	 * the window so the drag survives any DOM churn, mirroring the
	 * settings tab's order editors.
	 */
	private registerChipDrag(
		chip: HTMLElement,
		habit: HabitDefinition,
	): void {
		chip.addEventListener("pointerdown", (evt: PointerEvent) => {
			if (evt.button !== 0) {
				return;
			}
			evt.preventDefault();
			chip.addClass("is-dragging");
			const win = chip.win;
			const containers = Array.from(
				this.contentEl.querySelectorAll<HTMLElement>(
					".habits-groups-section",
				),
			);
			let target: HTMLElement | null = null;

			const onMove = (e: PointerEvent): void => {
				target =
					containers.find((el) => {
						const rect = el.getBoundingClientRect();
						return (
							e.clientY >= rect.top &&
							e.clientY <= rect.bottom &&
							e.clientX >= rect.left &&
							e.clientX <= rect.right
						);
					}) ?? null;
				for (const el of containers) {
					el.toggleClass(
						"is-drop-target",
						el === target &&
							el.dataset.group !== habit.group.trim(),
					);
				}
			};
			const onUp = (): void => {
				chip.removeClass("is-dragging");
				win.removeEventListener("pointermove", onMove);
				win.removeEventListener("pointerup", onUp);
				win.removeEventListener("pointercancel", onUp);
				for (const el of containers) {
					el.removeClass("is-drop-target");
				}
				const group = target?.dataset.group;
				if (group !== undefined && group !== habit.group.trim()) {
					void this.store
						.setHabitGroup(habit, group)
						.then(() => this.build());
				}
			};
			win.addEventListener("pointermove", onMove);
			win.addEventListener("pointerup", onUp);
			win.addEventListener("pointercancel", onUp);
		});
	}
}
