/** Simplified Chinese translations, keyed by the English source string. */
export const zh: Record<string, string> = {
	// Commands and ribbon
	"Create habit": "创建习惯",
	"Insert dashboard": "插入习惯面板",
	"Insert habit metrics": "插入习惯指标",
	"Open panel": "打开侧边栏面板",
	"Open habits panel": "打开习惯侧边栏",
	Habits: "习惯",

	// Settings
	"Habits folder": "习惯文件夹",
	"Folder where each habit is stored as its own note. It is created automatically if it does not exist.":
		"每个习惯都以独立笔记的形式存放在此文件夹中。如果不存在会自动创建。",
	"Follow daily note date": "跟随日记日期",
	"When a dashboard is embedded in a daily note (a note whose name contains a date like 2026-07-01), open it on that note's date instead of today.":
		"当习惯面板嵌入到日记中（笔记名称包含类似 2026-07-01 的日期）时，面板会显示该笔记日期的记录，而不是今天。",
	"Cards per view": "每页卡片数",
	"How many habit cards the carousel shows at once on wider screens.":
		"在宽屏幕上轮播一次显示多少张习惯卡片。",
	"Cards per view on mobile": "移动端每页卡片数",
	"How many habit cards the carousel shows at once on phone-sized screens.":
		"在手机屏幕上轮播一次显示多少张习惯卡片。",

	// Confirm dialog defaults
	Cancel: "取消",
	Confirm: "确认",

	// Store notices
	'Could not find the note for "{name}".': "找不到“{name}”的笔记。",
	"Please enter a valid habit name.": "请输入有效的习惯名称。",
	'A habit called "{name}" already exists.':
		"名为“{name}”的习惯已存在。",
	'Created habit "{name}".': "已创建习惯“{name}”。",
	'Updated "{name}".': "已更新“{name}”。",
	'Paused "{name}".': "已暂停“{name}”。",
	'Resumed "{name}".': "已恢复“{name}”。",
	'Stopped tracking "{name}". Its history is kept in the note.':
		"已停止跟踪“{name}”。其历史记录保留在笔记中。",
	'Resumed tracking "{name}".': "已恢复跟踪“{name}”。",
	'Removed "{name}".': "已删除“{name}”。",
	"Habit added to the dashboard.": "习惯已添加到面板。",

	// Dashboard
	"Back to habits": "返回习惯",
	"View stats": "查看统计",
	"Export stats": "导出统计",
	Weekly: "每周",
	Monthly: "每月",
	"Previous day": "前一天",
	"Next day": "后一天",
	"Choose a date": "选择日期",
	"Add habit": "添加习惯",
	"No habits yet. Create your first habit to get started.":
		"还没有习惯。创建你的第一个习惯开始吧。",
	Previous: "上一页",
	Next: "下一页",
	"Go to position {n}": "跳到第 {n} 页",
	"Right-click or long-press for more options":
		"右键或长按查看更多选项",
	"Open habit note": "打开习惯笔记",
	"Open the note for {name}": "打开 {name} 的笔记",
	Paused: "已暂停",
	"Since {date} · right-click to resume":
		"自 {date} 起 · 右键恢复",
	"Paused on this day": "当天已暂停",
	"Mark as done": "标记为已完成",
	"Mark as not done": "标记为未完成",
	Done: "已完成",
	"Not done": "未完成",
	"Edit value": "编辑数值",
	Value: "数值",
	"Decrease by 1": "减少 1",
	"Increase by 1": "增加 1",
	"Increase by {n}": "增加 {n}",
	"Edit habit": "编辑习惯",
	"Pause habit": "暂停习惯",
	"Resume habit": "恢复习惯",
	"Stop tracking": "停止跟踪",
	"Remove habit": "删除习惯",
	'Stop tracking "{name}"? It leaves the dashboard and stats, but its note and full history are kept. You can resume tracking any time from the note\'s metrics view.':
		"停止跟踪“{name}”？它将从面板和统计中移除，但其笔记和全部历史记录会保留。你随时可以在笔记的指标视图中恢复跟踪。",
	'Remove "{name}"? Its note will be moved to the trash.':
		"删除“{name}”？其笔记将被移入回收站。",
	Remove: "删除",
	"Perfect!": "完美！",
	Today: "今天",
	Yesterday: "昨天",
	Tomorrow: "明天",
	"Last 7 days": "最近 7 天",
	"Last 30 days": "最近 30 天",
	"This week": "本周",
	"This month": "本月",

	// Sidebar panel
	"Habits completed today": "今日已完成的习惯",
	"No habits yet.": "还没有习惯。",
	"Click to type a value": "点击输入数值",
	"Open note": "打开笔记",

	// Stats view
	"No habits to show stats for yet.": "还没有可统计的习惯。",
	Completion: "完成率",
	"Best streak": "最长连击",
	"Perfect days": "完美天数",
	Completions: "完成次数",
	"Goals met": "达成目标",
	"{completed}/{days} days": "{completed}/{days} 天",
	"{total} total": "共 {total}",
	best: "最佳",
	"perfect week": "完美一周",
	"perfect month": "完美一月",
	"weekly goal": "周目标",
	"monthly goal": "月目标",
	"{progress}/{goal} days · {label} · {pct}%":
		"{progress}/{goal} 天 · {label} · {pct}%",

	// Habit metrics block
	'Place this block inside a habit note, or point it at one with "habit: <name>".':
		"请将此代码块放入习惯笔记中，或用“habit: <名称>”指定一个习惯。",
	'No habit called "{name}" was found.': "找不到名为“{name}”的习惯。",
	"No longer tracked since {date}. All history is kept.":
		"自 {date} 起已停止跟踪。所有历史记录均已保留。",
	"No longer tracked. All history is kept.":
		"已停止跟踪。所有历史记录均已保留。",
	"Resume tracking": "恢复跟踪",
	"Paused since {date}. Paused days don't count against streaks or stats.":
		"自 {date} 起暂停。暂停的日子不会影响连击或统计。",
	"Paused. Paused days don't count against streaks or stats.":
		"已暂停。暂停的日子不会影响连击或统计。",
	"Current streak": "当前连击",
	"Days completed": "完成天数",
	"30-day rate": "30 天完成率",
	"Weekly completion rate": "每周完成率",
	Logged: "已记录",
	Target: "目标",

	// Export modal
	Title: "标题",
	"Habits report": "习惯报告",
	"Date range": "日期范围",
	"Custom range": "自定义范围",
	From: "从",
	To: "到",
	"Up to {n} days.": "最多 {n} 天。",
	Content: "内容",
	"Summary tiles": "摘要卡片",
	"Completion trend chart": "完成趋势图",
	"Daily grids": "每日网格",
	"Goal progress": "目标进度",
	Layout: "布局",
	Orientation: "方向",
	Portrait: "纵向",
	Landscape: "横向",
	Density: "密度",
	Comfortable: "宽松",
	Compact: "紧凑",
	Monochrome: "黑白",
	"Ink-friendly greys instead of accent colours.":
		"使用省墨的灰色代替强调色。",
	"Export PDF": "导出 PDF",
	"No habits to export yet.": "还没有可导出的习惯。",
	"Completion trend": "完成趋势",
	"(paused)": "（已暂停）",
	"{rate}% · {total} · streak {current} (best {best})":
		"{rate}% · {total} · 连击 {current}（最佳 {best}）",
	"Goal: {completed}/{goal} days met":
		"目标：已达成 {completed}/{goal} 天",
	'Exported to "{path}" in your vault.':
		"已导出到仓库中的“{path}”。",
	"{range} · exported {date}": "{range} · 导出于 {date}",

	// Habit modal
	"New habit": "新习惯",
	Name: "名称",
	Type: "类型",
	"Binary is done or not done. Repetition counts towards a target. Timed tracks minutes.":
		"二元型：完成或未完成。重复型：向目标计数。计时型：记录分钟数。",
	Binary: "二元",
	Repetition: "重复",
	Timed: "计时",
	"Daily target (minutes)": "每日目标（分钟）",
	"Daily target": "每日目标",
	Unit: "单位",
	"Optional label shown next to the count.":
		"显示在计数旁边的可选标签。",
	Icon: "图标",
	"Choose a Lucide icon or an emoji to represent this habit.":
		"选择一个 Lucide 图标或 emoji 来代表这个习惯。",
	Emoji: "表情符号",
	"Choose an emoji": "选择表情符号",
	"Clear icon": "清除图标",
	"Choose icon": "选择图标",
	"Save changes": "保存更改",
	"Targets (optional)": "目标（可选）",
	"Set an optional weekly or monthly goal for how many days you complete this habit. For example, hitting your daily goal on all 7 days is a weekly target of 7. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.":
		"设置可选的每周或每月目标，规定完成该习惯的天数。例如，7 天全部达成每日目标即为周目标 7。开启“完美”开关可自动以该周期的每一天为目标，无论周期多长。",
	"Perfect week": "完美一周",
	"Aim to complete this habit every day of the week.":
		"力争一周中的每一天都完成这个习惯。",
	"Weekly target": "周目标",
	"Optional. Days to complete per week (max 7).":
		"可选。每周需完成的天数（最多 7 天）。",
	None: "无",
	"Perfect month": "完美一月",
	"Aim to complete this habit every day of the month.":
		"力争一个月中的每一天都完成这个习惯。",
	"Monthly target": "月目标",
	"Optional. Days to complete per month.":
		"可选。每月需完成的天数。",
	Colour: "颜色",
	"Pick a colour from your theme, or choose a custom one.":
		"从主题中选择颜色，或自定义一个。",
	"Your habit": "你的习惯",

	// Icon and colour pickers
	"Search icons…": "搜索图标…",
	"Search emojis…": "搜索表情符号…",
	Accent: "强调色",
	Red: "红色",
	Orange: "橙色",
	Yellow: "黄色",
	Green: "绿色",
	Cyan: "青色",
	Blue: "蓝色",
	Purple: "紫色",
	Pink: "粉色",

	// Comments
	"Comments on cards": "卡片评论",
	"Show a comment flap on dashboard cards for jotting a note about any day.":
		"在面板卡片上显示评论翻页，可为任意一天记录备注。",
	"Add comment": "添加评论",
	"Flip back": "翻回正面",
	"Add a comment for this day…": "为这一天添加评论…",
	Comments: "评论",
	"+{n} more": "还有 {n} 条",

	// Limit habits (experimental)
	Experimental: "实验性功能",
	"These features are still being tested and may change before they become permanent. Turning one off only hides it from menus — anything you created with it keeps working.":
		"这些功能仍在测试中，在正式发布前可能会有变化。关闭某项功能只会将其从菜单中隐藏——你用它创建的内容会继续正常工作。",
	"Break bad habits": "戒除坏习惯",
	"Track habits you want to reduce or avoid by staying under a daily limit — for example at most 2 hours of gaming, or no smoking at all.":
		"通过保持在每日限额以下来跟踪你想减少或戒除的习惯——例如每天最多玩 2 小时游戏，或完全不吸烟。",
	Goal: "目标",
	"Reach a target for habits you are building. Stay under a limit for habits you are cutting down or giving up.":
		"要养成的习惯选择达成目标。要减少或戒除的习惯选择保持在限额以下。",
	"Reach a target": "达成目标",
	"Stay under a limit": "保持在限额以下",
	"Binary means avoiding it entirely. Repetition counts against a daily limit. Timed tracks minutes against a daily limit.":
		"二元表示完全避免。重复按每日限额计数。计时按每日限额记录分钟数。",
	"Daily limit": "每日限额",
	"Daily limit (minutes)": "每日限额（分钟）",
	"0 means none at all.": "0 表示完全不做。",
	"Set an optional weekly or monthly goal for how many days you stay within your limit. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.":
		"设置一个可选的每周或每月目标，即有多少天保持在限额以内。打开完美开关即可自动以该时段的每一天为目标，无论其长短。",
	Clean: "未破戒",
	Slipped: "破戒",
	"Mark as clean": "标记为未破戒",
	"Mark as slipped": "标记为破戒",
	"Days within limit": "限额内天数",
	Limit: "限额",
};
