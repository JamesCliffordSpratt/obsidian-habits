import { App, normalizePath, Notice, TFile, TFolder } from "obsidian";
import type { HabitsPluginSettings } from "./settings";
import type {
	HabitDefinition,
	HabitFrequency,
	HabitPause,
	HabitType,
	NewHabitOptions,
} from "./types";
import { addDays, sanitizeFileName, toDateKey } from "./utils";
import { t } from "./i18n";

const HABIT_TYPES: readonly HabitType[] = ["binary", "repetition", "timed"];
const HABIT_FREQUENCIES: readonly HabitFrequency[] = [
	"daily",
	"weekly",
	"monthly",
];

function isHabitType(value: unknown): value is HabitType {
	return (
		typeof value === "string" &&
		(HABIT_TYPES as readonly string[]).includes(value)
	);
}

function isHabitFrequency(value: unknown): value is HabitFrequency {
	return (
		typeof value === "string" &&
		(HABIT_FREQUENCIES as readonly string[]).includes(value)
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

		const pauses = this.readPauses(fm.pauses);
		return {
			path: file.path,
			name: file.basename,
			type: fm.type,
			frequency: isHabitFrequency(fm.frequency)
				? fm.frequency
				: "daily",
			weekday: this.clampInt(this.readNumber(fm.weekday, 1), 0, 6),
			monthDay: this.clampInt(this.readNumber(fm.monthDay, 1), 1, 31),
			target: this.readNumber(fm.target, 1),
			unit: typeof fm.unit === "string" ? fm.unit : "",
			weeklyTarget: this.readNumber(fm.weeklyTarget, 0),
			monthlyTarget: this.readNumber(fm.monthlyTarget, 0),
			weeklyPerfect: fm.weeklyPerfect === true,
			monthlyPerfect: fm.monthlyPerfect === true,
			icon: typeof fm.icon === "string" ? fm.icon : "",
			color: typeof fm.color === "string" ? fm.color : "",
			startDate: typeof fm.startDate === "string" ? fm.startDate : "",
			paused: pauses.some((pause) => pause.end === ""),
			pauses,
			stopped: fm.stopped === true,
			stopDate: typeof fm.stopDate === "string" ? fm.stopDate : "",
			records: this.readRecords(fm.records),
			comments: this.readComments(fm.comments),
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

	/** Round to a whole number and constrain it to an inclusive range. */
	private clampInt(value: number, min: number, max: number): number {
		return Math.min(max, Math.max(min, Math.round(value)));
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

	/** Parse the frontmatter `comments` map, dropping empty entries. */
	private readComments(raw: unknown): Record<string, string> {
		const comments: Record<string, string> = {};
		if (raw && typeof raw === "object") {
			for (const [key, value] of Object.entries(
				raw as Record<string, unknown>,
			)) {
				if (typeof value === "string" && value.trim() !== "") {
					comments[key] = value;
				}
			}
		}
		return comments;
	}

	/** Parse the frontmatter `pauses` array, dropping malformed entries. */
	private readPauses(raw: unknown): HabitPause[] {
		if (!Array.isArray(raw)) {
			return [];
		}
		const pauses: HabitPause[] = [];
		for (const item of raw) {
			if (!item || typeof item !== "object") {
				continue;
			}
			const entry = item as Record<string, unknown>;
			if (typeof entry.start !== "string" || entry.start === "") {
				continue;
			}
			pauses.push({
				start: entry.start,
				end: typeof entry.end === "string" ? entry.end : "",
			});
		}
		return pauses;
	}

	/** Close any open pause as of yesterday; drop it if it covered no days. */
	private closeOpenPause(pauses: HabitPause[]): HabitPause[] {
		const yesterday = toDateKey(addDays(new Date(), -1));
		const closed: HabitPause[] = [];
		for (const pause of pauses) {
			if (pause.end !== "") {
				closed.push(pause);
			} else if (pause.start <= yesterday) {
				closed.push({ start: pause.start, end: yesterday });
			}
			// An open pause that started today covered no full day; drop it.
		}
		return closed;
	}

	/** Frontmatter form of pauses: open pauses omit the `end` key. */
	private serializePauses(
		pauses: HabitPause[],
	): { start: string; end?: string }[] {
		return pauses.map((pause) =>
			pause.end === ""
				? { start: pause.start }
				: { start: pause.start, end: pause.end },
		);
	}

	/**
	 * Write the frequency fields to frontmatter, keeping it tidy: daily habits
	 * store nothing (it is the default), and only the field relevant to the
	 * chosen frequency is kept so stale keys never linger after a change.
	 */
	private writeFrequency(
		fm: Record<string, unknown>,
		options: NewHabitOptions,
	): void {
		if (options.frequency === "weekly") {
			fm.frequency = "weekly";
			fm.weekday = this.clampInt(options.weekday, 0, 6);
			delete fm.monthDay;
		} else if (options.frequency === "monthly") {
			fm.frequency = "monthly";
			fm.monthDay = this.clampInt(options.monthDay, 1, 31);
			delete fm.weekday;
		} else {
			delete fm.frequency;
			delete fm.weekday;
			delete fm.monthDay;
		}
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
			new Notice(
				t('Could not find the note for "{name}".', {
					name: habit.name,
				}),
			);
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

	/** Save (or clear) the comment for a habit on the given day. */
	async setComment(
		habit: HabitDefinition,
		dateKey: string,
		text: string,
	): Promise<void> {
		const file = this.fileForHabit(habit);
		if (!file) {
			new Notice(
				t('Could not find the note for "{name}".', {
					name: habit.name,
				}),
			);
			return;
		}
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const fm = frontmatter as Record<string, unknown>;
			const comments =
				fm.comments && typeof fm.comments === "object"
					? (fm.comments as Record<string, string>)
					: {};
			if (text) {
				comments[dateKey] = text;
			} else {
				delete comments[dateKey];
			}
			if (Object.keys(comments).length > 0) {
				fm.comments = comments;
			} else {
				delete fm.comments;
			}
		});
	}

	/** Pause a habit from today. Paused days are skipped by streaks/stats. */
	async pauseHabit(habit: HabitDefinition): Promise<void> {
		const file = this.fileForHabit(habit);
		if (!file) {
			new Notice(
				t('Could not find the note for "{name}".', {
					name: habit.name,
				}),
			);
			return;
		}
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const fm = frontmatter as Record<string, unknown>;
			const pauses = this.readPauses(fm.pauses);
			if (pauses.some((pause) => pause.end === "")) {
				return;
			}
			pauses.push({ start: toDateKey(new Date()), end: "" });
			fm.pauses = this.serializePauses(pauses);
		});
		new Notice(t('Paused "{name}".', { name: habit.name }));
	}

	/** Resume a paused habit; the pause period stays excluded from stats. */
	async resumeHabit(habit: HabitDefinition): Promise<void> {
		const file = this.fileForHabit(habit);
		if (!file) {
			new Notice(
				t('Could not find the note for "{name}".', {
					name: habit.name,
				}),
			);
			return;
		}
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const fm = frontmatter as Record<string, unknown>;
			const pauses = this.closeOpenPause(this.readPauses(fm.pauses));
			if (pauses.length > 0) {
				fm.pauses = this.serializePauses(pauses);
			} else {
				delete fm.pauses;
			}
		});
		new Notice(t('Resumed "{name}".', { name: habit.name }));
	}

	/** Stop tracking a habit. The note and every record are kept. */
	async stopHabit(habit: HabitDefinition): Promise<void> {
		const file = this.fileForHabit(habit);
		if (!file) {
			new Notice(
				t('Could not find the note for "{name}".', {
					name: habit.name,
				}),
			);
			return;
		}
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const fm = frontmatter as Record<string, unknown>;
			fm.stopped = true;
			fm.stopDate = toDateKey(new Date());
			const pauses = this.closeOpenPause(this.readPauses(fm.pauses));
			if (pauses.length > 0) {
				fm.pauses = this.serializePauses(pauses);
			} else {
				delete fm.pauses;
			}
		});
		new Notice(
			t('Stopped tracking "{name}". Its history is kept in the note.', {
				name: habit.name,
			}),
		);
	}

	/** Resume tracking a previously stopped habit. */
	async restartHabit(habit: HabitDefinition): Promise<void> {
		const file = this.fileForHabit(habit);
		if (!file) {
			new Notice(
				t('Could not find the note for "{name}".', {
					name: habit.name,
				}),
			);
			return;
		}
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const fm = frontmatter as Record<string, unknown>;
			delete fm.stopped;
			delete fm.stopDate;
		});
		new Notice(t('Resumed tracking "{name}".', { name: habit.name }));
	}

	/** Create a new habit note and return the created file. */
	async createHabit(options: NewHabitOptions): Promise<TFile | null> {
		const cleanName = sanitizeFileName(options.name);
		if (!cleanName) {
			new Notice(t("Please enter a valid habit name."));
			return null;
		}

		await this.ensureFolderExists();
		const path = normalizePath(`${this.folderPath}/${cleanName}.md`);
		if (this.app.vault.getAbstractFileByPath(path)) {
			new Notice(
				t('A habit called "{name}" already exists.', {
					name: cleanName,
				}),
			);
			return null;
		}

		const body = [
			`# ${cleanName}`,
			"",
			"This note is managed by the Habits plugin.",
			"",
			"## Metrics",
			"",
			"```habit-metrics",
			"```",
			"",
		].join("\n");
		const file = await this.app.vault.create(path, body);

		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const fm = frontmatter as Record<string, unknown>;
			fm.habit = true;
			fm.type = options.type;
			this.writeFrequency(fm, options);
			if (options.type !== "binary") {
				fm.target = options.target;
			}
			if (options.unit) {
				fm.unit = options.unit;
			}
			if (options.weeklyPerfect) {
				fm.weeklyPerfect = true;
			} else if (options.weeklyTarget > 0) {
				fm.weeklyTarget = options.weeklyTarget;
			}
			if (options.monthlyPerfect) {
				fm.monthlyPerfect = true;
			} else if (options.monthlyTarget > 0) {
				fm.monthlyTarget = options.monthlyTarget;
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

		new Notice(t('Created habit "{name}".', { name: cleanName }));
		return file;
	}

	/** Update an existing habit's definition, renaming its note if needed. */
	async updateHabit(
		habit: HabitDefinition,
		options: NewHabitOptions,
	): Promise<TFile | null> {
		let file = this.fileForHabit(habit);
		if (!file) {
			new Notice(
				t('Could not find the note for "{name}".', {
					name: habit.name,
				}),
			);
			return null;
		}

		const cleanName = sanitizeFileName(options.name);
		if (!cleanName) {
			new Notice(t("Please enter a valid habit name."));
			return null;
		}

		if (cleanName !== habit.name) {
			const newPath = normalizePath(`${this.folderPath}/${cleanName}.md`);
			if (this.app.vault.getAbstractFileByPath(newPath)) {
				new Notice(
				t('A habit called "{name}" already exists.', {
					name: cleanName,
				}),
			);
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
			this.writeFrequency(fm, options);
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
			if (options.weeklyPerfect) {
				fm.weeklyPerfect = true;
				delete fm.weeklyTarget;
			} else {
				delete fm.weeklyPerfect;
				if (options.weeklyTarget > 0) {
					fm.weeklyTarget = options.weeklyTarget;
				} else {
					delete fm.weeklyTarget;
				}
			}
			if (options.monthlyPerfect) {
				fm.monthlyPerfect = true;
				delete fm.monthlyTarget;
			} else {
				delete fm.monthlyPerfect;
				if (options.monthlyTarget > 0) {
					fm.monthlyTarget = options.monthlyTarget;
				} else {
					delete fm.monthlyTarget;
				}
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

		new Notice(t('Updated "{name}".', { name: cleanName }));
		return file;
	}

	/** Move a habit's note to the trash (respecting the user's settings). */
	async deleteHabit(habit: HabitDefinition): Promise<void> {
		const file = this.fileForHabit(habit);
		if (!file) {
			new Notice(
				t('Could not find the note for "{name}".', {
					name: habit.name,
				}),
			);
			return;
		}
		await this.app.fileManager.trashFile(file);
		new Notice(t('Removed "{name}".', { name: habit.name }));
	}
}
