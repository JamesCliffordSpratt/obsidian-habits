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
	/** AI-generated summaries on the weekly and monthly stats tabs. */
	aiSummaries: boolean;
}

export const DEFAULT_EXPERIMENTAL: ExperimentalFlags = {
	limitHabits: false,
	aiSummaries: false,
};

/**
 * Connection details for the AI summaries feature. Any OpenAI-compatible
 * chat-completions endpoint works, including local servers (Ollama,
 * LM Studio), in which case the API key may be left blank.
 */
export interface AiSummarySettings {
	/** Endpoint base URL, e.g. `https://api.openai.com/v1`. */
	baseUrl: string;
	/** Bearer token for the endpoint. May be blank for local servers. */
	apiKey: string;
	/** Model name to request, e.g. `gpt-4o-mini`. */
	model: string;
}

export const DEFAULT_AI_SUMMARY: AiSummarySettings = {
	baseUrl: "https://api.openai.com/v1",
	apiKey: "",
	model: "gpt-4o-mini",
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
	/**
	 * Moment.js format used to read the date from a daily note's name,
	 * e.g. `YYYY-MM-DD` or `YYYYMMDD`.
	 */
	dailyNoteDateFormat: string;
	/** Show the comment flap on dashboard cards. */
	enableComments: boolean;
	/** Split the stats page's habit rows into carousel pages. */
	statsCarousel: boolean;
	/** How many habit rows each stats carousel page shows. */
	statsRowsPerPage: number;
	/** Opt-in switches for features that are still being tested. */
	experimental: ExperimentalFlags;
	/** Connection details used when AI summaries are enabled. */
	aiSummary: AiSummarySettings;
}

export const DEFAULT_SETTINGS: HabitsPluginSettings = {
	habitsFolder: "Habits",
	cardsPerView: 4,
	mobileCardsPerView: 2,
	followDailyNoteDate: true,
	dailyNoteDateFormat: "YYYY-MM-DD",
	enableComments: true,
	statsCarousel: false,
	statsRowsPerPage: 4,
	experimental: { ...DEFAULT_EXPERIMENTAL },
	aiSummary: { ...DEFAULT_AI_SUMMARY },
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
			.setName(t("Daily note date format"))
			.setDesc(
				t(
					"Moment.js format used to read the date from a daily note's name, such as YYYY-MM-DD or YYYYMMDD.",
				),
			)
			.addText((text) =>
				text
					.setPlaceholder("YYYY-MM-DD")
					.setValue(this.plugin.settings.dailyNoteDateFormat)
					.onChange(async (value) => {
						this.plugin.settings.dailyNoteDateFormat =
							value.trim() || DEFAULT_SETTINGS.dailyNoteDateFormat;
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

		new Setting(containerEl)
			.setName(t("Stats page carousel"))
			.setDesc(
				t(
					"Show the per-habit stats as pages you can flip through instead of one long list.",
				),
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.statsCarousel)
					.onChange(async (value) => {
						this.plugin.settings.statsCarousel = value;
						await this.plugin.saveSettings();
						// Show or hide the page-size option with the toggle.
						renderCarouselOptions();
					}),
			);

		// The page-size option lives in its own container so toggling the
		// carousel can redraw just this block instead of the whole tab.
		const carouselDetails = containerEl.createDiv();
		const renderCarouselOptions = (): void => {
			carouselDetails.empty();
			if (!this.plugin.settings.statsCarousel) {
				return;
			}
			new Setting(carouselDetails)
				.setName(t("Stats rows per page"))
				.setDesc(t("How many habits each stats page shows."))
				.addDropdown((dropdown) => {
					for (let n = 1; n <= 8; n++) {
						dropdown.addOption(String(n), String(n));
					}
					dropdown
						.setValue(
							String(this.plugin.settings.statsRowsPerPage),
						)
						.onChange(async (value) => {
							this.plugin.settings.statsRowsPerPage =
								Number(value);
							await this.plugin.saveSettings();
						});
				});
		};
		renderCarouselOptions();

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

		new Setting(containerEl)
			.setName(t("AI summaries"))
			.setDesc(
				t(
					"Show an AI-generated summary with feedback and advice on the stats page tabs. Uses an OpenAI-compatible service you configure below; your habit stats are sent to it only when you press the generate button.",
				),
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.experimental.aiSummaries)
					.onChange(async (value) => {
						this.plugin.settings.experimental.aiSummaries = value;
						await this.plugin.saveSettings();
						// Show or hide the connection fields with the toggle.
						renderAiFields();
					}),
			);

		// The connection fields live in their own container so toggling the
		// feature can redraw just this block instead of the whole tab.
		const aiDetails = containerEl.createDiv();
		const renderAiFields = (): void => {
			aiDetails.empty();
			if (this.plugin.settings.experimental.aiSummaries) {
				this.displayAiSummary(aiDetails);
			}
		};
		renderAiFields();
	}

	/** Connection fields for the AI summaries feature (shown only when on). */
	private displayAiSummary(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t("AI base URL"))
			.setDesc(
				t(
					"Base URL of an OpenAI-compatible API. Works with OpenAI, OpenRouter, or local servers like Ollama (http://localhost:11434/v1).",
				),
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_AI_SUMMARY.baseUrl)
					.setValue(this.plugin.settings.aiSummary.baseUrl)
					.onChange(async (value) => {
						this.plugin.settings.aiSummary.baseUrl =
							value.trim() || DEFAULT_AI_SUMMARY.baseUrl;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("AI API key"))
			.setDesc(
				t(
					"Stored locally in this vault's plugin data. Leave blank for local servers that need no key.",
				),
			)
			.addText((text) => {
				text.inputEl.type = "password";
				text
					.setValue(this.plugin.settings.aiSummary.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.aiSummary.apiKey = value.trim();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t("AI model"))
			.setDesc(t("Model name the service should use."))
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_AI_SUMMARY.model)
					.setValue(this.plugin.settings.aiSummary.model)
					.onChange(async (value) => {
						this.plugin.settings.aiSummary.model =
							value.trim() || DEFAULT_AI_SUMMARY.model;
						await this.plugin.saveSettings();
					}),
			);
	}
}
