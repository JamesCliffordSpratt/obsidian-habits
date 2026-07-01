import { Editor, Plugin } from "obsidian";
import { HabitStore } from "./habit-store";
import {
	DEFAULT_SETTINGS,
	HabitsSettingTab,
	type HabitsPluginSettings,
} from "./settings";
import { HabitsDashboard } from "./ui/dashboard";
import { HabitModal } from "./ui/habit-modal";

export default class HabitsPlugin extends Plugin {
	settings: HabitsPluginSettings = DEFAULT_SETTINGS;
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
				el,
			);
			ctx.addChild(dashboard);
		});

		this.addCommand({
			id: "create-habit",
			name: "Create habit",
			callback: () => {
				new HabitModal(this.app, this.store, () => {
					// The dashboard reloads itself when reopened.
				}).open();
			},
		});

		this.addCommand({
			id: "insert-dashboard",
			name: "Insert dashboard",
			editorCallback: (editor: Editor) => {
				editor.replaceSelection("```habits\n```\n");
			},
		});
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as
			| Partial<HabitsPluginSettings>
			| null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
