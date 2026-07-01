import { App, PluginSettingTab, Setting } from "obsidian";
import type HabitsPlugin from "./main";

/** User-configurable settings for the plugin. */
export interface HabitsPluginSettings {
	/** Folder that holds one note per habit. */
	habitsFolder: string;
	/** How many cards are visible at once in the carousel on wide screens. */
	cardsPerView: number;
}

export const DEFAULT_SETTINGS: HabitsPluginSettings = {
	habitsFolder: "Habits",
	cardsPerView: 1,
};

/** Settings tab shown under Settings → Community plugins → Habits. */
export class HabitsSettingTab extends PluginSettingTab {
	private plugin: HabitsPlugin;

	constructor(app: App, plugin: HabitsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Habits folder")
			.setDesc(
				"Folder where each habit is stored as its own note. It is created automatically if it does not exist.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Habits")
					.setValue(this.plugin.settings.habitsFolder)
					.onChange(async (value) => {
						this.plugin.settings.habitsFolder =
							value.trim() || DEFAULT_SETTINGS.habitsFolder;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Cards per view")
			.setDesc(
				"How many habit cards the carousel shows at once on wider screens.",
			)
			.addSlider((slider) =>
				slider
					.setLimits(1, 4, 1)
					.setValue(this.plugin.settings.cardsPerView)
					.onChange(async (value) => {
						this.plugin.settings.cardsPerView = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
