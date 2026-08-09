import { App, TFile, moment, normalizePath } from "obsidian";
import type { HabitStore } from "./habit-store";
import type { HabitsPluginSettings } from "./settings";
import type { HabitDefinition } from "./types";
import { isDue, isPausedOn } from "./stats";
import { toDateKey } from "./utils";

/**
 * Markers around the plugin-managed reminder block. Obsidian `%%` comments,
 * so they stay invisible in reading view while the checklist lines between
 * them render (and get scanned by the Reminder plugin) normally.
 */
export const REMINDERS_START = "%% habits-reminders start %%";
export const REMINDERS_END = "%% habits-reminders end %%";

/** One reminder checklist line in the Reminder plugin's default format. */
export function reminderLine(
	name: string,
	dateKey: string,
	time: string,
	checked: boolean,
): string {
	return `- [${checked ? "x" : " "}] ${name} (@${dateKey} ${time})`;
}

/** The managed block inside `content`, or null when the markers are absent. */
function findBlock(
	content: string,
): { start: number; end: number; body: string } | null {
	const start = content.indexOf(REMINDERS_START);
	if (start < 0) {
		return null;
	}
	const bodyStart = start + REMINDERS_START.length;
	const end = content.indexOf(REMINDERS_END, bodyStart);
	if (end < 0) {
		return null;
	}
	return {
		start,
		end: end + REMINDERS_END.length,
		body: content.slice(bodyStart, end),
	};
}

/**
 * The `name|time` keys of lines already ticked off inside the managed
 * block. Regeneration keeps these checked even when the habit's record
 * does not (yet) account for them, so completing a reminder from the
 * notification is never undone by a later refresh.
 */
export function checkedKeys(content: string): Set<string> {
	const keys = new Set<string>();
	const block = findBlock(content);
	if (!block) {
		return keys;
	}
	const line = /^- \[[xX]\] (.+) \(@\d{4}-\d{2}-\d{2} (\d{2}:\d{2})\)$/gm;
	for (const match of block.body.matchAll(line)) {
		keys.add(`${match[1]}|${match[2]}`);
	}
	return keys;
}

/**
 * How many of the habit's planned times count as already covered by
 * today's record. Binary and limit-style values are all-or-nothing;
 * a counted habit covers its k-th time once the count reaches k; a
 * timed habit is covered once the day's minutes reach the target.
 */
function coveredTimes(habit: HabitDefinition, value: number): number {
	if (habit.type === "repetition") {
		return Math.min(value, habit.times.length);
	}
	const done =
		habit.type === "timed" ? value >= Math.max(habit.target, 1) : value >= 1;
	return done ? habit.times.length : 0;
}

/**
 * Today's reminder lines: one per planned time of every habit that is due
 * today, in time order. Lines start checked when today's record already
 * covers that time or when the user ticked them off in the previous block.
 * Habits with no planned times, paused habits, and limit habits (reminding
 * to *not* do something is unhelpful) produce no lines.
 */
export function reminderLines(
	habits: HabitDefinition[],
	today: Date,
	previouslyChecked: Set<string>,
): string[] {
	const dateKey = toDateKey(today);
	const entries: { time: string; line: string }[] = [];
	for (const habit of habits) {
		if (
			habit.stopped ||
			habit.goalDirection === "max" ||
			habit.times.length === 0 ||
			isPausedOn(habit, dateKey) ||
			!isDue(habit, today)
		) {
			continue;
		}
		const covered = coveredTimes(habit, habit.records[dateKey] ?? 0);
		habit.times.forEach((time, index) => {
			const checked =
				index < covered ||
				previouslyChecked.has(`${habit.name}|${time}`);
			entries.push({
				time,
				line: reminderLine(habit.name, dateKey, time, checked),
			});
		});
	}
	entries.sort((a, b) => a.time.localeCompare(b.time));
	return entries.map((entry) => entry.line);
}

/**
 * Return `content` with the managed block replaced by `lines`. With lines
 * to write, a missing block is appended at the end of the note; with none,
 * an existing block is emptied but its markers stay — they may have been
 * planted by a daily-note template to pick the block's position, and
 * keeping them means the next refill lands in that same spot. A note
 * without markers is left untouched on an empty day.
 */
export function applyReminderLines(
	content: string,
	lines: string[],
): string {
	const existing = findBlock(content);
	if (lines.length === 0 && !existing) {
		return content;
	}
	const body = lines.length > 0 ? `${lines.join("\n")}\n` : "";
	const block = `${REMINDERS_START}\n${body}${REMINDERS_END}`;
	if (existing) {
		return (
			content.slice(0, existing.start) +
			block +
			content.slice(existing.end)
		);
	}
	const separator = content.endsWith("\n\n")
		? ""
		: content.endsWith("\n")
			? "\n"
			: "\n\n";
	return content + separator + block + "\n";
}

/** The subset of the core Daily notes plugin's options we read. */
interface DailyNotesOptions {
	folder?: string;
	format?: string;
}

/** Folder and name format configured in the core Daily notes plugin. */
function dailyNoteOptions(app: App): DailyNotesOptions {
	const withInternals = app as unknown as {
		internalPlugins?: {
			getPluginById?: (id: string) => {
				instance?: { options?: DailyNotesOptions };
			} | null;
		};
	};
	return (
		withInternals.internalPlugins?.getPluginById?.("daily-notes")?.instance
			?.options ?? {}
	);
}

/**
 * Keeps a managed block of reminder lines in sync with today's due habits,
 * in the checklist format the Reminder plugin scans — the bridge that turns
 * habit schedules into actual notifications. Writing markdown is the whole
 * integration: the Reminder plugin has no API, its input surface is notes.
 */
export class ReminderSync {
	constructor(
		private app: App,
		private store: HabitStore,
		private getSettings: () => HabitsPluginSettings,
	) {}

	/** Vault path the block should live in today, or null when unknown. */
	targetPath(today: Date): string | null {
		const settings = this.getSettings().reminders;
		if (settings.target === "fixed-note") {
			const path = settings.notePath.trim();
			return path ? normalizePath(path) : null;
		}
		const options = dailyNoteOptions(this.app);
		const name = moment(today).format(options.format || "YYYY-MM-DD");
		const folder = options.folder?.trim() ?? "";
		return normalizePath(folder ? `${folder}/${name}.md` : `${name}.md`);
	}

	/**
	 * Regenerate the block for `today`. The daily note is never created by
	 * the plugin — the block is added once the note exists (the caller
	 * re-runs on file creation); a fixed note is created on demand. The
	 * file is only written when the block actually changed.
	 */
	async update(today = new Date()): Promise<void> {
		const settings = this.getSettings().reminders;
		if (!settings.enabled) {
			return;
		}
		const path = this.targetPath(today);
		if (!path) {
			return;
		}
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) {
			if (file || settings.target !== "fixed-note") {
				return;
			}
			const lines = reminderLines(
				this.store.getHabits(),
				today,
				new Set(),
			);
			if (lines.length > 0) {
				await this.ensureParentFolder(path);
				await this.app.vault.create(
					path,
					applyReminderLines("", lines),
				);
			}
			return;
		}
		const content = await this.app.vault.cachedRead(file);
		const next = applyReminderLines(
			content,
			reminderLines(
				this.store.getHabits(),
				today,
				checkedKeys(content),
			),
		);
		if (next === content) {
			return;
		}
		await this.app.vault.process(file, (current) =>
			applyReminderLines(
				current,
				reminderLines(
					this.store.getHabits(),
					today,
					checkedKeys(current),
				),
			),
		);
	}

	/** Create the folders leading up to `path` when they are missing. */
	private async ensureParentFolder(path: string): Promise<void> {
		const parent = path.split("/").slice(0, -1).join("/");
		if (parent && !this.app.vault.getAbstractFileByPath(parent)) {
			await this.app.vault.createFolder(parent);
		}
	}
}
