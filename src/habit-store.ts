import { App, normalizePath, Notice, TFile, TFolder } from "obsidian";
import type { HabitsPluginSettings } from "./settings";
import type {
	GroupStyle,
	HabitDefinition,
	HabitFrequency,
	HabitPause,
	HabitType,
	NewHabitOptions,
	NoteCompletionMode,
} from "./types";
import { addDays, sanitizeFileName, toDateKey } from "./utils";
import { tagsInComments } from "./comment-text";
import { applyCommentLog, parseCommentLog } from "./comment-log";
import { t } from "./i18n";
import { DEFAULT_NOTE_FILENAME_FORMAT } from "./note-habit";

const HABIT_TYPES: readonly HabitType[] = [
	"binary",
	"repetition",
	"timed",
	"note",
];
const HABIT_FREQUENCIES: readonly HabitFrequency[] = [
	"daily",
	"weekly",
	"monthly",
	"interval",
];
const NOTE_COMPLETION_MODES: readonly NoteCompletionMode[] = [
	"chars",
	"checklist",
];

function isHabitType(value: unknown): value is HabitType {
	return (
		typeof value === "string" &&
		(HABIT_TYPES as readonly string[]).includes(value)
	);
}

function isNoteCompletionMode(value: unknown): value is NoteCompletionMode {
	return (
		typeof value === "string" &&
		(NOTE_COMPLETION_MODES as readonly string[]).includes(value)
	);
}

function isHabitFrequency(value: unknown): value is HabitFrequency {
	return (
		typeof value === "string" &&
		(HABIT_FREQUENCIES as readonly string[]).includes(value)
	);
}

/** Shallow equality for a day-keyed comment map. */
function sameComments(
	a: Record<string, string>,
	b: Record<string, string>,
): boolean {
	const keys = Object.keys(a);
	return (
		keys.length === Object.keys(b).length &&
		keys.every((key) => a[key] === b[key])
	);
}

/**
 * Reads and writes habit notes in the configured folder.
 *
 * Each habit is a single note whose frontmatter defines it and whose `records`
 * map stores the value logged for each day.
 */
export class HabitStore {
	/**
	 * Day comments read from each note's body, keyed by note path.
	 *
	 * The body can only be read asynchronously, but `getHabits` is
	 * synchronous and called on every render, so the text is cached here
	 * and refreshed whenever a habit note changes on disk.
	 */
	private commentCache = new Map<string, Record<string, string>>();

	constructor(
		private app: App,
		private getSettings: () => HabitsPluginSettings,
		private saveSettings: () => Promise<void>,
	) {}

	/** True when the path lives inside the configured habits folder. */
	isHabitFile(path: string): boolean {
		const folder = this.folderPath;
		return path === folder || path.startsWith(`${folder}/`);
	}

	/**
	 * Read every habit note's comment section into the cache. Returns true
	 * when anything changed, so the caller can refresh open views.
	 */
	async primeComments(): Promise<boolean> {
		let changed = false;
		for (const file of this.habitFiles()) {
			changed = (await this.refreshComments(file)) || changed;
		}
		return changed;
	}

	/** Re-read one note's comment section. Returns true when it changed. */
	async refreshComments(file: TFile): Promise<boolean> {
		const content = await this.app.vault.cachedRead(file);
		return this.putComments(file.path, parseCommentLog(content));
	}

	/** Drop a note from the cache, e.g. after a delete or rename. */
	forgetComments(path: string): void {
		this.commentCache.delete(path);
	}

	/** Store parsed comments, reporting whether they differ from the cache. */
	private putComments(
		path: string,
		comments: Record<string, string>,
	): boolean {
		const previous = this.commentCache.get(path);
		if (previous && sameComments(previous, comments)) {
			return false;
		}
		if (Object.keys(comments).length === 0) {
			this.commentCache.delete(path);
			return previous !== undefined;
		}
		this.commentCache.set(path, comments);
		return true;
	}

	private get folderPath(): string {
		return normalizePath(this.getSettings().habitsFolder);
	}

	/** Shared styling (colour, icon) for a group, if any is stored. */
	getGroupStyle(name: string): GroupStyle | undefined {
		return this.getSettings().groups[name.trim()];
	}

	/**
	 * Store or clear a group's shared styling. Passing a style with no
	 * colour and no icon (or `null`) removes the entry.
	 */
	async setGroupStyle(
		name: string,
		style: GroupStyle | null,
	): Promise<void> {
		const key = name.trim();
		if (!key) {
			return;
		}
		const groups = this.getSettings().groups;
		const existing = groups[key];
		if (style && (style.color || style.icon)) {
			if (
				existing &&
				existing.color === style.color &&
				existing.icon === style.icon
			) {
				return;
			}
			groups[key] = { color: style.color, icon: style.icon };
		} else {
			if (!existing) {
				return;
			}
			delete groups[key];
		}
		await this.saveSettings();
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
		const habits: HabitDefinition[] = [];
		for (const file of this.habitFiles()) {
			const habit = this.parseFile(file);
			if (habit) {
				habits.push(habit);
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
			goalDirection: fm.goalDirection === "max" ? "max" : "min",
			frequency: isHabitFrequency(fm.frequency)
				? fm.frequency
				: "daily",
			weekdays: this.readWeekdays(fm.weekdays, fm.weekday),
			monthDay: this.clampInt(this.readNumber(fm.monthDay, 1), 1, 31),
			intervalDays: this.clampInt(
				this.readNumber(fm.intervalDays, 2),
				2,
				365,
			),
			times: this.readTimes(fm.times, fm.time),
			target: this.readNumber(fm.target, 1),
			unit: typeof fm.unit === "string" ? fm.unit : "",
			weeklyTarget: this.readNumber(fm.weeklyTarget, 0),
			monthlyTarget: this.readNumber(fm.monthlyTarget, 0),
			weeklyPerfect: fm.weeklyPerfect === true,
			monthlyPerfect: fm.monthlyPerfect === true,
			icon: typeof fm.icon === "string" ? fm.icon : "",
			color: typeof fm.color === "string" ? fm.color : "",
			group: typeof fm.group === "string" ? fm.group : "",
			useGroupColor: fm.useGroupColor === true,
			startDate: typeof fm.startDate === "string" ? fm.startDate : "",
			paused: pauses.some((pause) => pause.end === ""),
			pauses,
			stopped: fm.stopped === true,
			stopDate: typeof fm.stopDate === "string" ? fm.stopDate : "",
			records: this.readRecords(fm.records),
			// Notes written before comments moved into the body still keep
			// them in frontmatter; the body wins where both exist.
			comments: {
				...this.readComments(fm.comments),
				...(this.commentCache.get(file.path) ?? {}),
			},
			noteFolder:
				typeof fm.noteFolder === "string" ? fm.noteFolder : "",
			noteFilenameFormat:
				typeof fm.noteFilenameFormat === "string"
					? fm.noteFilenameFormat
					: "",
			templatePath:
				typeof fm.templatePath === "string" ? fm.templatePath : "",
			noteCompletionMode: isNoteCompletionMode(fm.noteCompletionMode)
				? fm.noteCompletionMode
				: "chars",
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

	/**
	 * Parse a weekly habit's due days: the `weekdays` list when present,
	 * otherwise the original scalar `weekday`. Values are clamped to `0`–`6`,
	 * deduplicated and sorted; with nothing usable the result falls back to
	 * `[1]` (Monday), matching the old scalar default.
	 */
	private readWeekdays(list: unknown, single: unknown): number[] {
		const raw = Array.isArray(list) ? list : [single];
		const days = new Set<number>();
		for (const value of raw) {
			const parsed = this.readNumber(value, NaN);
			if (Number.isFinite(parsed)) {
				days.add(this.clampInt(parsed, 0, 6));
			}
		}
		if (days.size === 0) {
			days.add(1);
		}
		return [...days].sort((a, b) => a - b);
	}

	/**
	 * Parse a single time of day. Anything that isn't a valid `H:mm` or
	 * `HH:mm` string is treated as "no time" rather than an error, and the
	 * hour is zero-padded so times sort and compare as plain strings.
	 */
	private readTime(value: unknown): string {
		if (typeof value !== "string") {
			return "";
		}
		const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
		if (!match) {
			return "";
		}
		return `${match[1].padStart(2, "0")}:${match[2]}`;
	}

	/**
	 * Parse a habit's planned times: the `times` list when present,
	 * otherwise the scalar `time`. Invalid entries are dropped, the rest
	 * deduplicated and sorted chronologically.
	 */
	private readTimes(list: unknown, single: unknown): string[] {
		const raw = Array.isArray(list) ? list : [single];
		const times = new Set<string>();
		for (const value of raw) {
			const parsed = this.readTime(value);
			if (parsed) {
				times.add(parsed);
			}
		}
		return [...times].sort();
	}

	/** Validate, deduplicate and sort a planned-times list. */
	private normalizeTimes(values: string[]): string[] {
		return this.readTimes(values, undefined);
	}

	/** Clamp, deduplicate and sort a weekday list, defaulting to Monday. */
	private normalizeWeekdays(values: number[]): number[] {
		const days = [
			...new Set(values.map((value) => this.clampInt(value, 0, 6))),
		].sort((a, b) => a - b);
		return days.length > 0 ? days : [1];
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
	 * store nothing (it is the default), and only the fields relevant to the
	 * chosen frequency are kept so stale keys never linger after a change.
	 * A weekly habit due on a single day keeps the original scalar `weekday`
	 * form, so notes from before multi-day support are rewritten unchanged.
	 */
	private writeFrequency(
		fm: Record<string, unknown>,
		options: NewHabitOptions,
	): void {
		delete fm.weekday;
		delete fm.weekdays;
		delete fm.monthDay;
		delete fm.intervalDays;
		if (options.frequency === "weekly") {
			fm.frequency = "weekly";
			const days = this.normalizeWeekdays(options.weekdays);
			if (days.length === 1) {
				fm.weekday = days[0];
			} else {
				fm.weekdays = days;
			}
		} else if (options.frequency === "monthly") {
			fm.frequency = "monthly";
			fm.monthDay = this.clampInt(options.monthDay, 1, 31);
		} else if (options.frequency === "interval") {
			fm.frequency = "interval";
			fm.intervalDays = this.clampInt(options.intervalDays, 2, 365);
		} else {
			delete fm.frequency;
		}
	}

	/**
	 * Write the planned times to frontmatter, mirroring the weekday
	 * convention: a single time keeps the scalar `time` form, several use
	 * the `times` list, and none removes both keys.
	 */
	private writeTimes(
		fm: Record<string, unknown>,
		options: NewHabitOptions,
	): void {
		delete fm.time;
		delete fm.times;
		const times = this.normalizeTimes(options.times);
		if (times.length === 1) {
			fm.time = times[0];
		} else if (times.length > 1) {
			fm.times = times;
		}
	}

	/**
	 * Write a `note` habit's folder/filename-format/template/completion-mode
	 * fields, keeping frontmatter tidy: values equal to the default are
	 * omitted, and every field is dropped for other habit types. A blank
	 * folder defaults to a dedicated subfolder of the habits folder, named
	 * after the habit, so every note habit gets a collision-free home
	 * without the user having to think about it.
	 */
	private writeNoteFields(
		fm: Record<string, unknown>,
		options: NewHabitOptions,
		cleanName: string,
	): void {
		delete fm.noteFolder;
		delete fm.noteFilenameFormat;
		delete fm.templatePath;
		delete fm.noteCompletionMode;
		if (options.type !== "note") {
			return;
		}
		fm.noteFolder =
			options.noteFolder.trim() || `${this.folderPath}/${cleanName}`;
		const format = options.noteFilenameFormat.trim();
		if (format && format !== DEFAULT_NOTE_FILENAME_FORMAT) {
			fm.noteFilenameFormat = format;
		}
		if (options.templatePath.trim()) {
			fm.templatePath = options.templatePath.trim();
		}
		if (options.noteCompletionMode === "checklist") {
			fm.noteCompletionMode = "checklist";
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

	/**
	 * Save (or clear) the comment for a habit on the given day.
	 *
	 * Comments are written to the note body so that Obsidian indexes the
	 * `#tags` and `[[links]]` inside them against the day they belong to.
	 * A note still holding comments in frontmatter is migrated on the same
	 * pass, so no separate upgrade step is needed.
	 */
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

		const legacy = this.legacyComments(file);
		let written: Record<string, string> = {};
		await this.app.vault.process(file, (content) => {
			const comments = { ...legacy, ...parseCommentLog(content) };
			if (text) {
				comments[dateKey] = text;
			} else {
				delete comments[dateKey];
			}
			written = comments;
			return applyCommentLog(content, comments);
		});
		this.putComments(file.path, written);

		if (Object.keys(legacy).length > 0) {
			await this.clearLegacyComments(file, legacy);
		}
	}

	/** Day comments still stored in a note's frontmatter, if any. */
	private legacyComments(file: TFile): Record<string, string> {
		const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
		return this.readComments(fm?.comments);
	}

	/** True when any habit note still keeps its comments in frontmatter. */
	hasLegacyComments(): boolean {
		return this.habitFiles().some(
			(file) => Object.keys(this.legacyComments(file)).length > 0,
		);
	}

	/**
	 * Move every note's frontmatter comments into its body. Returns how
	 * many notes were changed.
	 */
	async migrateComments(): Promise<number> {
		let migrated = 0;
		for (const file of this.habitFiles()) {
			const legacy = this.legacyComments(file);
			if (Object.keys(legacy).length === 0) {
				continue;
			}
			let written: Record<string, string> = {};
			await this.app.vault.process(file, (content) => {
				written = { ...legacy, ...parseCommentLog(content) };
				return applyCommentLog(content, written);
			});
			this.putComments(file.path, written);
			await this.clearLegacyComments(file, legacy);
			migrated++;
		}
		return migrated;
	}

	/**
	 * Drop the frontmatter `comments` key once its contents live in the
	 * body, along with any tags an earlier version mirrored into `tags` —
	 * the body now supplies those to Obsidian's index directly.
	 */
	private async clearLegacyComments(
		file: TFile,
		legacy: Record<string, string>,
	): Promise<void> {
		const mirrored = tagsInComments(legacy);
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const fm = frontmatter as Record<string, unknown>;
			delete fm.comments;
			if (mirrored.size === 0 || !("tags" in fm)) {
				return;
			}
			const kept = this.readTagProperty(fm.tags).filter(
				(tag) => !mirrored.has(tag),
			);
			if (kept.length > 0) {
				fm.tags = kept;
			} else {
				delete fm.tags;
			}
		});
	}

	/** Read `tags` in any of the shapes Obsidian accepts, minus the `#`. */
	private readTagProperty(raw: unknown): string[] {
		const values = Array.isArray(raw)
			? raw
			: typeof raw === "string"
				? raw.split(/[,\s]+/)
				: [];
		const out: string[] = [];
		for (const value of values) {
			if (typeof value !== "string") {
				continue;
			}
			const tag = value.trim().replace(/^#/, "");
			if (tag !== "" && !out.includes(tag)) {
				out.push(tag);
			}
		}
		return out;
	}

	/** Every markdown file in the habits folder. */
	private habitFiles(): TFile[] {
		const folder = this.app.vault.getAbstractFileByPath(this.folderPath);
		if (!(folder instanceof TFolder)) {
			return [];
		}
		return folder.children.filter(
			(child): child is TFile =>
				child instanceof TFile && child.extension === "md",
		);
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
			// Only limit habits store the field; its absence means "min", so
			// notes created before the field existed keep their meaning.
			if (options.goalDirection === "max") {
				fm.goalDirection = "max";
			}
			this.writeFrequency(fm, options);
			this.writeTimes(fm, options);
			this.writeNoteFields(fm, options, cleanName);
			if (options.type !== "binary") {
				// A limit of 0 is meaningful ("none at all"), so max habits
				// always write the field even when it is zero. A note
				// habit's target is its character goal, or 100 for a
				// checklist habit's checked percentage.
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
			if (options.group) {
				fm.group = options.group;
			}
			if (options.useGroupColor) {
				fm.useGroupColor = true;
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
			if (options.goalDirection === "max") {
				fm.goalDirection = "max";
			} else {
				delete fm.goalDirection;
			}
			this.writeFrequency(fm, options);
			this.writeTimes(fm, options);
			this.writeNoteFields(fm, options, cleanName);
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
			if (options.group) {
				fm.group = options.group;
			} else {
				delete fm.group;
			}
			if (options.useGroupColor) {
				fm.useGroupColor = true;
			} else {
				delete fm.useGroupColor;
			}
		});

		new Notice(t('Updated "{name}".', { name: cleanName }));
		return file;
	}

	/**
	 * Reassign a habit to a group (or ungroup it with ""), writing the
	 * note's frontmatter. Leaving a group also clears the group-colour
	 * override, which would otherwise silently point at the old group.
	 */
	async setHabitGroup(
		habit: HabitDefinition,
		group: string,
	): Promise<void> {
		const file = this.fileForHabit(habit);
		if (!file) {
			return;
		}
		const cleaned = group.trim();
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const fm = frontmatter as Record<string, unknown>;
			if (cleaned) {
				fm.group = cleaned;
			} else {
				delete fm.group;
				delete fm.useGroupColor;
			}
		});
		habit.group = cleaned;
		if (!cleaned) {
			habit.useGroupColor = false;
		}
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
