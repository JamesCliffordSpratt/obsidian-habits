import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

// A minimal Obsidian surface lets us exercise the actual render/write code
// without a running desktop vault. Stats and date utilities remain real.
const result = await build({
  stdin: { contents: 'export { HabitsCompact } from "./src/ui/habits-compact"; export { HabitsBlock } from "./src/ui/habits-block";', resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'obsidian-test-surface', setup(build) {
    build.onResolve({ filter: /^obsidian$/ }, () => ({ path: 'obsidian', namespace: 'mock' }));
    build.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: `
      export class Component {
        children = []; cleanups = [];
        addChild(c) { this.children.push(c); c.onload?.(); return c; }
        removeChild(c) { c.unload(); this.children = this.children.filter(x => x !== c); }
        registerDomEvent(el, type, fn) { el.handlers[type] = fn; this.cleanups.push(() => delete el.handlers[type]); }
        registerEvent() {}
		register(fn) { this.cleanups.push(fn); }
        unload() { this.onunload?.(); this.children.forEach(c => c.unload()); this.cleanups.forEach(f => f()); }
      }
      export class MarkdownRenderChild extends Component { constructor(root) { super(); this.containerEl = root; } }
      export class App {} export class TFile {} export class Notice { constructor(message) { globalThis.lastNotice = message; } }
      export class Menu {
        items = [];
        addItem(fn) { const item = { setTitle(title) { this.title = title; return this; }, setIcon(icon) { this.icon = icon; return this; }, onClick(fn) { this.click = fn; return this; } }; fn(item); this.items.push(item); return this; }
        showAtPosition(position) { this.position = position; globalThis.lastMenu = this; globalThis.menuCount = (globalThis.menuCount ?? 0) + 1; }
      }
      export const debounce = fn => fn;
      export const normalizePath = s => s;
      export const setIcon = (el, icon) => { el.icon = icon; };
      export const setTooltip = () => {};
      export const moment = {};
    ` }));
    build.onLoad({ filter: /i18n\/index\.ts$/ }, () => ({ contents: 'export const t = (s, vars = {}) => s.replace(/\\{(.*?)\\}/g, (_, k) => vars[k]);' }));
    build.onLoad({ filter: /ui\/habit-modal\.ts$/ }, () => ({ contents: 'export class HabitModal { constructor(...args) { this.args = args; } open() { globalThis.lastHabitModal = this; } }' }));
    build.onLoad({ filter: /ui\/confirm-modal\.ts$/ }, () => ({ contents: 'export class ConfirmModal { constructor(app, options) { this.options = options; } open() { globalThis.lastConfirmation = this.options; } }' }));
    build.onLoad({ filter: /ui\/dashboard\.ts$/ }, () => ({ contents: 'import { MarkdownRenderChild } from "obsidian"; export class HabitsDashboard extends MarkdownRenderChild { constructor(a, s, g, e, p, root) { super(root); } onload() { this.containerEl.createSpan({ text: "Card dashboard" }); } }' }));
    build.onLoad({ filter: /ui\/icon-suggest-modal\.ts$/ }, () => ({ contents: 'export const applyHabitIcon = (el, icon) => { el.icon = icon; };' }));
    build.onLoad({ filter: /ui\/stats-view\.ts$/ }, () => ({ contents: 'export const renderStatsView = () => {};' }));
    build.onLoad({ filter: /\/note-habit\.ts$/ }, () => ({ contents: 'export const notePathForDate = (h, k) => `${h.noteFolder}/${k}.md`; export const createNoteHabitEntry = async () => null;' }));
  } }],
});
const { HabitsCompact, HabitsBlock } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
class Element {
  children = []; handlers = {}; attrs = {}; classes = new Set();
  win = { timers: new Map(), setTimeout(fn) { const id = this.timers.size + 1; this.timers.set(id, fn); return id; }, clearTimeout(id) { this.timers.delete(id); } };
  constructor(tag = 'div', options = {}) { this.tag = tag; this.text = options.text ?? ''; this.attrs = options.attr ?? {}; this.className = options.cls ?? ''; }
  createEl(tag, options) { const el = new Element(tag, options); this.children.push(el); return el; }
  createDiv(options) { return this.createEl('div', options); }
  createSpan(options) { return this.createEl('span', options); }
  addClass(cls) { this.classes.add(cls); }
  toggleClass(cls, active) { if (active) this.classes.add(cls); else this.classes.delete(cls); }
  setCssProps() {} setAttribute(key, value) { this.attrs[key] = value; }
  empty() { this.children = []; }
  all() { return [this, ...this.children.flatMap(el => el.all())]; }
}
function fixture(overrides = {}, write = async () => {}) {
  const habit = { path: 'Habits/Test.md', name: 'Test', type: 'repetition', frequency: 'daily', target: 5, unit: 'cups', goalDirection: 'min', startDate: '2020-01-01', records: {}, pauses: [], reschedules: [], times: [], group: '', ...overrides };
  const events = {};
  const app = { metadataCache: { on: (name, fn) => { events[name] = fn; } }, vault: { on() {}, getAbstractFileByPath() {} }, workspace: { openLinkText() {} } };
  const store = { getHabits: () => [structuredClone(habit)], setRecord: write };
  const settings = { habitsFolder: 'Habits', sortMode: 'name', manualOrder: [], groups: {}, groupOrder: [], experimental: {} };
  const root = new Element();
  const view = new HabitsCompact(app, store, () => settings, { on() {} }, 'Dashboard.md', root);
  view.selectedDate = new Date(2026, 9, 12); view.onload();
  const button = label => root.all().find(el => el.attrs['aria-label'] === label);
  const text = () => root.all().map(el => el.text).join('');
  return { view, root, habit, events, button, text, app, store };
}

test('successful writes bridge stale metadata, then accept external changes', async () => {
  const writes = [];
  const f = fixture({}, async (...args) => writes.push(args));
  f.button('Increase by 1').handlers.click();
  await new Promise(setImmediate);
  assert.match(f.text(), /1 \/ 5 cups/);
  f.button('Increase by 1').handlers.click();
  await new Promise(setImmediate);
  assert.equal(writes[1][2], 2);
  f.habit.records['2026-10-12'] = 4;
  f.events.changed({ path: f.habit.path });
  assert.match(f.text(), /4 \/ 5 cups/);
});

test('double clicks are serialized and changing dates cannot redirect a write', async () => {
  let release; const writes = [];
  const f = fixture({}, (...args) => { writes.push(args); return new Promise(r => { release = r; }); });
  const click = f.button('Increase by 1').handlers.click; click(); click();
  assert.equal(writes.length, 1);
  assert.equal(f.button('Increase by 1').disabled, true);
  f.button('Next day').handlers.click(); release();
  await new Promise(setImmediate);
  assert.equal(writes[0][1], '2026-10-12');
  assert.match(f.text(), /0 \/ 5 cups/);
  f.button('Previous day').handlers.click();
  assert.match(f.text(), /1 \/ 5 cups/);
});

test('failed saves preserve the count and restore controls', async () => {
  const f = fixture({}, async () => { throw new Error('disk full'); });
  f.button('Increase by 1').handlers.click(); await new Promise(setImmediate);
  assert.match(f.text(), /0 \/ 5 cups/);
  assert.equal(f.button('Increase by 1').disabled, false);
  assert.equal(globalThis.lastNotice, 'Could not save habit record.');
});

test('flexible totals span the week while steppers write only the selected day', async () => {
  const writes = [];
  const f = fixture({ frequency: 'flexibleWeekly', records: { '2026-10-12': 2, '2026-10-13': 1 } }, async (...args) => writes.push(args));
  f.button('Next day').handlers.click();
  assert.match(f.text(), /3 \/ 5 cups This week/);
  f.button('Increase by 1').handlers.click(); await new Promise(setImmediate);
  assert.equal(writes[0][2], 2);
  assert.match(f.text(), /4 \/ 5 cups This week/);
});

test('binary limits, paused habits, timed steps and listener cleanup', () => {
  const limit = fixture({ type: 'binary', goalDirection: 'max', target: 0 });
  assert.ok(limit.button('Mark as slipped'));
  const paused = fixture({ pauses: [{ start: '2026-10-01', end: '' }] });
  assert.match(paused.text(), /Paused/); assert.equal(paused.button('Increase by 1'), undefined);
  const timed = fixture({ type: 'timed' }); assert.ok(timed.button('Increase by 5')); assert.ok(timed.button('Decrease by 5'));
  const old = timed.button('Increase by 5'); timed.button('Next day').handlers.click();
  assert.equal(old.handlers.click, undefined);
  timed.view.unload(); assert.equal(timed.button('Increase by 5').handlers.click, undefined);
});

test('existing habits block switches layouts immediately and unloads old controls', () => {
  const root = new Element();
  const settings = { dashboardLayout: 'carousel', habitsFolder: 'Habits', sortMode: 'name', manualOrder: [], groups: {}, groupOrder: [], experimental: {} };
  const listeners = [];
  const events = { on: (_, fn) => { listeners.push(fn); } };
  const app = { metadataCache: { on() {} }, vault: { on() {} } };
  const block = new HabitsBlock(app, { getHabits: () => [] }, () => settings, events, 'Dashboard.md', root);
  block.onload();
  assert.ok(root.all().some(el => el.text === 'Card dashboard'));
  settings.dashboardLayout = 'compact'; listeners[0]();
  assert.ok(root.all().some(el => el.className === 'habits-compact-header'));
  assert.equal(root.all().some(el => el.text === 'Card dashboard'), false);
  const plus = root.all().find(el => el.attrs['aria-label'] === 'Add habit');
  settings.dashboardLayout = 'grid'; listeners[0]();
  assert.equal(plus.handlers.click, undefined);
  assert.ok(root.all().some(el => el.text === 'Card dashboard'));
  assert.equal(block.children.length, 1);
});

function openMenu(f) {
  const row = f.root.all().find(el => el.className === 'habits-compact-row');
  let prevented = false, stopped = false;
  row.handlers.contextmenu({ clientX: 100, clientY: 200, preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } });
  assert.equal(prevented, true); assert.equal(stopped, true);
  assert.deepEqual(globalThis.lastMenu.position, { x: 100, y: 200 });
  return { row, menu: globalThis.lastMenu };
}

test('right-click offers working open, edit and pause actions', async () => {
  const f = fixture(); let opened, paused;
  f.app.workspace.openLinkText = (...args) => { opened = args; };
  f.store.pauseHabit = async h => { paused = h.path; };
  const { menu } = openMenu(f);
  assert.deepEqual(menu.items.map(i => i.title), ['Open note', 'Edit habit', 'Pause habit', 'Stop tracking', 'Remove habit']);
  menu.items[0].click(); assert.deepEqual(opened, [f.habit.path, 'Dashboard.md', false]);
  menu.items[1].click(); assert.equal(globalThis.lastHabitModal.args[3].path, f.habit.path);
  await menu.items[2].click(); assert.equal(paused, f.habit.path);
});

test('paused rows retain their menu and offer resume instead of pause', async () => {
  const f = fixture({ paused: true, pauses: [{ start: '2026-10-01', end: '' }] }); let resumed;
  f.store.resumeHabit = async h => { resumed = h.path; };
  const { menu } = openMenu(f);
  assert.equal(menu.items[2].title, 'Resume habit');
  await menu.items[2].click(); assert.equal(resumed, f.habit.path);
});

test('stop and remove are deferred until confirmation', async () => {
  const f = fixture(); const calls = [];
  f.store.stopHabit = async h => calls.push(['stop', h.path]);
  f.store.deleteHabit = async h => calls.push(['delete', h.path]);
  const { menu } = openMenu(f);
  menu.items[3].click(); assert.deepEqual(calls, []);
  assert.equal(globalThis.lastConfirmation.title, 'Stop tracking');
  await globalThis.lastConfirmation.onConfirm();
  menu.items[4].click(); assert.equal(calls.length, 1);
  assert.equal(globalThis.lastConfirmation.danger, true);
  await globalThis.lastConfirmation.onConfirm();
  assert.deepEqual(calls, [['stop', f.habit.path], ['delete', f.habit.path]]);
});

test('long-press opens once, movement cancels it, and redraw removes timers', () => {
  const f = fixture(); const row = f.root.all().find(el => el.className === 'habits-compact-row');
  const count = globalThis.menuCount ?? 0;
  row.handlers.touchstart({ touches: [{ clientX: 100, clientY: 200 }] });
  const fn = [...row.win.timers.values()][0]; row.win.timers.clear(); fn();
  assert.equal(globalThis.menuCount, count + 1);
  row.handlers.contextmenu({ clientX: 100, clientY: 200, preventDefault() {}, stopPropagation() {} });
  assert.equal(globalThis.menuCount, count + 1);
  row.handlers.touchstart({ touches: [{ clientX: 100, clientY: 200 }] });
  row.handlers.touchmove({ touches: [{ clientX: 120, clientY: 200 }] });
  assert.equal(row.win.timers.size, 0);
  row.handlers.touchstart({ touches: [{ clientX: 100, clientY: 200 }] });
  f.button('Next day').handlers.click();
  assert.equal(row.win.timers.size, 0); assert.equal(row.handlers.contextmenu, undefined);
});
