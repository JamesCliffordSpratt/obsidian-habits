import {
	AbstractInputSuggest,
	App,
	PluginSettingTab,
	Setting,
	TFolder,
} from "obsidian";
import type HabitsPlugin from "./main";

/** Suggests matching vault folders while typing in a folder field. */
class FolderSuggest extends AbstractInputSuggest<TFolder> {
	constructor(
		app: App,
		private textInputEl: HTMLInputElement,
	) {
		super(app, textInputEl);
	}

	getSuggestions(query: string): TFolder[] {
		const needle = query.toLowerCase();
		return this.app.vault
			.getAllLoadedFiles()
			.filter(
				(file): file is TFolder =>
					file instanceof TFolder && file.path !== "/",
			)
			.filter((folder) => folder.path.toLowerCase().includes(needle))
			.slice(0, 20);
	}

	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		el.setText(folder.path);
	}

	selectSuggestion(folder: TFolder): void {
		this.textInputEl.value = folder.path;
		this.textInputEl.trigger("input");
		this.close();
	}
}

/** User-configurable settings for the plugin. */
export interface HabitsPluginSettings {
	/** Folder that holds one note per habit. */
	habitsFolder: string;
	/** How many cards are visible at once in the carousel on wide screens. */
	cardsPerView: number;
	/** How many cards are visible at once on phone-sized screens (1–2). */
	mobileCardsPerView: number;
	/**
	 * When a dashboard is embedded in a daily note (a note whose name
	 * contains a date), open it on that note's date instead of today.
	 */
	followDailyNoteDate: boolean;
}

export const DEFAULT_SETTINGS: HabitsPluginSettings = {
	habitsFolder: "Habits",
	cardsPerView: 4,
	mobileCardsPerView: 2,
	followDailyNoteDate: true,
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
			.addText((text) => {
				text
					.setPlaceholder("Habits")
					.setValue(this.plugin.settings.habitsFolder)
					.onChange(async (value) => {
						this.plugin.settings.habitsFolder =
							value.trim() || DEFAULT_SETTINGS.habitsFolder;
						await this.plugin.saveSettings();
					});
				new FolderSuggest(this.app, text.inputEl);
			});

		new Setting(containerEl)
			.setName("Follow daily note date")
			.setDesc(
				"When a dashboard is embedded in a daily note (a note whose name contains a date like 2026-07-01), open it on that note's date instead of today.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.followDailyNoteDate)
					.onChange(async (value) => {
						this.plugin.settings.followDailyNoteDate = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Cards per view")
			.setDesc(
				"How many habit cards the carousel shows at once on wider screens.",
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("1", "1")
					.addOption("2", "2")
					.addOption("3", "3")
					.addOption("4", "4")
					.setValue(String(this.plugin.settings.cardsPerView))
					.onChange(async (value) => {
						this.plugin.settings.cardsPerView = Number(value);
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Cards per view on mobile")
			.setDesc(
				"How many habit cards the carousel shows at once on phone-sized screens.",
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("1", "1")
					.addOption("2", "2")
					.setValue(
						String(this.plugin.settings.mobileCardsPerView),
					)
					.onChange(async (value) => {
						this.plugin.settings.mobileCardsPerView =
							Number(value);
						await this.plugin.saveSettings();
					}),
			);
	}
}
