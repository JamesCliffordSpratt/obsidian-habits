import { App, ButtonComponent, Modal, Setting, setIcon } from "obsidian";
import type { HabitStore } from "../habit-store";
import type { HabitType } from "../types";
import { IconSuggestModal, iconLabel } from "./icon-suggest-modal";

/** Modal that collects the details needed to create a new habit. */
export class HabitModal extends Modal {
	private habitName = "";
	private type: HabitType = "binary";
	private target = 1;
	private unit = "";
	private color = "";
	private icon = "";

	private previewIconEl: HTMLElement | null = null;
	private previewNameEl: HTMLElement | null = null;
	private iconButton: ButtonComponent | null = null;

	constructor(
		app: App,
		private store: HabitStore,
		private onCreated: () => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.modalEl.addClass("habits-modal");
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
				.setPlaceholder("Drink water")
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
					.setPlaceholder(this.type === "timed" ? "30" : "8")
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
							.setPlaceholder("Cups")
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

		new Setting(contentEl)
			.setName("Colour")
			.setDesc("Accent colour for the card.")
			.addColorPicker((picker) =>
				picker.setValue(this.color || "#7c6cff").onChange((value) => {
					this.color = value;
					this.updatePreview();
				}),
			);

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
