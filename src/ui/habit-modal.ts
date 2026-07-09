import {
	App,
	ButtonComponent,
	ColorComponent,
	Modal,
	Setting,
	setIcon,
} from "obsidian";
import type { HabitStore } from "../habit-store";
import type { HabitDefinition, HabitFrequency, HabitType } from "../types";
import {
	applyHabitIcon,
	IconSuggestModal,
	iconLabel,
	isLucideIcon,
} from "./icon-suggest-modal";
import { EmojiSuggestModal } from "./emoji-suggest-modal";
import { t } from "../i18n";

/**
 * Accent colours taken from the current theme's palette. Storing the CSS
 * variable (rather than a fixed hex) means a habit's colour follows the
 * user's theme and updates automatically if they switch themes.
 */
const THEME_COLORS: readonly { label: string; value: string }[] = [
	{ label: "Accent", value: "var(--interactive-accent)" },
	{ label: "Red", value: "var(--color-red)" },
	{ label: "Orange", value: "var(--color-orange)" },
	{ label: "Yellow", value: "var(--color-yellow)" },
	{ label: "Green", value: "var(--color-green)" },
	{ label: "Cyan", value: "var(--color-cyan)" },
	{ label: "Blue", value: "var(--color-blue)" },
	{ label: "Purple", value: "var(--color-purple)" },
	{ label: "Pink", value: "var(--color-pink)" },
];

/**
 * Weekdays offered for weekly habits, ordered Monday-first for familiarity.
 * Values are JavaScript `getDay` numbers (`0` = Sunday) so they map directly
 * onto `Date.getDay()` when checking whether a habit is due.
 */
const WEEKDAYS: readonly { label: string; value: number }[] = [
	{ label: "Monday", value: 1 },
	{ label: "Tuesday", value: 2 },
	{ label: "Wednesday", value: 3 },
	{ label: "Thursday", value: 4 },
	{ label: "Friday", value: 5 },
	{ label: "Saturday", value: 6 },
	{ label: "Sunday", value: 0 },
];

/** A placeholder example shown to hint at how a habit type is used. */
interface HabitExample {
	name: string;
	unit?: string;
	target?: number;
}

/**
 * Ten example habits per type. One is chosen at random each time the modal
 * opens so the placeholders vary and illustrate different use cases.
 */
const EXAMPLES: Record<HabitType, HabitExample[]> = {
	binary: [
		{ name: "Make the bed" },
		{ name: "Take vitamins" },
		{ name: "Floss teeth" },
		{ name: "No sugar today" },
		{ name: "Write a journal entry" },
		{ name: "Stretch" },
		{ name: "Read before bed" },
		{ name: "Tidy the workspace" },
		{ name: "Take a cold shower" },
		{ name: "Call a friend" },
	],
	repetition: [
		{ name: "Drink water", unit: "Cups", target: 8 },
		{ name: "Step count", unit: "Steps", target: 10000 },
		{ name: "Push-ups", unit: "Reps", target: 50 },
		{ name: "Read", unit: "Pages", target: 20 },
		{ name: "Eat vegetables", unit: "Servings", target: 5 },
		{ name: "Water the plants", unit: "Plants", target: 4 },
		{ name: "Learn vocabulary", unit: "Words", target: 10 },
		{ name: "Sit-ups", unit: "Reps", target: 30 },
		{ name: "Practise chords", unit: "Chords", target: 6 },
		{ name: "Drink milk", unit: "Glasses", target: 2 },
	],
	timed: [
		{ name: "Exercise", target: 30 },
		{ name: "Meditate", target: 10 },
		{ name: "Read", target: 20 },
		{ name: "Study", target: 45 },
		{ name: "Walk", target: 25 },
		{ name: "Practise piano", target: 30 },
		{ name: "Yoga", target: 20 },
		{ name: "Deep work", target: 60 },
		{ name: "Practise a language", target: 15 },
		{ name: "Stretch", target: 10 },
	],
};

/** Constrain a text input to whole numbers within an optional range. */
function applyNumeric(
	input: HTMLInputElement,
	min: number,
	max?: number,
): void {
	input.type = "number";
	input.inputMode = "numeric";
	input.min = String(min);
	if (max !== undefined) {
		input.max = String(max);
	}
	input.step = "1";
}

/** Modal that collects the details needed to create a new habit. */
export class HabitModal extends Modal {
	private habitName = "";
	private type: HabitType = "binary";
	private frequency: HabitFrequency = "daily";
	private weekday = new Date().getDay();
	private monthDay = new Date().getDate();
	private target = 1;
	private unit = "";
	private weeklyTarget = 0;
	private monthlyTarget = 0;
	private weeklyPerfect = false;
	private monthlyPerfect = false;
	private targetsOpen = false;
	private color = "var(--interactive-accent)";
	private icon = "";
	private exampleIndex = 0;
	private editing: HabitDefinition | null = null;

	private previewIconEl: HTMLElement | null = null;
	private previewNameEl: HTMLElement | null = null;
	private iconButton: ButtonComponent | null = null;
	private customPicker: ColorComponent | null = null;
	private colorSwatches: { value: string; el: HTMLElement }[] = [];

	constructor(
		app: App,
		private store: HabitStore,
		private onCreated: () => void,
		editing: HabitDefinition | null = null,
	) {
		super(app);
		this.editing = editing;
		if (editing) {
			this.habitName = editing.name;
			this.type = editing.type;
			this.frequency = editing.frequency;
			if (editing.frequency === "weekly") {
				this.weekday = editing.weekday;
			} else if (editing.frequency === "monthly") {
				this.monthDay = editing.monthDay;
			}
			this.target = editing.target || 1;
			this.unit = editing.unit;
			this.weeklyTarget = editing.weeklyTarget || 0;
			this.monthlyTarget = editing.monthlyTarget || 0;
			this.weeklyPerfect = editing.weeklyPerfect;
			this.monthlyPerfect = editing.monthlyPerfect;
			this.icon = editing.icon;
			this.color = editing.color || "var(--interactive-accent)";
		}
	}

	onOpen(): void {
		this.modalEl.addClass("habits-modal");
		this.exampleIndex = Math.floor(
			Math.random() * EXAMPLES[this.type].length,
		);
		this.build();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private build(): void {
		const { contentEl } = this;
		contentEl.empty();

		new Setting(contentEl)
			.setName(this.editing ? t("Edit habit") : t("New habit"))
			.setHeading();

		this.renderPreview(contentEl);

		new Setting(contentEl).setName(t("Name")).addText((text) =>
			text
				.setPlaceholder(this.currentExample().name)
				.setValue(this.habitName)
				.onChange((value) => {
					this.habitName = value;
					this.updatePreview();
				}),
		);

		new Setting(contentEl)
			.setName(t("Type"))
			.setDesc(
				t(
					"Binary is done or not done. Repetition counts towards a target. Timed tracks minutes.",
				),
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("binary", t("Binary"))
					.addOption("repetition", t("Repetition"))
					.addOption("timed", t("Timed"))
					.setValue(this.type)
					.onChange((value) => {
						this.type = value as HabitType;
						this.randomizeExample();
						this.build();
					}),
			);

		if (this.type !== "binary") {
			const targetName =
				this.type === "timed"
					? t("Daily target (minutes)")
					: t("Daily target");
			new Setting(contentEl).setName(targetName).addText((text) => {
				applyNumeric(text.inputEl, 1);
				text
					.setPlaceholder(
						String(
							this.currentExample().target ??
								(this.type === "timed" ? 30 : 8),
						),
					)
					.setValue(String(this.target))
					.onChange((value) => {
						const parsed = Number(value);
						this.target = Number.isFinite(parsed) ? parsed : 1;
					});
			});

			if (this.type === "repetition") {
				new Setting(contentEl)
					.setName(t("Unit"))
					.setDesc(t("Optional label shown next to the count."))
					.addText((text) =>
						text
							.setPlaceholder(this.currentExample().unit ?? "Cups")
							.setValue(this.unit)
							.onChange((value) => {
								this.unit = value;
							}),
					);
			}
		}

		this.renderFrequency(contentEl);

		// Weekly and monthly goals count days completed within a period, which
		// only makes sense for a daily habit; a weekly/monthly habit is due at
		// most once per period.
		if (this.frequency === "daily") {
			this.renderTargets(contentEl);
		}

		new Setting(contentEl)
			.setName(t("Icon"))
			.setDesc(t("Choose a Lucide icon or an emoji to represent this habit."))
			.addButton((button) => {
				this.iconButton = button;
				this.updateIconButton();
				button.onClick(() => {
					new IconSuggestModal(this.app, (icon) => {
						this.icon = icon;
						this.updateIconButton();
						this.updatePreview();
					}).open();
				});
			})
			.addButton((button) =>
				button
					.setButtonText(t("Emoji"))
					.setTooltip(t("Choose an emoji"))
					.onClick(() => {
						new EmojiSuggestModal(this.app, (emoji) => {
							this.icon = emoji;
							this.updateIconButton();
							this.updatePreview();
						}).open();
					}),
			)
			.addExtraButton((extra) =>
				extra
					.setIcon("x")
					.setTooltip(t("Clear icon"))
					.onClick(() => {
						this.icon = "";
						this.updateIconButton();
						this.updatePreview();
					}),
			);

		this.renderColorPicker(contentEl);

		new Setting(contentEl)
			.addButton((button) =>
				button.setButtonText(t("Cancel")).onClick(() => this.close()),
			)
			.addButton((button) =>
				button
					.setButtonText(this.editing ? t("Save changes") : t("Create habit"))
					.setCta()
					.onClick(async () => {
						const options = {
							name: this.habitName,
							type: this.type,
							frequency: this.frequency,
							weekday: this.weekday,
							monthDay: this.monthDay,
							target: this.target,
							unit: this.unit,
							weeklyTarget: this.weeklyTarget,
							monthlyTarget: this.monthlyTarget,
							weeklyPerfect: this.weeklyPerfect,
							monthlyPerfect: this.monthlyPerfect,
							icon: this.icon,
							color: this.color,
						};
						const file = this.editing
							? await this.store.updateHabit(this.editing, options)
							: await this.store.createHabit(options);
						if (file) {
							this.close();
							this.onCreated();
						}
					}),
			);
	}

	/** Move to a different example so switching type always rotates. */
	private randomizeExample(): void {
		const count = EXAMPLES[this.type].length;
		this.exampleIndex =
			(this.exampleIndex + 1 + Math.floor(Math.random() * (count - 1))) %
			count;
	}

	private currentExample(): HabitExample {
		const list = EXAMPLES[this.type];
		return list[this.exampleIndex % list.length];
	}

	/**
	 * Frequency picker: daily, weekly (with a weekday) or monthly (with a day
	 * of the month). Weekly and monthly habits only surface on their due date.
	 */
	private renderFrequency(contentEl: HTMLElement): void {
		new Setting(contentEl)
			.setName(t("Frequency"))
			.setDesc(
				t(
					"How often this habit is due. Weekly and monthly habits only appear on their due date.",
				),
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("daily", t("Daily"))
					.addOption("weekly", t("Weekly"))
					.addOption("monthly", t("Monthly"))
					.setValue(this.frequency)
					.onChange((value) => {
						this.frequency = value as HabitFrequency;
						this.build();
					}),
			);

		if (this.frequency === "weekly") {
			new Setting(contentEl)
				.setName(t("Day of week"))
				.setDesc(t("The weekday this habit is due on."))
				.addDropdown((dropdown) => {
					for (const day of WEEKDAYS) {
						dropdown.addOption(String(day.value), t(day.label));
					}
					dropdown
						.setValue(String(this.weekday))
						.onChange((value) => {
							this.weekday = Number(value);
						});
				});
		}

		if (this.frequency === "monthly") {
			new Setting(contentEl)
				.setName(t("Day of month"))
				.setDesc(
					t(
						"The day of the month this habit is due. In shorter months it falls due on the last day, so 31 always lands on the final day of the month.",
					),
				)
				.addDropdown((dropdown) => {
					for (let day = 1; day <= 31; day++) {
						dropdown.addOption(String(day), String(day));
					}
					dropdown
						.setValue(String(this.monthDay))
						.onChange((value) => {
							this.monthDay = Number(value);
						});
				});
		}
	}

	/** Collapsible, optional weekly/monthly targets section. */
	private renderTargets(contentEl: HTMLElement): void {
		const details = contentEl.createEl("details", { cls: "habits-targets" });
		details.open = this.targetsOpen;
		details.addEventListener("toggle", () => {
			this.targetsOpen = details.open;
		});
		details.createEl("summary", {
			cls: "habits-targets-summary",
			text: t("Targets (optional)"),
		});
		details.createEl("p", {
			cls: "habits-targets-intro",
			text: t(
				"Set an optional weekly or monthly goal for how many days you complete this habit. For example, hitting your daily goal on all 7 days is a weekly target of 7. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.",
			),
		});

		new Setting(details)
			.setName(t("Perfect week"))
			.setDesc(t("Aim to complete this habit every day of the week."))
			.addToggle((toggle) =>
				toggle.setValue(this.weeklyPerfect).onChange((value) => {
					this.weeklyPerfect = value;
					this.build();
				}),
			);
		if (!this.weeklyPerfect) {
			new Setting(details)
				.setName(t("Weekly target"))
				.setDesc(t("Optional. Days to complete per week (max 7)."))
				.addText((text) => {
					applyNumeric(text.inputEl, 1, 7);
					text
						.setPlaceholder(t("None"))
						.setValue(
							this.weeklyTarget ? String(this.weeklyTarget) : "",
						)
						.onChange((value) => {
							const parsed = Number(value);
							this.weeklyTarget =
								Number.isFinite(parsed) && parsed > 0
									? Math.min(7, Math.round(parsed))
									: 0;
						});
				});
		}
		new Setting(details)
			.setName(t("Perfect month"))
			.setDesc(t("Aim to complete this habit every day of the month."))
			.addToggle((toggle) =>
				toggle.setValue(this.monthlyPerfect).onChange((value) => {
					this.monthlyPerfect = value;
					this.build();
				}),
			);
		if (!this.monthlyPerfect) {
			new Setting(details)
				.setName(t("Monthly target"))
				.setDesc(t("Optional. Days to complete per month."))
				.addText((text) => {
					applyNumeric(text.inputEl, 1, 31);
					text
						.setPlaceholder(t("None"))
						.setValue(
							this.monthlyTarget ? String(this.monthlyTarget) : "",
						)
						.onChange((value) => {
							const parsed = Number(value);
							this.monthlyTarget =
								Number.isFinite(parsed) && parsed > 0
									? Math.min(31, Math.round(parsed))
									: 0;
						});
				});
		}
	}

	private renderPreview(contentEl: HTMLElement): void {
		const preview = contentEl.createDiv({ cls: "habits-modal-preview" });
		this.previewIconEl = preview.createDiv({
			cls: "habits-modal-preview-icon",
		});
		this.previewNameEl = preview.createDiv({
			cls: "habits-modal-preview-name",
		});
		this.updatePreview();
	}

	private renderColorPicker(contentEl: HTMLElement): void {
		const setting = new Setting(contentEl)
			.setName(t("Colour"))
			.setDesc(t("Pick a colour from your theme, or choose a custom one."));

		const swatches = setting.controlEl.createDiv({
			cls: "habits-swatches",
		});
		this.colorSwatches = [];
		for (const swatch of THEME_COLORS) {
			const el = swatches.createEl("button", {
				cls: "habits-swatch",
				attr: { type: "button", "aria-label": t(swatch.label) },
			});
			el.setCssProps({ "--habits-swatch": swatch.value });
			el.addEventListener("click", () => {
				this.color = swatch.value;
				this.updateSwatchSelection();
				this.updatePreview();
			});
			this.colorSwatches.push({ value: swatch.value, el });
		}

		setting.addColorPicker((picker) => {
			this.customPicker = picker;
			if (this.color.startsWith("#")) {
				picker.setValue(this.color);
			}
			picker.onChange((value) => {
				this.color = value;
				this.updateSwatchSelection();
				this.updatePreview();
			});
		});

		this.updateSwatchSelection();
	}

	private updateSwatchSelection(): void {
		for (const swatch of this.colorSwatches) {
			swatch.el.toggleClass("is-selected", swatch.value === this.color);
		}
	}

	private updatePreview(): void {
		if (this.previewIconEl) {
			if (this.icon) {
				applyHabitIcon(this.previewIconEl, this.icon);
			} else {
				this.previewIconEl.empty();
				setIcon(this.previewIconEl, "circle-dashed");
			}
			this.previewIconEl.setCssProps({
				"--habits-accent": this.color || "var(--interactive-accent)",
			});
		}
		if (this.previewNameEl) {
			this.previewNameEl.setText(this.habitName || t("Your habit"));
		}
	}

	private updateIconButton(): void {
		const button = this.iconButton;
		if (!button) {
			return;
		}
		button.buttonEl.empty();
		const glyph = button.buttonEl.createSpan({ cls: "habits-button-icon" });
		if (this.icon) {
			applyHabitIcon(glyph, this.icon);
			button.buttonEl.createSpan({
				text: isLucideIcon(this.icon) ? iconLabel(this.icon) : t("Emoji"),
			});
		} else {
			setIcon(glyph, "image-plus");
			button.buttonEl.createSpan({ text: t("Choose icon") });
		}
	}
}
