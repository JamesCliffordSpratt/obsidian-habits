# Habits

An [Obsidian](https://obsidian.md) plugin for tracking habits from a carousel dashboard inside your vault.

## Habit types

- **Binary** – done or not done (e.g. *make the bed*).
- **Repetition** – a count towards a target (e.g. *drink 8 cups of water*).
- **Timed** – minutes towards a target (e.g. *exercise for 30 minutes*).

## How it works

Each habit is a single note stored in a folder in your vault (the **Habits** folder by default, configurable in settings). The note's frontmatter defines the habit and stores the value logged for each day:

```yaml
---
habit: true
type: repetition
target: 8
unit: cups
icon: droplet
color: "#7c6cff"
startDate: 2026-07-01
records:
  2026-07-01: 5
---
```

To record habits, add a `habits` code block to any note:

````markdown
```habits
```
````

This renders the dashboard, where you can move between habits, switch days, and log your progress.

## Commands

- **Habits: Create habit** – open the new-habit dialog.
- **Habits: Insert dashboard** – insert a `habits` code block at the cursor.

## Development

```sh
npm install     # install dependencies
npm run dev     # build and watch during development
npm run build   # type-check and produce a production build
npm run lint    # check against the official Obsidian plugin guidelines
```

## License

[MIT](LICENSE)
