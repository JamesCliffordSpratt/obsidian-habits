import { App, moment, normalizePath, Notice, TFile, TFolder } from "obsidian";
import type { HabitStore } from "./habit-store";
import type { HabitDefinition } from "./types";
import { fromDateKey, parseNoteDate, toDateKey } from "./utils";
import { t } from "./i18n";

/** Default filename format for a note habit's day-notes. */
export const DEFAULT_NOTE_FILENAME_FORMAT = "YYYY-MM-DD";

/** The slice of Moment.js formatting this module needs, typed by hand. */
interface FormattableMoment {
	format(format: string): string;
}
const toMoment = moment as unknown as (input: Date) => FormattableMoment;

/** The note habit's filename format, defaulting when blank. */
function filenameFormat(habit: HabitDefinition): string {
	return habit.noteFilenameFormat.trim() || DEFAULT_NOTE_FILENAME_FORMAT;
}

/**
 * Vault path of the note a `note` habit's day should live at. May include
 * subfolders when the filename format contains `/` (e.g. `YYYY/MM-DD`),
 * mirroring how the Daily notes plugin supports year subfolders.
 */
export function notePathForDate(
	habit: HabitDefinition,
	dateKey: string,
): string {
	const date = fromDateKey(dateKey) ?? new Date();
	const relative = toMoment(date).format(filenameFormat(habit));
	const folder = normalizePath(habit.noteFolder.trim());
	return normalizePath(
		folder && folder !== "/" ? `${folder}/${relative}.md` : `${relative}.md`,
	);
}

/**
 * Reverse-match a vault path back to the day it belongs to for a note habit
 * (folder containment plus a strict Moment parse of the remaining path
 * against the habit's filename format). Returns `null` when the path is not
 * one of this habit's day-notes.
 */
export function matchNoteDate(
	habit: HabitDefinition,
	path: string,
): string | null {
	if (!path.endsWith(".md")) {
		return null;
	}
	const folder = normalizePath(habit.noteFolder.trim());
	let relative: string;
	if (folder === "" || folder === "/") {
		relative = path;
	} else if (path === folder || !path.startsWith(`${folder}/`)) {
		return null;
	} else {
		relative = path.slice(folder.length + 1);
	}
	relative = relative.slice(0, -3); // drop ".md"
	const date = parseNoteDate(relative, filenameFormat(habit));
	return date ? toDateKey(date) : null;
}

/** Strip a leading `---`…`---` frontmatter block, if any. */
export function stripFrontmatter(content: string): string {
	const lines = content.split("\n");
	if (lines[0]?.trim() !== "---") {
		return content;
	}
	const end = lines.findIndex(
		(line, i) => i > 0 && line.trim() === "---",
	);
	if (end === -1) {
		return content;
	}
	return lines.slice(end + 1).join("\n");
}

/** Character count of a note's body, frontmatter stripped and trimmed. */
export function countChars(content: string): number {
	return stripFrontmatter(content).trim().length;
}

/** Total task-list items in a note's body, and how many are checked. */
export function checklistProgress(content: string): {
	checked: number;
	total: number;
} {
	const body = stripFrontmatter(content);
	let checked = 0;
	let total = 0;
	for (const match of body.matchAll(/^[ \t]*[-*+] \[(.)\]/gm)) {
		total++;
		if (match[1].toLowerCase() === "x") {
			checked++;
		}
	}
	return { checked, total };
}

/**
 * Reduce a day-note's content to the single number stored in `records`: a
 * raw character count in `chars` mode, or a 0–100 checked percentage in
 * `checklist` mode (a fixed scale, since the number of tasks varies day to
 * day). Both keep working with the plugin's existing numeric completion,
 * streak, and stats machinery unchanged.
 */
export function computeNoteValue(
	habit: HabitDefinition,
	content: string,
): number {
	if (habit.noteCompletionMode === "checklist") {
		const { checked, total } = checklistProgress(content);
		return total > 0 ? Math.round((checked / total) * 100) : 0;
	}
	return countChars(content);
}

/** The subset of the Templater plugin's API this module calls into. */
interface TemplaterApi {
	create_new_note_from_template(
		template: TFile,
		folder?: TFolder,
		filename?: string,
		openNewNote?: boolean,
	): Promise<TFile | undefined>;
}

/** The Templater plugin's exposed API, if the plugin is installed and enabled. */
function findTemplater(app: App): TemplaterApi | null {
	const plugins = (
		app as unknown as {
			plugins?: { plugins?: Record<string, unknown> };
		}
	).plugins?.plugins;
	const candidate = plugins?.["templater-obsidian"] as
		| { templater?: TemplaterApi }
		| undefined;
	return candidate?.templater ?? null;
}

/** True once, per template, so the missing-Templater hint isn't repeated. */
const warnedMissingTemplater = new Set<string>();

/**
 * Create (or return the existing) day-note for a note habit. With a template
 * and Templater installed, the template is expanded through Templater's own
 * API; with a template but no Templater, its raw text is copied verbatim
 * (and a one-time Notice suggests installing Templater if the text looks
 * like it uses Templater syntax); with no template, an empty note is
 * created.
 */
export async function createNoteHabitEntry(
	app: App,
	habit: HabitDefinition,
	dateKey: string,
): Promise<TFile | null> {
	const path = notePathForDate(habit, dateKey);
	const existing = app.vault.getAbstractFileByPath(path);
	if (existing instanceof TFile) {
		return existing;
	}

	const slash = path.lastIndexOf("/");
	const folderPath = slash >= 0 ? path.slice(0, slash) : "";
	const filename = (slash >= 0 ? path.slice(slash + 1) : path).replace(
		/\.md$/,
		"",
	);
	if (folderPath) {
		const folder = app.vault.getAbstractFileByPath(folderPath);
		if (!(folder instanceof TFolder)) {
			await app.vault.createFolder(folderPath);
		}
	}

	const templatePath = normalizePath(habit.templatePath.trim());
	const templateFile = templatePath
		? app.vault.getAbstractFileByPath(templatePath)
		: null;
	if (templateFile instanceof TFile) {
		const templater = findTemplater(app);
		if (templater) {
			const folder = folderPath
				? app.vault.getAbstractFileByPath(folderPath)
				: app.vault.getRoot();
			if (folder instanceof TFolder) {
				const created = await templater.create_new_note_from_template(
					templateFile,
					folder,
					filename,
					false,
				);
				if (created instanceof TFile) {
					return created;
				}
			}
		}
		const content = await app.vault.cachedRead(templateFile);
		const looksLikeTemplater = !templater && content.includes("<%");
		if (looksLikeTemplater && !warnedMissingTemplater.has(templatePath)) {
			warnedMissingTemplater.add(templatePath);
			new Notice(
				t(
					'"{name}" uses Templater syntax, but the Templater plugin is not installed — the template was copied as plain text.',
					{ name: templateFile.basename },
				),
			);
		}
		return await app.vault.create(path, content);
	}

	return await app.vault.create(path, "");
}

/**
 * Keeps note habits' `records` in step with their day-notes: watches the
 * vault for edits to any file that matches a note habit's folder and
 * filename format, and writes the derived character count or checked
 * percentage back through {@link HabitStore.setRecord} — the same numeric
 * record every other habit type uses, so streaks and stats need no changes
 * of their own.
 */
export class NoteHabitSync {
	constructor(
		private app: App,
		private store: HabitStore,
	) {}

	private noteHabits(): HabitDefinition[] {
		return this.store
			.getHabits()
			.filter((habit) => habit.type === "note" && !habit.stopped);
	}

	private async syncOne(habit: HabitDefinition, file: TFile): Promise<void> {
		const dateKey = matchNoteDate(habit, file.path);
		if (!dateKey) {
			return;
		}
		const content = await this.app.vault.cachedRead(file);
		const value = computeNoteValue(habit, content);
		if ((habit.records[dateKey] ?? 0) !== value) {
			await this.store.setRecord(habit, dateKey, value);
		}
	}

	/** Recompute every note habit whose day-note this file might be. */
	async syncFile(file: TFile): Promise<void> {
		if (file.extension !== "md") {
			return;
		}
		for (const habit of this.noteHabits()) {
			await this.syncOne(habit, file);
		}
	}

	/** A day-note was deleted or moved away: clear its record, if any. */
	async handleDelete(path: string): Promise<void> {
		for (const habit of this.noteHabits()) {
			const dateKey = matchNoteDate(habit, path);
			if (dateKey && (habit.records[dateKey] ?? 0) !== 0) {
				await this.store.setRecord(habit, dateKey, 0);
			}
		}
	}

	/**
	 * One-time backfill over every note habit's folder, so day-notes that
	 * already existed before the plugin loaded (or before a habit's folder
	 * was pointed at them) are picked up without needing an edit first.
	 */
	async primeAll(): Promise<void> {
		for (const habit of this.noteHabits()) {
			const folder = normalizePath(habit.noteFolder.trim());
			const files = this.app.vault
				.getMarkdownFiles()
				.filter(
					(file) =>
						folder === "" ||
						folder === "/" ||
						file.path === folder ||
						file.path.startsWith(`${folder}/`),
				);
			for (const file of files) {
				await this.syncOne(habit, file);
			}
		}
	}
}
