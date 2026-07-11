import { Editor, Events, Plugin, type WorkspaceLeaf } from "obsidian";
import { t } from "./i18n";
import { HabitStore } from "./habit-store";
import {
	DEFAULT_AI_SUMMARY,
	DEFAULT_EXPERIMENTAL,
	DEFAULT_SETTINGS,
	HabitsSettingTab,
	type HabitsPluginSettings,
} from "./settings";
import { HabitsDashboard } from "./ui/dashboard";
import { HabitMetrics } from "./ui/habit-metrics";
import { HabitModal } from "./ui/habit-modal";
import { HabitMetricsSuggest } from "./ui/metrics-suggest";
import {
	HABITS_PANEL_VIEW_TYPE,
	HabitsPanelView,
} from "./ui/panel-view";

export default class HabitsPlugin extends Plugin {
	settings: HabitsPluginSettings = DEFAULT_SETTINGS;
	/** Plugin-internal event bus (e.g. "settings-changed"). */
	readonly events = new Events();
	private store!: HabitStore;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.store = new HabitStore(this.app, () => this.settings);

		this.addSettingTab(new HabitsSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("habits", (_source, el, ctx) => {
			const dashboard = new HabitsDashboard(
				this.app,
				this.store,
				() => this.settings,
				this.events,
				ctx.sourcePath,
				el,
			);
			ctx.addChild(dashboard);
		});

		this.registerMarkdownCodeBlockProcessor(
			"habit-metrics",
			(source, el, ctx) => {
				ctx.addChild(
					new HabitMetrics(
						this.app,
						this.store,
						ctx.sourcePath,
						source,
						el,
					),
				);
			},
		);

		this.registerEditorSuggest(
			new HabitMetricsSuggest(this.app, this.store),
		);

		this.registerView(
			HABITS_PANEL_VIEW_TYPE,
			(leaf) =>
				new HabitsPanelView(
					leaf,
					this.store,
					() => this.settings,
					this.events,
				),
		);

		this.addRibbonIcon("list-checks", t("Open habits panel"), () => {
			void this.activatePanel();
		});

		this.addCommand({
			id: "open-panel",
			name: t("Open panel"),
			callback: () => {
				void this.activatePanel();
			},
		});

		this.addCommand({
			id: "create-habit",
			name: t("Create habit"),
			callback: () => {
				new HabitModal(
					this.app,
					this.store,
					() => {
						// The dashboard reloads itself when reopened.
					},
					null,
					this.settings.experimental.limitHabits,
				).open();
			},
		});

		this.addCommand({
			id: "insert-dashboard",
			name: t("Insert dashboard"),
			editorCallback: (editor: Editor) => {
				editor.replaceSelection("```habits\n```\n");
			},
		});

		this.addCommand({
			id: "insert-habit-metrics",
			name: t("Insert habit metrics"),
			editorCallback: (editor: Editor) => {
				editor.replaceSelection("```habit-metrics\n```\n");
			},
		});
	}

	/** Open (or reveal) the habits panel in the right sidebar. */
	private async activatePanel(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(
			HABITS_PANEL_VIEW_TYPE,
		);
		let leaf: WorkspaceLeaf | null = existing[0] ?? null;
		if (!leaf) {
			leaf = this.app.workspace.getRightLeaf(false);
			if (!leaf) {
				return;
			}
			await leaf.setViewState({
				type: HABITS_PANEL_VIEW_TYPE,
				active: true,
			});
		}
		await this.app.workspace.revealLeaf(leaf);
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as
			| Partial<HabitsPluginSettings>
			| null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
		// Merge nested experimental flags so a data.json saved before a new
		// flag existed still picks up that flag's default.
		this.settings.experimental = {
			...DEFAULT_EXPERIMENTAL,
			...(data?.experimental ?? {}),
		};
		this.settings.aiSummary = {
			...DEFAULT_AI_SUMMARY,
			...(data?.aiSummary ?? {}),
		};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.events.trigger("settings-changed");
	}
}
