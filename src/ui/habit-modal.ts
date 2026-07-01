import {
	App,
	ButtonComponent,
	ColorComponent,
	Modal,
	Setting,
	setIcon,
} from "obsidian";
import type { HabitStore } from "../habit-store";
import type { HabitType } from "../types";
import { IconSuggestModal, iconLabel } from "./icon-suggest-modal";

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

/** Modal that collects the details needed to create a new habit. */
export class HabitModal extends Modal {
	private habitName = "";
	private type: HabitType = "binary";
	private target = 1;
	private unit = "";
	private color = "var(--interactive-accent)";
	private icon = "";
	private exampleIndex = 0;

	private previewIconEl: HTMLElement | null = null;
	private previewNameEl: HTMLElement | null = null;
	private iconButton: ButtonComponent | null = null;
	private customPicker: ColorComponent | null = null;
	private colorSwatches: { value: string; el: HTMLElement }[] = [];

	constructor(
		app: App,
		private store: HabitStore,
		private onCreated: () => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.modalEl.addClass("habits-modal");
		this.exampleIndex = Math.floor(Math.random() * 10);
		this.build();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private build(): void {
		const { contentEl } = this;
		contentEl.empty();

		new Setting(contentEl).setName("New habit").setHeading();

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
						this.build();
					}),
			);

		if (this.type !== "binary") {
			const targetName =
				this.type === "timed"
					? "Daily target (minutes)"
					: "Daily target";
			new Setting(contentEl).setName(targetName).addText((text) =>
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
					}),
			);

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

		new Setting(contentEl)
			.setName("Icon")
			.setDesc("Choose an icon to represent this habit.")
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
					.setButtonText("Create habit")
					.setCta()
					.onClick(async () => {
						const file = await this.store.createHabit({
							name: this.habitName,
							type: this.type,
							target: this.target,
							unit: this.unit,
							icon: this.icon,
							color: this.color,
						});
						if (file) {
							this.close();
							this.onCreated();
						}
					}),
			);
	}

	private currentExample(): HabitExample {
		const list = EXAMPLES[this.type];
		return list[this.exampleIndex % list.length];
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
			this.previewIconEl.empty();
			setIcon(this.previewIconEl, this.icon || "circle-dashed");
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
			setIcon(glyph, this.icon);
			button.buttonEl.createSpan({ text: iconLabel(this.icon) });
		} else {
			setIcon(glyph, "image-plus");
			button.buttonEl.createSpan({ text: "Choose icon" });
		}
	}
}
