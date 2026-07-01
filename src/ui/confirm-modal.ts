import { App, Modal, Setting } from "obsidian";

/** Options for a simple confirm/cancel dialog. */
export interface ConfirmOptions {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	/** Style the confirm button as a destructive action. */
	danger?: boolean;
	onConfirm: () => void | Promise<void>;
}

/** A reusable confirmation dialog with a cancel and a confirm button. */
export class ConfirmModal extends Modal {
	constructor(
		app: App,
		private options: ConfirmOptions,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		new Setting(contentEl).setName(this.options.title).setHeading();
		contentEl.createEl("p", { text: this.options.message });

		new Setting(contentEl)
			.addButton((button) =>
				button
					.setButtonText(this.options.cancelText ?? "Cancel")
					.onClick(() => this.close()),
			)
			.addButton((button) => {
				button
					.setButtonText(this.options.confirmText ?? "Confirm")
					.onClick(async () => {
						this.close();
						await this.options.onConfirm();
					});
				if (this.options.danger) {
					button.buttonEl.addClass("mod-warning");
				} else {
					button.setCta();
				}
			});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
