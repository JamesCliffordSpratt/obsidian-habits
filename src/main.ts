import {
	debounce,
	Editor,
	Events,
	Notice,
	Plugin,
	TFile,
	type TAbstractFile,
	type WorkspaceLeaf,
} from "obsidian";
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
	/** Public so the settings tab can list habits for the order editor. */
	store!: HabitStore;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.store = new HabitStore(
			this.app,
			() => this.settings,
			() => this.saveSettings(),
		);

		this.addSettingTab(new HabitsSettingTab(this.app, this));

		// Lets Core Plugins → Page preview offer hover previews for the
		// [[links]] users write in day comments.
		this.registerHoverLinkSource("habits", {
			display: t("Habits"),
			defaultMod: true,
		});

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

		// Keep the manual sort order pointing at the right notes when a
		// habit is renamed or moved.
		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				const index = this.settings.manualOrder.indexOf(oldPath);
				if (index >= 0) {
					this.settings.manualOrder[index] = file.path;
					void this.saveData(this.settings);
				}
			}),
		);

		this.watchComments();

		this.addCommand({
			id: "migrate-comments",
			name: t("Move day comments into note bodies"),
			callback: () => {
				void this.migrateComments();
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

	/**
	 * Day comments live in the note body, which can only be read
	 * asynchronously, so the store caches them. Prime that cache once the
	 * vault is ready and keep it in step with edits from any source —
	 * including the user typing straight into a habit note.
	 */
	private watchComments(): void {
		const notify = debounce(
			() => this.events.trigger("comments-changed"),
			150,
			true,
		);
		const refresh = async (file: TAbstractFile): Promise<void> => {
			if (!(file instanceof TFile) || !this.store.isHabitFile(file.path)) {
				return;
			}
			if (await this.store.refreshComments(file)) {
				notify();
			}
		};

		this.app.workspace.onLayoutReady(() => {
			void this.store.primeComments().then((changed) => {
				if (changed) {
					notify();
				}
			});
		});
		this.registerEvent(
			this.app.vault.on("modify", (file) => void refresh(file)),
		);
		this.registerEvent(
			this.app.vault.on("create", (file) => void refresh(file)),
		);
		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				this.store.forgetComments(file.path);
			}),
		);
		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				this.store.forgetComments(oldPath);
				void refresh(file);
			}),
		);
	}

	/** Bulk-migrate notes still keeping their comments in frontmatter. */
	private async migrateComments(): Promise<void> {
		if (!this.store.hasLegacyComments()) {
			new Notice(t("No comments left to move."));
			return;
		}
		const count = await this.store.migrateComments();
		this.events.trigger("comments-changed");
		new Notice(
			count === 1
				? t("Moved comments in 1 note.")
				: t("Moved comments in {n} notes.", { n: count }),
		);
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
		this.settings.groups = { ...(data?.groups ?? {}) };
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.events.trigger("settings-changed");
	}
}
