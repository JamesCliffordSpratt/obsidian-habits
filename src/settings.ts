import {
	AbstractInputSuggest,
	App,
	PluginSettingTab,
	Setting,
	TFolder,
} from "obsidian";
import { t } from "./i18n";
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

/**
 * Feature flags for functionality that is still being tested.
 *
 * Every flag defaults to off. A flag only ever gates *entry points* (for
 * example whether a creation option is offered) — never how existing data
 * is interpreted — so turning a flag off can never corrupt or reinterpret
 * anything the user created while it was on. Graduating a feature to
 * fully-fledged means deleting its flag here and removing the UI guards.
 */
export interface ExperimentalFlags {
	/** Limit ("break") habits: goals that mean staying under a maximum. */
	limitHabits: boolean;
}

export const DEFAULT_EXPERIMENTAL: ExperimentalFlags = {
	limitHabits: false,
};

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
	/** Show the comment flap on dashboard cards. */
	enableComments: boolean;
	/** Opt-in switches for features that are still being tested. */
	experimental: ExperimentalFlags;
}

export const DEFAULT_SETTINGS: HabitsPluginSettings = {
	habitsFolder: "Habits",
	cardsPerView: 4,
	mobileCardsPerView: 2,
	followDailyNoteDate: true,
	enableComments: true,
	experimental: { ...DEFAULT_EXPERIMENTAL },
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
			.setName(t("Habits folder"))
			.setDesc(
				t(
					"Folder where each habit is stored as its own note. It is created automatically if it does not exist.",
				),
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
			.setName(t("Follow daily note date"))
			.setDesc(
				t(
					"When a dashboard is embedded in a daily note (a note whose name contains a date like 2026-07-01), open it on that note's date instead of today.",
				),
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
			.setName(t("Comments on cards"))
			.setDesc(
				t(
					"Show a comment flap on dashboard cards for jotting a note about any day.",
				),
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableComments)
					.onChange(async (value) => {
						this.plugin.settings.enableComments = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("Cards per view"))
			.setDesc(
				t(
					"How many habit cards the carousel shows at once on wider screens.",
				),
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
			.setName(t("Cards per view on mobile"))
			.setDesc(
				t(
					"How many habit cards the carousel shows at once on phone-sized screens.",
				),
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

		this.displayExperimental(containerEl);
	}

	/**
	 * Opt-in toggles for features still being tested. Turning a flag off
	 * only hides the feature's entry points; anything already created with
	 * it keeps working and keeps its meaning.
	 */
	private displayExperimental(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t("Experimental")).setHeading();

		containerEl.createEl("p", {
			cls: "habits-experimental-note",
			text: t(
				"These features are still being tested and may change before they become permanent. Turning one off only hides it from menus — anything you created with it keeps working.",
			),
		});

		new Setting(containerEl)
			.setName(t("Break bad habits"))
			.setDesc(
				t(
					"Track habits you want to reduce or avoid by staying under a daily limit — for example at most 2 hours of gaming, or no smoking at all.",
				),
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.experimental.limitHabits)
					.onChange(async (value) => {
						this.plugin.settings.experimental.limitHabits = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
