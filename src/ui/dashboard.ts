import {
	App,
	MarkdownRenderChild,
	Menu,
	Notice,
	setIcon,
	setTooltip,
} from "obsidian";
import type { HabitStore } from "../habit-store";
import type { HabitsPluginSettings } from "../settings";
import type { HabitDefinition } from "../types";
import { HabitModal } from "./habit-modal";
import { ConfirmModal } from "./confirm-modal";
import { renderStatsView } from "./stats-view";
import {
	isPausedOn,
	type StatsPeriod,
	type StatsRangeMode,
} from "../stats";
import { applyHabitIcon } from "./icon-suggest-modal";
import {
	addDays,
	friendlyDateLabel,
	fromDateKey,
	toDateKey,
} from "../utils";

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
	private lastPerView = 1;
	private mode: "dashboard" | "stats" = "dashboard";
	private statsPeriod: StatsPeriod = "weekly";
	private statsRange: StatsRangeMode = "rolling";

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
		this.registerDomEvent(window, "resize", () => this.handleResize());
		this.reload();
	}

	/** Reload habits from disk and rebuild the whole dashboard. */
	private reload(): void {
		this.habits = this.store
			.getHabits()
			.filter((habit) => !habit.stopped);
		this.index = Math.min(this.index, Math.max(0, this.habits.length - 1));
		this.render();
	}

	private render(): void {
		this.root.empty();

		if (this.mode === "stats") {
			this.renderStatsHeader();
			this.renderRangeToggle();
			const body = this.root.createDiv();
			renderStatsView(
				body,
				this.habits,
				this.statsPeriod,
				this.statsRange,
				new Date(),
			);
			return;
		}

		this.renderHeader();

		if (this.habits.length === 0) {
			this.renderEmptyState();
			return;
		}

		this.renderCarousel();
	}

	/** Header shown on the stats view: home, period tabs, export. */
	private renderStatsHeader(): void {
		const header = this.root.createDiv({ cls: "habits-header" });

		const home = header.createEl("button", {
			cls: "habits-icon-button habits-header-left",
			attr: { type: "button", "aria-label": "Back to habits" },
		});
		setIcon(home, "home");
		this.registerDomEvent(home, "click", () => {
			this.mode = "dashboard";
			this.render();
		});

		const tabs = header.createDiv({ cls: "habits-stats-tabs" });
		const periods: { id: StatsPeriod; label: string }[] = [
			{ id: "weekly", label: "Weekly" },
			{ id: "monthly", label: "Monthly" },
		];
		for (const entry of periods) {
			const tab = tabs.createEl("button", {
				cls: "habits-stats-tab",
				text: entry.label,
				attr: { type: "button" },
			});
			tab.toggleClass("is-active", this.statsPeriod === entry.id);
			this.registerDomEvent(tab, "click", () => {
				this.statsPeriod = entry.id;
				this.render();
			});
		}

		const download = header.createEl("button", {
			cls: "habits-icon-button habits-header-right",
			attr: { type: "button", "aria-label": "Export stats" },
		});
		setIcon(download, "download");
		this.registerDomEvent(download, "click", () => {
			new Notice("Stats export is coming soon.");
		});
	}

	/** Segmented toggle between rolling and calendar date ranges. */
	private renderRangeToggle(): void {
		const wrap = this.root.createDiv({ cls: "habits-range-toggle" });
		const weekly = this.statsPeriod === "weekly";
		const options: { id: StatsRangeMode; label: string }[] = [
			{ id: "rolling", label: weekly ? "Last 7 days" : "Last 30 days" },
			{ id: "calendar", label: weekly ? "This week" : "This month" },
		];
		for (const option of options) {
			const btn = wrap.createEl("button", {
				cls: "habits-range-btn",
				text: option.label,
				attr: { type: "button" },
			});
			btn.toggleClass("is-active", this.statsRange === option.id);
			this.registerDomEvent(btn, "click", () => {
				this.statsRange = option.id;
				this.render();
			});
		}
	}

	private renderHeader(): void {
		const header = this.root.createDiv({ cls: "habits-header" });

		const statsBtn = header.createEl("button", {
			cls: "habits-icon-button habits-header-left",
			attr: { type: "button", "aria-label": "View stats" },
		});
		setIcon(statsBtn, "chart-column-increasing");
		this.registerDomEvent(statsBtn, "click", () => {
			this.mode = "stats";
			this.render();
		});

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

		const dateDisplay = nav.createEl("span", {
			cls: "habits-date-display",
		});
		const dateButton = dateDisplay.createEl("button", {
			cls: "habits-date-label",
			text: friendlyDateLabel(this.selectedDate, new Date()),
			attr: { type: "button", "aria-label": "Choose a date" },
		});
		const dateInput = dateDisplay.createEl("input", {
			cls: "habits-date-input",
			attr: { type: "date", tabindex: "-1", "aria-hidden": "true" },
		});
		dateInput.value = toDateKey(this.selectedDate);
		this.registerDomEvent(dateInput, "change", () => {
			const parsed = fromDateKey(dateInput.value);
			if (parsed) {
				this.selectedDate = parsed;
				this.render();
			}
		});
		this.registerDomEvent(dateButton, "click", () => {
			dateInput.value = toDateKey(this.selectedDate);
			if (typeof dateInput.showPicker === "function") {
				dateInput.showPicker();
			} else {
				dateInput.click();
			}
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
			cls: "habits-icon-button habits-header-right",
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

		for (const habit of this.orderedHabits()) {
			this.renderCard(track, habit);
		}

		if (this.habits.length > 1) {
			this.renderControls();
		}

		this.applyLayout();
	}

	/** Number of distinct positions the carousel can rest at. */
	private pageCount(): number {
		return Math.max(1, this.habits.length - this.perView() + 1);
	}

	private renderControls(): void {
		const pages = this.pageCount();
		if (pages <= 1) {
			return;
		}

		const controls = this.root.createDiv({
			cls: "habits-carousel-controls",
		});

		const prev = controls.createEl("button", {
			cls: "habits-icon-button habits-carousel-prev",
			attr: { type: "button", "aria-label": "Previous" },
		});
		setIcon(prev, "chevron-left");
		this.registerDomEvent(prev, "click", () => this.move(-1));

		if (pages <= 7) {
			const dots = controls.createDiv({ cls: "habits-dots" });
			for (let i = 0; i < pages; i++) {
				const dot = dots.createEl("button", {
					cls: "habits-dot",
					attr: {
						type: "button",
						"aria-label": `Go to position ${i + 1}`,
					},
				});
				this.registerDomEvent(dot, "click", () => {
					this.index = i;
					this.applyLayout();
				});
			}
		} else {
			controls.createSpan({ cls: "habits-carousel-count" });
		}

		const next = controls.createEl("button", {
			cls: "habits-icon-button habits-carousel-next",
			attr: { type: "button", "aria-label": "Next" },
		});
		setIcon(next, "chevron-right");
		this.registerDomEvent(next, "click", () => this.move(1));

		this.updateControls();
	}

	/** Update dot/arrow/counter state to match the current position. */
	private updateControls(): void {
		const maxIndex = Math.max(0, this.habits.length - this.perView());

		const prevBtn = this.root.querySelector<HTMLElement>(
			".habits-carousel-prev",
		);
		prevBtn?.toggleClass("is-disabled", this.index <= 0);

		const nextBtn = this.root.querySelector<HTMLElement>(
			".habits-carousel-next",
		);
		nextBtn?.toggleClass("is-disabled", this.index >= maxIndex);

		const dots = this.root.querySelectorAll(".habits-dot");
		dots.forEach((dot, i) => {
			dot.toggleClass("is-active", i === this.index);
		});

		const count = this.root.querySelector<HTMLElement>(
			".habits-carousel-count",
		);
		count?.setText(`${this.index + 1} / ${maxIndex + 1}`);
	}

	/** Re-render on breakpoint changes, otherwise just re-position. */
	private handleResize(): void {
		if (this.perView() !== this.lastPerView) {
			this.render();
		} else {
			this.applyLayout();
		}
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

	/** Recompute card widths, carousel offset and control states. */
	private applyLayout(): void {
		if (!this.trackEl) {
			return;
		}
		const perView = this.perView();
		this.lastPerView = perView;
		const maxIndex = Math.max(0, this.habits.length - perView);
		this.index = Math.min(this.index, maxIndex);

		this.trackEl.setCssProps({
			"--habits-per-view": String(perView),
			"--habits-translate": `-${this.index * (100 / perView)}%`,
		});

		this.updateControls();
	}

	private renderCard(track: HTMLElement, habit: HabitDefinition): void {
		const card = track.createDiv({ cls: "habits-card" });
		if (habit.color) {
			card.setCssProps({ "--habits-accent": habit.color });
		}
		setTooltip(card, "Right-click for more options");
		this.registerDomEvent(card, "contextmenu", (evt: MouseEvent) => {
			evt.preventDefault();
			this.showCardMenu(evt, habit, card);
		});

		const title = card.createDiv({ cls: "habits-card-title" });
		if (habit.icon) {
			const iconEl = title.createSpan({ cls: "habits-card-icon" });
			applyHabitIcon(iconEl, habit.icon);
		}
		const name = title.createEl("button", {
			cls: "habits-card-name",
			text: habit.name,
			attr: {
				type: "button",
				"aria-label": `Open the note for ${habit.name}`,
			},
		});
		setTooltip(name, "Open habit note");
		this.registerDomEvent(name, "click", () => {
			void this.app.workspace.openLinkText(habit.path, "", false);
		});

		if (this.isPausedOnSelected(habit)) {
			this.renderPausedBody(card, habit);
			return;
		}

		const body = card.createDiv({ cls: "habits-card-body" });
		if (habit.type === "binary") {
			this.renderBinaryControl(body, habit, card);
		} else {
			this.renderCounterControl(body, habit, card);
		}
	}

	/** Body shown instead of controls when the habit is paused. */
	private renderPausedBody(
		card: HTMLElement,
		habit: HabitDefinition,
	): void {
		card.addClass("is-paused");
		const body = card.createDiv({ cls: "habits-card-body" });
		const badge = body.createDiv({ cls: "habits-paused-badge" });
		const icon = badge.createSpan({ cls: "habits-paused-icon" });
		setIcon(icon, "pause");
		badge.createSpan({ text: "Paused" });

		const openPause = habit.pauses.find((pause) => pause.end === "");
		const started = openPause ? fromDateKey(openPause.start) : null;
		body.createDiv({
			cls: "habits-paused-note",
			text: started
				? `Since ${started.toLocaleDateString(undefined, {
						day: "numeric",
						month: "short",
					})} · right-click to resume`
				: "Paused on this day",
		});
	}

	private currentValue(habit: HabitDefinition): number {
		return habit.records[toDateKey(this.selectedDate)] ?? 0;
	}

	/** Whether the habit's goal is met for the selected day. */
	private isComplete(habit: HabitDefinition): boolean {
		const value = this.currentValue(habit);
		if (habit.type === "binary") {
			return value >= 1;
		}
		return habit.target > 0 && value >= habit.target;
	}

	/** Whether the habit is paused on the currently selected day. */
	private isPausedOnSelected(habit: HabitDefinition): boolean {
		return isPausedOn(habit, toDateKey(this.selectedDate));
	}

	/**
	 * Carousel order for the selected day: incomplete habits first (in store
	 * order), then completed habits, with paused habits parked at the end.
	 */
	private orderedHabits(): HabitDefinition[] {
		const active = this.habits.filter(
			(habit) => !this.isPausedOnSelected(habit),
		);
		return [
			...active.filter((habit) => !this.isComplete(habit)),
			...active.filter((habit) => this.isComplete(habit)),
			...this.habits.filter((habit) => this.isPausedOnSelected(habit)),
		];
	}

	/**
	 * Re-render after a value change. If the habit just transitioned to
	 * complete, play the completion animation first; the re-render then moves
	 * the card to the end of the queue.
	 */
	private async finishChange(
		card: HTMLElement,
		habit: HabitDefinition,
		wasComplete: boolean,
	): Promise<void> {
		if (!wasComplete && this.isComplete(habit)) {
			const overlay = await this.playCompletionAnimation(card);
			await this.playCardDeparture(card, overlay);
		}
		this.render();
	}

	/**
	 * Celebrate a completed habit: after a short beat, a green circle-check
	 * swooshes in with a springy spin while a ring pulses outward behind it.
	 * Colour comes from the theme palette (`--color-green`).
	 */
	private async playCompletionAnimation(
		card: HTMLElement,
	): Promise<HTMLElement> {
		// Brief pause so the user sees their input land before the reward.
		await sleep(350);
		const overlay = card.createDiv({ cls: "habits-complete-overlay" });
		overlay.createDiv({ cls: "habits-complete-ring" });
		const icon = overlay.createSpan({ cls: "habits-complete-icon" });
		setIcon(icon, "circle-check");
		// Swoosh-in plus a short hold at full size.
		await sleep(950);
		return overlay;
	}

	/**
	 * Quieter cousin of the completion animation for pausing: a muted
	 * circle-pause swooshes in before the card departs for the end of the
	 * queue.
	 */
	private async playPauseAnimation(
		card: HTMLElement,
	): Promise<HTMLElement> {
		const overlay = card.createDiv({ cls: "habits-complete-overlay" });
		const icon = overlay.createSpan({
			cls: "habits-paused-overlay-icon",
		});
		setIcon(icon, "circle-pause");
		await sleep(600);
		return overlay;
	}

	/**
	 * Send the completed card (still showing its green check) swooshing off
	 * to the right while its slot collapses, so the queue visibly closes the
	 * gap and the next card slides in. Skipped when the card is already at
	 * the end of the queue — then the overlay simply fades out in place.
	 */
	private async playCardDeparture(
		card: HTMLElement,
		overlay: HTMLElement,
	): Promise<void> {
		const track = card.parentElement;
		if (!track || track.lastElementChild === card) {
			overlay.addClass("is-leaving");
			await sleep(200);
			return;
		}
		card.addClass("is-departing");
		await sleep(600);
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

	/** Swap the value display for an input so the user can type a value. */
	private editValue(
		habit: HabitDefinition,
		readout: HTMLElement,
		targetText: string,
		card: HTMLElement,
	): void {
		readout.empty();
		const input = readout.createEl("input", {
			cls: "habits-value-input",
			attr: {
				type: "number",
				min: "0",
				step: "1",
				inputmode: "numeric",
				"aria-label": "Value",
			},
		});
		input.value = String(this.currentValue(habit));
		readout.createSpan({ cls: "habits-target", text: targetText });
		input.focus();
		input.select();

		let done = false;
		const finish = async (save: boolean): Promise<void> => {
			if (done) {
				return;
			}
			done = true;
			const wasComplete = this.isComplete(habit);
			if (save) {
				const parsed = Number(input.value);
				if (Number.isFinite(parsed)) {
					await this.commit(habit, Math.max(0, Math.round(parsed)));
				}
			}
			await this.finishChange(card, habit, wasComplete);
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

	private renderBinaryControl(
		body: HTMLElement,
		habit: HabitDefinition,
		card: HTMLElement,
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
			await this.finishChange(card, habit, done);
		});
	}

	private renderCounterControl(
		body: HTMLElement,
		habit: HabitDefinition,
		card: HTMLElement,
	): void {
		const value = this.currentValue(habit);
		const step = habit.type === "timed" ? 5 : 1;
		const unit =
			habit.unit || (habit.type === "timed" ? "min" : "");

		const targetText = unit
			? `/ ${habit.target} ${unit}`
			: `/ ${habit.target}`;

		const readout = body.createDiv({ cls: "habits-readout" });
		const valueEl = readout.createEl("button", {
			cls: "habits-value",
			text: String(value),
			attr: {
				type: "button",
				"aria-label": "Edit value",
			},
		});
		readout.createSpan({ cls: "habits-target", text: targetText });
		this.registerDomEvent(valueEl, "click", () =>
			this.editValue(habit, readout, targetText, card),
		);

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
			const wasComplete = this.isComplete(habit);
			await this.commit(habit, value + step);
			await this.finishChange(card, habit, wasComplete);
		});
	}

	private showCardMenu(
		evt: MouseEvent,
		habit: HabitDefinition,
		card: HTMLElement,
	): void {
		const menu = new Menu();
		menu.addItem((item) =>
			item
				.setTitle("Edit habit")
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
					.setTitle("Resume habit")
					.setIcon("play")
					.onClick(async () => {
						await this.store.resumeHabit(habit);
						this.reload();
					}),
			);
		} else {
			menu.addItem((item) =>
				item
					.setTitle("Pause habit")
					.setIcon("pause")
					.onClick(async () => {
						await this.store.pauseHabit(habit);
						const overlay =
							await this.playPauseAnimation(card);
						await this.playCardDeparture(card, overlay);
						this.reload();
					}),
			);
		}
		menu.addItem((item) =>
			item
				.setTitle("Stop tracking")
				.setIcon("circle-stop")
				.onClick(() => this.confirmStop(habit)),
		);
		menu.addItem((item) =>
			item
				.setTitle("Remove habit")
				.setIcon("trash")
				.onClick(() => this.confirmRemove(habit)),
		);
		menu.showAtMouseEvent(evt);
	}

	private confirmStop(habit: HabitDefinition): void {
		new ConfirmModal(this.app, {
			title: "Stop tracking",
			message: `Stop tracking "${habit.name}"? It leaves the dashboard and stats, but its note and full history are kept. You can resume tracking any time from the note's metrics view.`,
			confirmText: "Stop tracking",
			onConfirm: async () => {
				await this.store.stopHabit(habit);
				this.reload();
			},
		}).open();
	}

	private confirmRemove(habit: HabitDefinition): void {
		new ConfirmModal(this.app, {
			title: "Remove habit",
			message: `Remove "${habit.name}"? Its note will be moved to the trash.`,
			confirmText: "Remove",
			danger: true,
			onConfirm: async () => {
				await this.store.deleteHabit(habit);
				this.reload();
			},
		}).open();
	}

	/** Open the modal for creating a brand-new habit. */
	private openCreateModal(): void {
		new HabitModal(this.app, this.store, () => {
			new Notice("Habit added to the dashboard.");
			this.reload();
		}).open();
	}
}
