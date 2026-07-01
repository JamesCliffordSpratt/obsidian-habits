import {
	App,
	ButtonComponent,
	ColorComponent,
	Modal,
	Setting,
	setIcon,
} from "obsidian";
import type { HabitStore } from "../habit-store";
import type { HabitDefinition, HabitType } from "../types";
import {
	applyHabitIcon,
	IconSuggestModal,
	iconLabel,
	isLucideIcon,
} from "./icon-suggest-modal";
import { EmojiSuggestModal } from "./emoji-suggest-modal";

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
			this.target = editing.target || 1;
			this.unit = editing.unit;
			this.weeklyTarget = editing.weeklyTarget || 0;
			this.monthlyTarget = editing.monthlyTarget || 0;
			this.weeklyPerfect = editing.weeklyPerfect;
			this.monthlyPerfect = editing.monthlyPerfect;
			this.targetsOpen =
				editing.weeklyTarget > 0 ||
				editing.monthlyTarget > 0 ||
				editing.weeklyPerfect ||
				editing.monthlyPerfect;
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
			.setName(this.editing ? "Edit habit" : "New habit")
			.setHeading();

		this.renderPreview(contentEl);

		new Setting(contentEl).setName("Name").addText((text) =>
			text
				.setPlaceholder(this.currentExample().name)
				.setValue(this.habitName)
				.onChange((value) => {
					this.habitName = value;
					this.updatePreview();
				}),
		);

		new Setting(contentEl)
			.setName("Type")
			.setDesc(
				"Binary is done or not done. Repetition counts towards a target. Timed tracks minutes.",
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("binary", "Binary")
					.addOption("repetition", "Repetition")
					.addOption("timed", "Timed")
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
					? "Daily target (minutes)"
					: "Daily target";
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
					.setName("Unit")
					.setDesc("Optional label shown next to the count.")
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

		this.renderTargets(contentEl);

		new Setting(contentEl)
			.setName("Icon")
			.setDesc("Choose a Lucide icon or an emoji to represent this habit.")
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
					.setButtonText("Emoji")
					.setTooltip("Choose an emoji")
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
					.setTooltip("Clear icon")
					.onClick(() => {
						this.icon = "";
						this.updateIconButton();
						this.updatePreview();
					}),
			);

		this.renderColorPicker(contentEl);

		new Setting(contentEl)
			.addButton((button) =>
				button.setButtonText("Cancel").onClick(() => this.close()),
			)
			.addButton((button) =>
				button
					.setButtonText(this.editing ? "Save changes" : "Create habit")
					.setCta()
					.onClick(async () => {
						const options = {
							name: this.habitName,
							type: this.type,
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

	/** Collapsible, optional weekly/monthly targets section. */
	private renderTargets(contentEl: HTMLElement): void {
		const details = contentEl.createEl("details", { cls: "habits-targets" });
		details.open = this.targetsOpen;
		details.addEventListener("toggle", () => {
			this.targetsOpen = details.open;
		});
		details.createEl("summary", {
			cls: "habits-targets-summary",
			text: "Targets (optional)",
		});
		details.createEl("p", {
			cls: "habits-targets-intro",
			text: "Set an optional weekly or monthly goal for how many days you complete this habit. For example, hitting your daily goal on all 7 days is a weekly target of 7. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.",
		});

		new Setting(details)
			.setName("Perfect week")
			.setDesc("Aim to complete this habit every day of the week.")
			.addToggle((toggle) =>
				toggle.setValue(this.weeklyPerfect).onChange((value) => {
					this.weeklyPerfect = value;
					this.build();
				}),
			);
		if (!this.weeklyPerfect) {
			new Setting(details)
				.setName("Weekly target")
				.setDesc("Optional. Days to complete per week (max 7).")
				.addText((text) => {
					applyNumeric(text.inputEl, 1, 7);
					text
						.setPlaceholder("None")
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
			.setName("Perfect month")
			.setDesc("Aim to complete this habit every day of the month.")
			.addToggle((toggle) =>
				toggle.setValue(this.monthlyPerfect).onChange((value) => {
					this.monthlyPerfect = value;
					this.build();
				}),
			);
		if (!this.monthlyPerfect) {
			new Setting(details)
				.setName("Monthly target")
				.setDesc("Optional. Days to complete per month.")
				.addText((text) => {
					applyNumeric(text.inputEl, 1, 31);
					text
						.setPlaceholder("None")
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
			.setName("Colour")
			.setDesc("Pick a colour from your theme, or choose a custom one.");

		const swatches = setting.controlEl.createDiv({
			cls: "habits-swatches",
		});
		this.colorSwatches = [];
		for (const swatch of THEME_COLORS) {
			const el = swatches.createEl("button", {
				cls: "habits-swatch",
				attr: { type: "button", "aria-label": swatch.label },
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
			this.previewNameEl.setText(this.habitName || "Your habit");
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
				text: isLucideIcon(this.icon) ? iconLabel(this.icon) : "Emoji",
			});
		} else {
			setIcon(glyph, "image-plus");
			button.buttonEl.createSpan({ text: "Choose icon" });
		}
	}
}
