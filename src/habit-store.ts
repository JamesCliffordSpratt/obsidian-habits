import { App, normalizePath, Notice, TFile, TFolder } from "obsidian";
import type { HabitsPluginSettings } from "./settings";
import type { HabitDefinition, HabitType, NewHabitOptions } from "./types";
import { sanitizeFileName, toDateKey } from "./utils";

const HABIT_TYPES: readonly HabitType[] = ["binary", "repetition", "timed"];

function isHabitType(value: unknown): value is HabitType {
	return (
		typeof value === "string" &&
		(HABIT_TYPES as readonly string[]).includes(value)
	);
}

/**
 * Reads and writes habit notes in the configured folder.
 *
 * Each habit is a single note whose frontmatter defines it and whose `records`
 * map stores the value logged for each day.
 */
export class HabitStore {
	constructor(
		private app: App,
		private getSettings: () => HabitsPluginSettings,
	) {}

	private get folderPath(): string {
		return normalizePath(this.getSettings().habitsFolder);
	}

	/** Create the habits folder if it does not already exist. */
	async ensureFolderExists(): Promise<void> {
		const existing = this.app.vault.getAbstractFileByPath(this.folderPath);
		if (existing instanceof TFolder) {
			return;
		}
		await this.app.vault.createFolder(this.folderPath);
	}

	/** Return every habit defined in the folder, sorted by name. */
	getHabits(): HabitDefinition[] {
		const folder = this.app.vault.getAbstractFileByPath(this.folderPath);
		if (!(folder instanceof TFolder)) {
			return [];
		}

		const habits: HabitDefinition[] = [];
		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === "md") {
				const habit = this.parseFile(child);
				if (habit) {
					habits.push(habit);
				}
			}
		}

		habits.sort((a, b) => a.name.localeCompare(b.name));
		return habits;
	}

	private parseFile(file: TFile): HabitDefinition | null {
		const cache = this.app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter;
		if (!fm || !isHabitType(fm.type)) {
			return null;
		}

		return {
			path: file.path,
			name: file.basename,
			type: fm.type,
			target: this.readNumber(fm.target, 1),
			unit: typeof fm.unit === "string" ? fm.unit : "",
			icon: typeof fm.icon === "string" ? fm.icon : "",
			color: typeof fm.color === "string" ? fm.color : "",
			startDate: typeof fm.startDate === "string" ? fm.startDate : "",
			records: this.readRecords(fm.records),
		};
	}

	private readNumber(value: unknown, fallback: number): number {
		if (typeof value === "number" && Number.isFinite(value)) {
			return value;
		}
		if (typeof value === "string") {
			const parsed = Number(value);
			if (Number.isFinite(parsed)) {
				return parsed;
			}
		}
		return fallback;
	}

	private readRecords(raw: unknown): Record<string, number> {
		const records: Record<string, number> = {};
		if (raw && typeof raw === "object") {
			for (const [key, value] of Object.entries(
				raw as Record<string, unknown>,
			)) {
				if (typeof value === "number") {
					records[key] = value;
				} else if (typeof value === "boolean") {
					records[key] = value ? 1 : 0;
				} else if (typeof value === "string" && value.trim() !== "") {
					const parsed = Number(value);
					if (Number.isFinite(parsed)) {
						records[key] = parsed;
					}
				}
			}
		}
		return records;
	}

	private fileForHabit(habit: HabitDefinition): TFile | null {
		const file = this.app.vault.getAbstractFileByPath(habit.path);
		return file instanceof TFile ? file : null;
	}

	/**
	 * Record `value` for `habit` on the day identified by `dateKey`.
	 *
	 * A value of zero or less removes the entry to keep the frontmatter tidy.
	 */
	async setRecord(
		habit: HabitDefinition,
		dateKey: string,
		value: number,
	): Promise<void> {
		const file = this.fileForHabit(habit);
		if (!file) {
			new Notice(`Could not find the note for "${habit.name}".`);
			return;
		}

		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const fm = frontmatter as Record<string, unknown>;
			const records =
				fm.records && typeof fm.records === "object"
					? (fm.records as Record<string, number>)
					: {};
			if (value > 0) {
				records[dateKey] = value;
			} else {
				delete records[dateKey];
			}
			fm.records = records;
		});
	}

	/** Create a new habit note and return the created file. */
	async createHabit(options: NewHabitOptions): Promise<TFile | null> {
		const cleanName = sanitizeFileName(options.name);
		if (!cleanName) {
			new Notice("Please enter a valid habit name.");
			return null;
		}

		await this.ensureFolderExists();
		const path = normalizePath(`${this.folderPath}/${cleanName}.md`);
		if (this.app.vault.getAbstractFileByPath(path)) {
			new Notice(`A habit called "${cleanName}" already exists.`);
			return null;
		}

		const body = `# ${cleanName}\n\nThis note is managed by the Habits plugin.\n`;
		const file = await this.app.vault.create(path, body);

		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const fm = frontmatter as Record<string, unknown>;
			fm.habit = true;
			fm.type = options.type;
			if (options.type !== "binary") {
				fm.target = options.target;
			}
			if (options.unit) {
				fm.unit = options.unit;
			}
			if (options.icon) {
				fm.icon = options.icon;
			}
			if (options.color) {
				fm.color = options.color;
			}
			fm.startDate = toDateKey(new Date());
			fm.records = {};
		});

		new Notice(`Created habit "${cleanName}".`);
		return file;
	}

	/** Update an existing habit's definition, renaming its note if needed. */
	async updateHabit(
		habit: HabitDefinition,
		options: NewHabitOptions,
	): Promise<TFile | null> {
		let file = this.fileForHabit(habit);
		if (!file) {
			new Notice(`Could not find the note for "${habit.name}".`);
			return null;
		}

		const cleanName = sanitizeFileName(options.name);
		if (!cleanName) {
			new Notice("Please enter a valid habit name.");
			return null;
		}

		if (cleanName !== habit.name) {
			const newPath = normalizePath(`${this.folderPath}/${cleanName}.md`);
			if (this.app.vault.getAbstractFileByPath(newPath)) {
				new Notice(`A habit called "${cleanName}" already exists.`);
				return null;
			}
			await this.app.fileManager.renameFile(file, newPath);
			const renamed = this.app.vault.getAbstractFileByPath(newPath);
			if (renamed instanceof TFile) {
				file = renamed;
			}
		}

		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const fm = frontmatter as Record<string, unknown>;
			fm.habit = true;
			fm.type = options.type;
			if (options.type === "binary") {
				delete fm.target;
			} else {
				fm.target = options.target;
			}
			if (options.unit) {
				fm.unit = options.unit;
			} else {
				delete fm.unit;
			}
			if (options.icon) {
				fm.icon = options.icon;
			} else {
				delete fm.icon;
			}
			if (options.color) {
				fm.color = options.color;
			} else {
				delete fm.color;
			}
		});

		new Notice(`Updated "${cleanName}".`);
		return file;
	}

	/** Move a habit's note to the trash (respecting the user's settings). */
	async deleteHabit(habit: HabitDefinition): Promise<void> {
		const file = this.fileForHabit(habit);
		if (!file) {
			new Notice(`Could not find the note for "${habit.name}".`);
			return;
		}
		await this.app.fileManager.trashFile(file);
		new Notice(`Removed "${habit.name}".`);
	}
}
