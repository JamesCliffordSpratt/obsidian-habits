import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
} from "obsidian";
import type { HabitStore } from "../habit-store";
import type { HabitDefinition } from "../types";
import { applyHabitIcon } from "./icon-suggest-modal";

/**
 * Suggests habit names while typing `habit:` inside a `habit-metrics`
 * code block, so users can point the block at any habit by name.
 */
export class HabitMetricsSuggest extends EditorSuggest<HabitDefinition> {
	constructor(
		app: App,
		private store: HabitStore,
	) {
		super(app);
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		_file: TFile | null,
	): EditorSuggestTriggerInfo | null {
		const before = editor.getLine(cursor.line).slice(0, cursor.ch);
		const match = /^(\s*habit\s*:\s*)(.*)$/i.exec(before);
		if (!match || !this.inMetricsBlock(editor, cursor.line)) {
			return null;
		}
		return {
			start: { line: cursor.line, ch: match[1].length },
			end: cursor,
			query: match[2],
		};
	}

	/** True when the nearest fence above the line opens a metrics block. */
	private inMetricsBlock(editor: Editor, lineNo: number): boolean {
		for (let i = lineNo - 1; i >= 0; i--) {
			const line = editor.getLine(i).trim();
			if (line.startsWith("```")) {
				return /^`{3,}\s*habit-metrics\s*$/.test(line);
			}
		}
		return false;
	}

	getSuggestions(context: EditorSuggestContext): HabitDefinition[] {
		const needle = context.query.toLowerCase();
		return this.store
			.getHabits()
			.filter((habit) => habit.name.toLowerCase().includes(needle));
	}

	renderSuggestion(habit: HabitDefinition, el: HTMLElement): void {
		const row = el.createDiv({ cls: "habits-icon-suggestion" });
		const glyph = row.createSpan({
			cls: "habits-icon-suggestion-glyph",
		});
		if (habit.icon) {
			applyHabitIcon(glyph, habit.icon);
		}
		row.createSpan({ text: habit.name });
	}

	selectSuggestion(habit: HabitDefinition): void {
		const context = this.context;
		if (!context) {
			return;
		}
		context.editor.replaceRange(habit.name, context.start, context.end);
		context.editor.setCursor({
			line: context.start.line,
			ch: context.start.ch + habit.name.length,
		});
		this.close();
	}
}
