import {
	AbstractInputSuggest,
	App,
	PluginSettingTab,
	requireApiVersion,
	Setting,
	TFolder,
	type SettingDefinitionItem,
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

/** How the dashboard presents its habit cards. */
export type DashboardLayout = "carousel" | "grid" | "vertical";

/** User-configurable settings for the plugin. */
export interface HabitsPluginSettings {
	/** Folder that holds one note per habit. */
	habitsFolder: string;
	/**
	 * How the dashboard shows its cards: a paged carousel, a grid that
	 * wraps onto new rows, or a fixed-height vertically scrolling grid.
	 */
	dashboardLayout: DashboardLayout;
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
	dashboardLayout: "carousel",
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

/** Settings stored as numbers but edited through string-valued dropdowns. */
const NUMERIC_DROPDOWN_KEYS = new Set([
	"cardsPerView",
	"mobileCardsPerView",
	"statsRowsPerPage",
]);

/** Read a possibly nested settings value by a dot-separated key. */
function getPath(obj: unknown, key: string): unknown {
	let current: unknown = obj;
	for (const part of key.split(".")) {
		if (current === null || typeof current !== "object") {
			return undefined;
		}
		current = (current as Record<string, unknown>)[part];
	}
	return current;
}

/** Write a possibly nested settings value by a dot-separated key. */
function setPath(obj: object, key: string, value: unknown): void {
	const parts = key.split(".");
	const last = parts.pop() as string;
	let current = obj as Record<string, unknown>;
	for (const part of parts) {
		const next = current[part];
		if (next === null || typeof next !== "object") {
			return;
		}
		current = next as Record<string, unknown>;
	}
	current[last] = value;
}

/** Settings tab shown under Settings → Community plugins → Habits. */
export class HabitsSettingTab extends PluginSettingTab {
	private plugin: HabitsPlugin;

	constructor(app: App, plugin: HabitsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Declarative settings (Obsidian 1.13+), which also makes every option
	 * discoverable through the settings search. `display()` below remains
	 * as the fallback for older Obsidian versions and is only called when
	 * this method is unavailable.
	 */
	getSettingDefinitions(): SettingDefinitionItem[] {
		const aiSummariesOn = (): boolean =>
			this.plugin.settings.experimental.aiSummaries;
		return [
			{
				name: t("Habits folder"),
				desc: t(
					"Folder where each habit is stored as its own note. It is created automatically if it does not exist.",
				),
				control: {
					type: "folder",
					key: "habitsFolder",
					placeholder: DEFAULT_SETTINGS.habitsFolder,
					defaultValue: DEFAULT_SETTINGS.habitsFolder,
				},
			},
			{
				name: t("Follow daily note date"),
				desc: t(
					"When a dashboard is embedded in a daily note (a note whose name contains a date like 2026-07-01), open it on that note's date instead of today.",
				),
				control: {
					type: "toggle",
					key: "followDailyNoteDate",
					defaultValue: DEFAULT_SETTINGS.followDailyNoteDate,
				},
			},
			{
				name: t("Daily note date format"),
				desc: t(
					"Moment.js format used to read the date from a daily note's name, such as YYYY-MM-DD or YYYYMMDD.",
				),
				control: {
					type: "text",
					key: "dailyNoteDateFormat",
					placeholder: DEFAULT_SETTINGS.dailyNoteDateFormat,
					defaultValue: DEFAULT_SETTINGS.dailyNoteDateFormat,
				},
			},
			{
				name: t("Comments on cards"),
				desc: t(
					"Show a comment flap on dashboard cards for jotting a note about any day.",
				),
				control: {
					type: "toggle",
					key: "enableComments",
					defaultValue: DEFAULT_SETTINGS.enableComments,
				},
			},
			{
				name: t("Dashboard layout"),
				desc: t(
					"How to move through your habit cards: a paged carousel with arrows, a grid that wraps onto new rows, or a fixed-height grid that scrolls vertically.",
				),
				control: {
					type: "dropdown",
					key: "dashboardLayout",
					options: {
						carousel: t("Carousel"),
						grid: t("Grid"),
						vertical: t("Vertical scroll"),
					},
					defaultValue: DEFAULT_SETTINGS.dashboardLayout,
				},
			},
			{
				name: t("Cards per view"),
				desc: t(
					"How many habit cards fit side by side on wider screens.",
				),
				control: {
					type: "dropdown",
					key: "cardsPerView",
					options: { "1": "1", "2": "2", "3": "3", "4": "4" },
					defaultValue: String(DEFAULT_SETTINGS.cardsPerView),
				},
			},
			{
				name: t("Cards per view on mobile"),
				desc: t(
					"How many habit cards fit side by side on phone-sized screens.",
				),
				control: {
					type: "dropdown",
					key: "mobileCardsPerView",
					options: { "1": "1", "2": "2" },
					defaultValue: String(DEFAULT_SETTINGS.mobileCardsPerView),
				},
			},
			{
				name: t("Stats page carousel"),
				desc: t(
					"Show the per-habit stats as pages you can flip through instead of one long list.",
				),
				control: {
					type: "toggle",
					key: "statsCarousel",
					defaultValue: DEFAULT_SETTINGS.statsCarousel,
				},
			},
			{
				name: t("Stats rows per page"),
				desc: t("How many habits each stats page shows."),
				visible: () => this.plugin.settings.statsCarousel,
				control: {
					type: "dropdown",
					key: "statsRowsPerPage",
					options: {
						"1": "1",
						"2": "2",
						"3": "3",
						"4": "4",
						"5": "5",
						"6": "6",
						"7": "7",
						"8": "8",
					},
					defaultValue: String(DEFAULT_SETTINGS.statsRowsPerPage),
				},
			},
			{
				type: "group",
				heading: t("Experimental"),
				items: [
					{
						name: "",
						desc: t(
							"These features are still being tested and may change before they become permanent. Turning one off only hides it from menus — anything you created with it keeps working.",
						),
						searchable: false,
					},
					{
						name: t("Break bad habits"),
						desc: t(
							"Track habits you want to reduce or avoid by staying under a daily limit — for example at most 2 hours of gaming, or no smoking at all.",
						),
						control: {
							type: "toggle",
							key: "experimental.limitHabits",
							defaultValue: DEFAULT_EXPERIMENTAL.limitHabits,
						},
					},
					{
						name: t("AI summaries"),
						desc: t(
							"Show an AI-generated summary with feedback and advice on the stats page tabs. Uses an OpenAI-compatible service you configure below; your habit stats are sent to it only when you press the generate button.",
						),
						control: {
							type: "toggle",
							key: "experimental.aiSummaries",
							defaultValue: DEFAULT_EXPERIMENTAL.aiSummaries,
						},
					},
					{
						name: t("AI base URL"),
						desc: t(
							"Base URL of an OpenAI-compatible API. Works with OpenAI, OpenRouter, or local servers like Ollama (http://localhost:11434/v1).",
						),
						visible: aiSummariesOn,
						control: {
							type: "text",
							key: "aiSummary.baseUrl",
							placeholder: DEFAULT_AI_SUMMARY.baseUrl,
							defaultValue: DEFAULT_AI_SUMMARY.baseUrl,
						},
					},
					{
						name: t("AI API key"),
						desc: t(
							"Stored locally in this vault's plugin data. Leave blank for local servers that need no key.",
						),
						visible: aiSummariesOn,
						// A masked input; the declarative text control has no
						// password variant, so this row renders imperatively.
						render: (setting: Setting) => {
							setting.addText((text) => {
								text.inputEl.type = "password";
								text
									.setValue(
										this.plugin.settings.aiSummary.apiKey,
									)
									.onChange(async (value) => {
										this.plugin.settings.aiSummary.apiKey =
											value.trim();
										await this.plugin.saveSettings();
									});
							});
						},
					},
					{
						name: t("AI model"),
						desc: t("Model name the service should use."),
						visible: aiSummariesOn,
						control: {
							type: "text",
							key: "aiSummary.model",
							placeholder: DEFAULT_AI_SUMMARY.model,
							defaultValue: DEFAULT_AI_SUMMARY.model,
						},
					},
				],
			},
		];
	}

	/** Read a control's current value from the plugin settings. */
	getControlValue(key: string): unknown {
		const value = getPath(this.plugin.settings, key);
		return NUMERIC_DROPDOWN_KEYS.has(key) ? String(value) : value;
	}

	/** Normalise, store, and persist a control's new value. */
	async setControlValue(key: string, value: unknown): Promise<void> {
		setPath(this.plugin.settings, key, this.normalizeValue(key, value));
		await this.plugin.saveSettings();
		// Re-evaluate `visible` predicates so dependent rows (stats rows
		// per page, the AI connection fields) follow their toggles. Only
		// ever called on the 1.13+ declarative path, but guard anyway to
		// honour the plugin's older minAppVersion.
		if (requireApiVersion("1.13.0")) {
			this.refreshDomState();
		}
	}

	/** Mirror the trims and empty-value fallbacks of the legacy tab. */
	private normalizeValue(key: string, value: unknown): unknown {
		if (NUMERIC_DROPDOWN_KEYS.has(key)) {
			return Number(value);
		}
		if (typeof value !== "string") {
			return value;
		}
		const trimmed = value.trim();
		switch (key) {
			case "dashboardLayout":
				return trimmed === "grid" || trimmed === "vertical"
					? trimmed
					: "carousel";
			case "habitsFolder":
				return trimmed || DEFAULT_SETTINGS.habitsFolder;
			case "dailyNoteDateFormat":
				return trimmed || DEFAULT_SETTINGS.dailyNoteDateFormat;
			case "aiSummary.baseUrl":
				return trimmed || DEFAULT_AI_SUMMARY.baseUrl;
			case "aiSummary.model":
				return trimmed || DEFAULT_AI_SUMMARY.model;
			default:
				return trimmed;
		}
	}

	/** Imperative fallback for Obsidian versions older than 1.13. */
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
			.setName(t("Dashboard layout"))
			.setDesc(
				t(
					"How to move through your habit cards: a paged carousel with arrows, a grid that wraps onto new rows, or a fixed-height grid that scrolls vertically.",
				),
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("carousel", t("Carousel"))
					.addOption("grid", t("Grid"))
					.addOption("vertical", t("Vertical scroll"))
					.setValue(this.plugin.settings.dashboardLayout)
					.onChange(async (value) => {
						this.plugin.settings.dashboardLayout =
							value === "grid" || value === "vertical"
								? value
								: "carousel";
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("Cards per view"))
			.setDesc(
				t(
					"How many habit cards fit side by side on wider screens.",
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
					"How many habit cards fit side by side on phone-sized screens.",
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
