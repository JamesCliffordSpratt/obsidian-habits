# Habits — habit tracker for Obsidian

**Build streaks. Log daily habits. Watch your progress with charts, heatmaps, and printable reports — all stored as plain Markdown notes in your vault.**

![GitHub release](https://img.shields.io/github/v/release/JamesCliffordSpratt/obsidian-habits)
![GitHub license](https://img.shields.io/github/license/JamesCliffordSpratt/obsidian-habits)
![Obsidian min version](https://img.shields.io/badge/Obsidian-1.7.2%2B-483699)

![Recording habits on the dashboard](images/habits-renderer.gif)

## ✨ Features at a glance

- 🎠 **Carousel dashboard** — log your habits from any note with a `habits` code block, with satisfying completion animations
- ✅ **Three habit types** — done/not-done, counted (8 cups of water), and timed (30 minutes of exercise, with +1/+5/+10 quick buttons)
- 🗓️ **Daily, weekly, or monthly** — pick a frequency per habit; weekly and monthly habits appear only on their due day, and streaks count consecutive weeks or months
- 🔥 **Streaks and statistics** — current and best streaks, completion rates, perfect days, weekly and monthly goals, per-habit heatmaps over the week, month, or any custom date range
- 📊 **Charts on every habit page** — 30-day activity and 12-week trend charts rendered in your theme's colours
- 📄 **Printable PDF reports** — pick your metrics, date range, and layout with a live A4 preview
- 🚭 **Break bad habits** *(experimental)* — track things you're cutting down or quitting by staying under a daily limit, with quiet streaks for every clean day
- ✨ **AI summaries** *(experimental)* — on-demand feedback and advice on your stats, on screen and in PDF reports, using your own AI service (including free and fully local options)
- 📌 **Sidebar quick-log panel** — check off today's habits from anywhere, sized for narrow panes
- ⏸️ **Pause without penalty** — ill or travelling? Paused days never break streaks or drag down your stats
- 💬 **Per-day comments** — flip any card over to jot down why a day went the way it did; comments can be included in PDF reports
- 📅 **Daily-note aware** — a dashboard inside `2026-07-01.md` shows that day's habits automatically
- 📱 **Mobile friendly** — responsive cards, long-press menus, and a configurable mobile layout
- 🌍 **In your language** — available in English, Spanish, French, German, Japanese, Korean, and Simplified Chinese
- 🎨 **Theme native** — every colour comes from your theme; custom accents and icons per habit

## 📥 Installation

Habits is available in the community plugin browser: open **Settings → Community plugins → Browse**, search for "Habits", then install and enable. ([BRAT](https://github.com/TfTHacker/obsidian42-brat) and manual installation from the [release assets](https://github.com/JamesCliffordSpratt/obsidian-habits/releases) work too.)

## 🚀 Quick start

1. Run the command **Habits: Create habit** and define your first habit.
2. Run **Habits: Insert dashboard** in any note (your homepage, or your daily-note template) to place the tracker:

   ````markdown
   ```habits
   ```
   ````

3. Log your progress from the dashboard, or open the sidebar panel (ribbon icon or **Habits: Open panel**) to tick things off as you go.

![Adding a habit](images/add-habit.gif)

## 📓 Your data stays yours

Each habit is a single Markdown note in a folder of your choice (default: `Habits`). The frontmatter defines the habit and stores one value per day — readable, portable, and future-proof:

```yaml
---
habit: true
type: repetition
target: 8
unit: cups
icon: droplet
color: "#7c6cff"
startDate: 2026-07-01
weeklyTarget: 5
records:
  2026-07-01: 5
comments:
  2026-07-01: Managed all eight glasses before lunch!
pauses:
  - start: 2026-06-10
    end: 2026-06-14
---
```

No databases, no external services — delete the plugin and your history is still right there in your notes.

## 🗓️ Daily, weekly, and monthly habits

Every habit has a **frequency**, chosen when you create or edit it:

- **Daily** — due every day (the default).
- **Weekly** — due once a week on the weekday you pick. The card only appears on that day.
- **Monthly** — due once a month on the day you pick. Months shorter than the chosen day fall due on their **last day**, so the 31st always lands on the final day of the month (28th or 29th in February, 30th in April, and so on) — you never miss a month.

Weekly and monthly cards surface only on their due date in both the dashboard and the sidebar panel, so your list stays focused on what's actually due. Their **streaks and stats count periods, not days**: a weekly habit's streak is the number of consecutive weeks you completed it, and a monthly habit's is consecutive months. Days a habit isn't due don't count against its completion rate. To log a due date you missed, use the dashboard's date arrows to step back to it.

The charts on a weekly or monthly habit's page adapt too: instead of a 30-day grid, the activity chart plots each recent **due date** (labelled with the date it lands on), and a rolling completion-rate line shows the trend across periods. The summary tiles relabel accordingly — "Weeks completed" or "Months completed" rather than "Days completed".

## 🎠 The dashboard

Cards for each habit sit in a swipeable carousel. Completing a habit plays a celebration animation and the card glides to the back of the queue, keeping what's left front and centre. Click a card's name to open its note; right-click (or long-press on mobile) for editing, pausing, stopping, or removing.

Embedded in a **daily note**? The dashboard follows that note's date, so browsing yesterday's note shows yesterday's habits. The dashboard also live-updates whenever your habit notes or settings change — even from another pane or device sync.

Every card also has a **comment flap** along its bottom edge. Click it and the card flips over to a per-day comment box — perfect for noting why a habit was missed (or smashed). Days with a comment show an accent-tinted speech bubble, and comments follow the selected date, so each day keeps its own note.

## 📌 The sidebar panel

Open the panel from the ribbon icon or the **Open panel** command to log today's habits from anywhere: one compact row per habit with tap-to-check toggles, steppers, and slim progress bars, plus a running done/total count for the day.

![Logging habits from the sidebar panel](images/habits-side-panel.gif)

## 📈 Stats and reports

The chart button opens the stats view: completion summary tiles, streaks, perfect days, goal progress, and a heatmap per habit. Three tabs pick the period — **Weekly** and **Monthly** (rolling or calendar), plus **Custom** with from/to date pickers for any range up to a year.

Heatmaps are honest about when a habit began: days before its start date render as neutral dotted cells (they count neither for nor against you), and the first tracked day is marked with a small play icon — hover it to see the start date.

Tracking a lot of habits? Turn on **Stats page carousel** in settings to split the per-habit rows into pages you can flip through instead of one long list.

![Browsing the stats view](images/stats-page.gif)

From there, the download button opens the **PDF export** dialog:

- **Metrics** — summary tiles, completion trend chart, daily grids, goal progress, comments — plus an [AI summary](#-experimental-features) if you've enabled that feature
- **Range** — this week, last 7 days, this month, last 30 days, or any custom range up to 92 days
- **Layout** — portrait or landscape, comfortable or compact, monochrome for ink-friendly printing
- **Live preview** — a to-scale A4 preview updates as you tweak; click it to inspect at full size. What you see is exactly what prints.

![Building a PDF report](images/habits-report.gif)

## 📊 Habit pages

Every habit note can chart its own history with a `habit-metrics` code block (new habit notes include one automatically):

````markdown
```habit-metrics
```
````

Streak tiles, a 30-day activity chart with target line, and a 12-week completion trend — all in your theme's colours.

The block also works in **any note**: name a habit and its metrics render right there — perfect for journal entries, weekly reviews, or project pages. As you type after `habit:`, your habits are suggested automatically.

````markdown
```habit-metrics
habit: Journal
```
````

## ⏸️ Pausing and stopping

- **Pause** a habit when life gets in the way. Paused days are skipped entirely: streaks survive, completion rates ignore them, and the card waits dimmed at the back of the carousel until you resume.
- **Stop tracking** a habit you've outgrown. It leaves the dashboard and stats but keeps its note and full history, with a one-click resume in its metrics view.
- **Remove** deletes the habit's note (to your trash) — the only destructive action, and it asks first.

## 🧪 Experimental features

Some features ship behind opt-in toggles under **Settings → Habits → Experimental** while they're being tested. They're **off by default**, and turning one off only hides it from menus — anything you created with it keeps working and keeps its meaning.

### 🚭 Break bad habits

Track habits you want to reduce or avoid by staying **under a daily limit** instead of reaching a target — at most 2 hours of gaming, no more than one coffee, or no smoking at all (a limit of 0).

- **Done/not-done limit habits** get two buttons: **Clean** and **Slipped**. An unlogged day already counts as clean — silence is success.
- **Counted and timed limit habits** log consumption against the limit; the progress bar fills toward the limit and turns red past it.
- Streaks count consecutive days within the limit, and only from the habit's start date — the years before you started quitting don't inflate anything.

### ✨ AI summaries

An optional, bring-your-own-key coach: press **Generate summary** on any stats tab to get a short, plain-language review of your period — what's going well, what's slipping, and one or two concrete suggestions. The same summary can be added to PDF reports via a per-export toggle in the export dialog.

Works with **any OpenAI-compatible service**: OpenAI, OpenRouter, Groq, Google AI Studio, or fully local servers like [Ollama](https://ollama.com) and LM Studio (leave the API key blank for those). Configure the base URL, key, and model under the experimental toggle.

**Privacy, by design:**

- Nothing is ever sent automatically — only when you press the generate button (or opt in per export).
- Only aggregate stats are sent: habit names, rates, streaks, totals. **Never** your per-day records or comments.
- Your API key is stored locally in this vault's plugin data and sent only to the endpoint you configured.
- Summaries are cached, so revisiting a tab never repeats a request.

## ⌨️ Commands

| Command | Action |
| --- | --- |
| **Create habit** | Open the new-habit dialog |
| **Insert dashboard** | Insert a `habits` code block at the cursor |
| **Insert habit metrics** | Insert a `habit-metrics` code block at the cursor |
| **Open panel** | Open the sidebar quick-log panel |

## ⚙️ Settings

| Setting | Default | Description |
| --- | --- | --- |
| Habits folder | `Habits` | Where habit notes live (with folder autocomplete) |
| Follow daily note date | On | Dashboards in daily notes open on that note's date |
| Daily note date format | `YYYY-MM-DD` | Moment.js format used to read the date from a daily note's name (e.g. `YYYYMMDD`) |
| Cards per view | 4 | Carousel cards shown at once on wide screens (1–4) |
| Cards per view on mobile | 2 | Carousel cards on phone-sized screens (1–2) |
| Comments on cards | On | Show the comment flap on dashboard cards |
| Stats page carousel | Off | Split the stats page's habit rows into flippable pages |
| Stats rows per page | 4 | Habits per stats page when the carousel is on (1–8) |
| Break bad habits | Off | *(Experimental)* Limit habits: stay under a daily cap |
| AI summaries | Off | *(Experimental)* AI feedback on stats tabs and PDF reports |

## 🛠️ Development

```sh
npm install     # install dependencies
npm run dev     # build and watch during development
npm run build   # type-check and produce a production build
npm run lint    # check against the official Obsidian plugin guidelines
npm run release # bump patch version, tag, and push (CI drafts the release)
```

## 📄 License

[MIT](LICENSE)
