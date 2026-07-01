import { App, MarkdownRenderChild, Notice, setIcon } from "obsidian";
import type { HabitStore } from "../habit-store";
import type { HabitsPluginSettings } from "../settings";
import type { HabitDefinition } from "../types";
import { HabitModal } from "./habit-modal";
import { applyHabitIcon } from "./icon-suggest-modal";
import { addDays, friendlyDateLabel, toDateKey } from "../utils";

const MOBILE_BREAKPOINT = 768;

/**
 * Renders the interactive habits dashboard for a `habits` code block.
 *
 * The dashboard shows one card per habit in a carousel and lets the user log
 * progress for the currently selected day.
 */
export class HabitsDashboard extends MarkdownRenderChild {
	private habits: HabitDefinition[] = [];
	private selectedDate: Date = new Date();
	private index = 0;

	private root: HTMLElement;
	private trackEl: HTMLElement | null = null;

	constructor(
		private app: App,
		private store: HabitStore,
		private getSettings: () => HabitsPluginSettings,
		root: HTMLElement,
	) {
		super(root);
		this.root = root;
	}

	onload(): void {
		this.root.addClass("habits-dashboard");
		this.registerDomEvent(window, "resize", () => this.applyLayout());
		this.reload();
	}

	/** Reload habits from disk and rebuild the whole dashboard. */
	private reload(): void {
		this.habits = this.store.getHabits();
		this.index = Math.min(this.index, Math.max(0, this.habits.length - 1));
		this.render();
	}

	private render(): void {
		this.root.empty();
		this.renderHeader();

		if (this.habits.length === 0) {
			this.renderEmptyState();
			return;
		}

		this.renderCarousel();
	}

	private renderHeader(): void {
		const header = this.root.createDiv({ cls: "habits-header" });

		const nav = header.createDiv({ cls: "habits-date-nav" });

		const prev = nav.createEl("button", {
			cls: "habits-icon-button",
			attr: { type: "button", "aria-label": "Previous day" },
		});
		setIcon(prev, "chevron-left");
		this.registerDomEvent(prev, "click", () => {
			this.selectedDate = addDays(this.selectedDate, -1);
			this.render();
		});

		nav.createEl("span", {
			cls: "habits-date-label",
			text: friendlyDateLabel(this.selectedDate, new Date()),
		});

		const next = nav.createEl("button", {
			cls: "habits-icon-button",
			attr: { type: "button", "aria-label": "Next day" },
		});
		setIcon(next, "chevron-right");
		this.registerDomEvent(next, "click", () => {
			this.selectedDate = addDays(this.selectedDate, 1);
			this.render();
		});

		const add = header.createEl("button", {
			cls: "habits-icon-button",
			attr: { type: "button", "aria-label": "Add habit" },
		});
		setIcon(add, "plus");
		this.registerDomEvent(add, "click", () => this.openCreateModal());
	}

	private renderEmptyState(): void {
		const empty = this.root.createDiv({ cls: "habits-empty" });
		empty.createEl("p", {
			text: "No habits yet. Create your first habit to get started.",
		});
		const button = empty.createEl("button", {
			cls: "mod-cta",
			text: "Create habit",
			attr: { type: "button" },
		});
		this.registerDomEvent(button, "click", () => this.openCreateModal());
	}

	private renderCarousel(): void {
		const viewport = this.root.createDiv({
			cls: "habits-carousel-viewport",
		});
		const track = viewport.createDiv({ cls: "habits-carousel-track" });
		this.trackEl = track;

		for (const habit of this.habits) {
			this.renderCard(track, habit);
		}

		if (this.habits.length > 1) {
			this.renderControls();
		}

		this.applyLayout();
	}

	private renderControls(): void {
		const controls = this.root.createDiv({ cls: "habits-carousel-controls" });

		const prev = controls.createEl("button", {
			cls: "habits-icon-button",
			attr: { type: "button", "aria-label": "Previous habit" },
		});
		setIcon(prev, "chevron-left");
		this.registerDomEvent(prev, "click", () => this.move(-1));

		const dots = controls.createDiv({ cls: "habits-dots" });
		this.habits.forEach((_, i) => {
			const dot = dots.createEl("button", {
				cls: "habits-dot",
				attr: { type: "button", "aria-label": `Go to habit ${i + 1}` },
			});
			if (i === this.index) {
				dot.addClass("is-active");
			}
			this.registerDomEvent(dot, "click", () => {
				this.index = i;
				this.applyLayout();
			});
		});

		const next = controls.createEl("button", {
			cls: "habits-icon-button",
			attr: { type: "button", "aria-label": "Next habit" },
		});
		setIcon(next, "chevron-right");
		this.registerDomEvent(next, "click", () => this.move(1));
	}

	private move(delta: number): void {
		const maxIndex = Math.max(0, this.habits.length - this.perView());
		this.index = Math.min(maxIndex, Math.max(0, this.index + delta));
		this.applyLayout();
	}

	private perView(): number {
		if (window.innerWidth <= MOBILE_BREAKPOINT) {
			return 1;
		}
		return Math.min(this.getSettings().cardsPerView, this.habits.length);
	}

	/** Recompute card widths, carousel offset and dot/arrow states. */
	private applyLayout(): void {
		if (!this.trackEl) {
			return;
		}
		const perView = this.perView();
		const maxIndex = Math.max(0, this.habits.length - perView);
		this.index = Math.min(this.index, maxIndex);

		this.trackEl.setCssProps({
			"--habits-per-view": String(perView),
			"--habits-translate": `-${this.index * (100 / perView)}%`,
		});

		const dots = this.root.querySelectorAll(".habits-dot");
		dots.forEach((dot, i) => {
			dot.toggleClass("is-active", i === this.index);
		});
	}

	private renderCard(track: HTMLElement, habit: HabitDefinition): void {
		const card = track.createDiv({ cls: "habits-card" });
		if (habit.color) {
			card.setCssProps({ "--habits-accent": habit.color });
		}

		const title = card.createDiv({ cls: "habits-card-title" });
		if (habit.icon) {
			const iconEl = title.createSpan({ cls: "habits-card-icon" });
			applyHabitIcon(iconEl, habit.icon);
		}
		title.createSpan({ cls: "habits-card-name", text: habit.name });

		const body = card.createDiv({ cls: "habits-card-body" });
		if (habit.type === "binary") {
			this.renderBinaryControl(body, habit);
		} else {
			this.renderCounterControl(body, habit);
		}
	}

	private currentValue(habit: HabitDefinition): number {
		return habit.records[toDateKey(this.selectedDate)] ?? 0;
	}

	private async commit(habit: HabitDefinition, value: number): Promise<void> {
		const clamped = Math.max(0, value);
		const dateKey = toDateKey(this.selectedDate);
		if (clamped > 0) {
			habit.records[dateKey] = clamped;
		} else {
			delete habit.records[dateKey];
		}
		await this.store.setRecord(habit, dateKey, clamped);
	}

	private renderBinaryControl(
		body: HTMLElement,
		habit: HabitDefinition,
	): void {
		const done = this.currentValue(habit) >= 1;
		const button = body.createEl("button", {
			cls: "habits-binary-toggle",
			attr: {
				type: "button",
				"aria-label": done ? "Mark as not done" : "Mark as done",
				"aria-pressed": String(done),
			},
		});
		button.toggleClass("is-done", done);
		setIcon(button, done ? "check" : "circle");
		button.createSpan({
			cls: "habits-binary-label",
			text: done ? "Done" : "Not done",
		});

		this.registerDomEvent(button, "click", async () => {
			await this.commit(habit, done ? 0 : 1);
			this.render();
		});
	}

	private renderCounterControl(
		body: HTMLElement,
		habit: HabitDefinition,
	): void {
		const value = this.currentValue(habit);
		const step = habit.type === "timed" ? 5 : 1;
		const unit =
			habit.unit || (habit.type === "timed" ? "min" : "");

		const readout = body.createDiv({ cls: "habits-readout" });
		readout.createSpan({ cls: "habits-value", text: String(value) });
		readout.createSpan({
			cls: "habits-target",
			text: unit ? `/ ${habit.target} ${unit}` : `/ ${habit.target}`,
		});

		const progress = body.createDiv({ cls: "habits-progress" });
		const fill = progress.createDiv({ cls: "habits-progress-fill" });
		const pct =
			habit.target > 0
				? Math.min(100, Math.round((value / habit.target) * 100))
				: 0;
		fill.setCssProps({ "--habits-progress": `${pct}%` });
		if (value >= habit.target && habit.target > 0) {
			progress.addClass("is-complete");
		}

		const buttons = body.createDiv({ cls: "habits-counter-buttons" });

		const minus = buttons.createEl("button", {
			cls: "habits-icon-button",
			attr: { type: "button", "aria-label": `Decrease by ${step}` },
		});
		setIcon(minus, "minus");
		this.registerDomEvent(minus, "click", async () => {
			await this.commit(habit, value - step);
			this.render();
		});

		const plus = buttons.createEl("button", {
			cls: "habits-icon-button",
			attr: { type: "button", "aria-label": `Increase by ${step}` },
		});
		setIcon(plus, "plus");
		this.registerDomEvent(plus, "click", async () => {
			await this.commit(habit, value + step);
			this.render();
		});
	}

	private openCreateModal(): void {
		new HabitModal(this.app, this.store, () => {
			new Notice("Habit added to the dashboard.");
			this.reload();
		}).open();
	}
}
