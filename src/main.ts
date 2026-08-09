import {
	debounce,
	Editor,
	Events,
	Notice,
	normalizePath,
	Plugin,
	TFile,
	type TAbstractFile,
	type WorkspaceLeaf,
} from "obsidian";
import { t } from "./i18n";
import { HabitStore } from "./habit-store";
import { ReminderSync } from "./reminders";
import {
	DEFAULT_AI_SUMMARY,
	DEFAULT_EXPERIMENTAL,
	DEFAULT_REMINDERS,
	DEFAULT_SETTINGS,
	HabitsSettingTab,
	type HabitsPluginSettings,
} from "./settings";
import { HabitsDashboard } from "./ui/dashboard";
import { HabitMetrics } from "./ui/habit-metrics";
import { HabitsTable } from "./ui/habits-table";
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

		this.registerMarkdownCodeBlockProcessor(
			"habits-table",
			(_source, el, ctx) => {
				ctx.addChild(
					new HabitsTable(
						this.app,
						this.store,
						() => this.settings,
						this.events,
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

		this.addCommand({
			id: "insert-table",
			name: t("Insert habits table"),
			editorCallback: (editor: Editor) => {
				editor.replaceSelection("```habits-table\n```\n");
			},
		});

		this.registerReminderSync();
	}

	/**
	 * Keep the reminder block in step with the habits: regenerate it when
	 * the plugin loads, when a habit note changes, when settings change,
	 * when the target daily note is created, and when the day rolls over
	 * (so the new day's note gets its block without a restart).
	 */
	private registerReminderSync(): void {
		const sync = new ReminderSync(this.app, this.store, () => this.settings);
		const requestUpdate = debounce(() => void sync.update(), 1000, true);

		const isHabitFile = (path: string): boolean => {
			const folder = normalizePath(this.settings.habitsFolder);
			return path === folder || path.startsWith(`${folder}/`);
		};

		this.app.workspace.onLayoutReady(() => requestUpdate());
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				// The target note matters too: ticking a reminder line
				// there (by hand or from a notification) logs the habit.
				if (
					isHabitFile(file.path) ||
					file.path === sync.targetPath(new Date())
				) {
					requestUpdate();
				}
			}),
		);
		this.registerEvent(
			this.app.vault.on("create", (file) => {
				// A new habit, or the target note appearing (e.g. today's
				// daily note being created after the plugin loaded).
				if (
					isHabitFile(file.path) ||
					file.path === sync.targetPath(new Date())
				) {
					requestUpdate();
				}
			}),
		);
		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (isHabitFile(file.path)) {
					requestUpdate();
				}
			}),
		);
		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (isHabitFile(file.path) || isHabitFile(oldPath)) {
					requestUpdate();
				}
			}),
		);
		this.registerEvent(
			this.events.on("settings-changed", () => requestUpdate()),
		);

		// Day rollover: a minute-level check is cheap and avoids the drift
		// and DST pitfalls of scheduling one long timeout for midnight.
		let currentDay = new Date().toDateString();
		this.registerInterval(
			window.setInterval(() => {
				const day = new Date().toDateString();
				if (day !== currentDay) {
					currentDay = day;
					requestUpdate();
				}
			}, 60_000),
		);
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
		this.settings.reminders = {
			...DEFAULT_REMINDERS,
			...(data?.reminders ?? {}),
		};
		this.settings.groups = { ...(data?.groups ?? {}) };
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.events.trigger("settings-changed");
	}
}
