/** Japanese translations, keyed by the English source string. */
export const ja: Record<string, string> = {
	// Commands and ribbon
	"Create habit": "習慣を作成",
	"Insert dashboard": "ダッシュボードを挿入",
	"Insert habit metrics": "習慣メトリクスを挿入",
	"Open panel": "パネルを開く",
	"Open habits panel": "習慣パネルを開く",
	Habits: "習慣",

	// Settings
	"Habits folder": "習慣フォルダー",
	"Folder where each habit is stored as its own note. It is created automatically if it does not exist.":
		"各習慣を個別のノートとして保存するフォルダー。存在しない場合は自動的に作成されます。",
	"Follow daily note date": "デイリーノートの日付に従う",
	"When a dashboard is embedded in a daily note (a note whose name contains a date like 2026-07-01), open it on that note's date instead of today.":
		"ダッシュボードがデイリーノート（2026-07-01 のような日付を名前に含むノート）に埋め込まれている場合、今日ではなくそのノートの日付で開きます。",
	"Daily note date format": "デイリーノートの日付形式",
	"Moment.js format used to read the date from a daily note's name, such as YYYY-MM-DD or YYYYMMDD.":
		"デイリーノート名から日付を読み取るための Moment.js 形式。例：YYYY-MM-DD、YYYYMMDD。",
	"Cards per view": "1画面あたりのカード数",
	"How many habit cards the carousel shows at once on wider screens.":
		"広い画面でカルーセルに同時に表示する習慣カードの枚数。",
	"Cards per view on mobile": "モバイルでの1画面あたりのカード数",
	"How many habit cards the carousel shows at once on phone-sized screens.":
		"スマートフォンの画面でカルーセルに同時に表示する習慣カードの枚数。",

	// Confirm dialog defaults
	Cancel: "キャンセル",
	Confirm: "確認",

	// Store notices
	'Could not find the note for "{name}".':
		"「{name}」のノートが見つかりませんでした。",
	"Please enter a valid habit name.": "有効な習慣名を入力してください。",
	'A habit called "{name}" already exists.':
		"「{name}」という習慣はすでに存在します。",
	'Created habit "{name}".': "習慣「{name}」を作成しました。",
	'Updated "{name}".': "「{name}」を更新しました。",
	'Paused "{name}".': "「{name}」を一時停止しました。",
	'Resumed "{name}".': "「{name}」を再開しました。",
	'Stopped tracking "{name}". Its history is kept in the note.':
		"「{name}」のトラッキングを停止しました。履歴はノートに保存されています。",
	'Resumed tracking "{name}".': "「{name}」のトラッキングを再開しました。",
	'Removed "{name}".': "「{name}」を削除しました。",
	"Habit added to the dashboard.": "習慣をダッシュボードに追加しました。",

	// Dashboard
	"Back to habits": "習慣に戻る",
	"View stats": "統計を表示",
	"Export stats": "統計をエクスポート",
	Weekly: "週間",
	Monthly: "月間",
	"Previous day": "前の日",
	"Next day": "次の日",
	"Choose a date": "日付を選択",
	"Add habit": "習慣を追加",
	"No habits yet. Create your first habit to get started.":
		"まだ習慣がありません。最初の習慣を作成して始めましょう。",
	Previous: "前へ",
	Next: "次へ",
	"Go to position {n}": "位置 {n} へ移動",
	"Right-click or long-press for more options":
		"右クリックまたは長押しでその他のオプション",
	"Open habit note": "習慣のノートを開く",
	"Open the note for {name}": "{name} のノートを開く",
	Paused: "一時停止中",
	"Since {date} · right-click to resume":
		"{date} から · 右クリックで再開",
	"Paused on this day": "この日は一時停止中",
	"Mark as done": "完了にする",
	"Mark as not done": "未完了にする",
	Done: "完了",
	"Not done": "未完了",
	"Edit value": "値を編集",
	Value: "値",
	"Decrease by 1": "1 減らす",
	"Increase by 1": "1 増やす",
	"Increase by {n}": "{n} 増やす",
	"Edit habit": "習慣を編集",
	"Pause habit": "習慣を一時停止",
	"Resume habit": "習慣を再開",
	"Stop tracking": "トラッキングを停止",
	"Remove habit": "習慣を削除",
	'Stop tracking "{name}"? It leaves the dashboard and stats, but its note and full history are kept. You can resume tracking any time from the note\'s metrics view.':
		"「{name}」のトラッキングを停止しますか？ダッシュボードと統計から消えますが、ノートと履歴はすべて保存されます。ノートのメトリクス表示からいつでも再開できます。",
	'Remove "{name}"? Its note will be moved to the trash.':
		"「{name}」を削除しますか？ノートはゴミ箱に移動されます。",
	Remove: "削除",
	"Perfect!": "パーフェクト！",
	Today: "今日",
	Yesterday: "昨日",
	Tomorrow: "明日",
	"Last 7 days": "過去7日間",
	"Last 30 days": "過去30日間",
	"This week": "今週",
	"This month": "今月",

	// Sidebar panel
	"Habits completed today": "今日完了した習慣",
	"No habits yet.": "まだ習慣がありません。",
	"Click to type a value": "クリックして値を入力",
	"Open note": "ノートを開く",

	// Stats view
	"No habits to show stats for yet.":
		"統計を表示できる習慣がまだありません。",
	Completion: "達成率",
	"Best streak": "最長ストリーク",
	"Perfect days": "パーフェクトな日",
	Completions: "達成回数",
	"Goals met": "達成した目標",
	"{completed}/{days} days": "{completed}/{days} 日",
	"{total} total": "合計 {total}",
	best: "最高",
	"perfect week": "パーフェクトな週",
	"perfect month": "パーフェクトな月",
	"weekly goal": "週間目標",
	"monthly goal": "月間目標",
	"{progress}/{goal} days · {label} · {pct}%":
		"{progress}/{goal} 日 · {label} · {pct}%",

	// Habit metrics block
	'Place this block inside a habit note, or point it at one with "habit: <name>".':
		"このブロックは習慣ノート内に置くか、「habit: <名前>」で習慣を指定してください。",
	'No habit called "{name}" was found.':
		"「{name}」という習慣は見つかりませんでした。",
	"No longer tracked since {date}. All history is kept.":
		"{date} 以降トラッキングされていません。履歴はすべて保存されています。",
	"No longer tracked. All history is kept.":
		"トラッキングされていません。履歴はすべて保存されています。",
	"Resume tracking": "トラッキングを再開",
	"Paused since {date}. Paused days don't count against streaks or stats.":
		"{date} から一時停止中。一時停止した日はストリークや統計に影響しません。",
	"Paused. Paused days don't count against streaks or stats.":
		"一時停止中。一時停止した日はストリークや統計に影響しません。",
	"Current streak": "現在のストリーク",
	"Days completed": "完了した日数",
	"30-day rate": "30日間の達成率",
	"Weekly completion rate": "週間達成率",
	Logged: "記録",
	Target: "目標",

	// Export modal
	Title: "タイトル",
	"Habits report": "習慣レポート",
	"Date range": "期間",
	"Custom range": "カスタム期間",
	From: "開始",
	To: "終了",
	"Up to {n} days.": "最大 {n} 日。",
	Content: "内容",
	"Summary tiles": "サマリータイル",
	"Completion trend chart": "達成率トレンドのグラフ",
	"Daily grids": "日別グリッド",
	"Goal progress": "目標の進捗",
	Layout: "レイアウト",
	Orientation: "向き",
	Portrait: "縦",
	Landscape: "横",
	Density: "密度",
	Comfortable: "ゆったり",
	Compact: "コンパクト",
	Monochrome: "モノクロ",
	"Ink-friendly greys instead of accent colours.":
		"アクセントカラーの代わりにインクにやさしいグレーを使います。",
	"Export PDF": "PDF をエクスポート",
	"No habits to export yet.":
		"エクスポートできる習慣がまだありません。",
	"Completion trend": "達成率トレンド",
	"(paused)": "（一時停止中）",
	"{rate}% · {total} · streak {current} (best {best})":
		"{rate}% · {total} · ストリーク {current}（最高 {best}）",
	"Goal: {completed}/{goal} days met":
		"目標：{completed}/{goal} 日達成",
	'Exported to "{path}" in your vault.':
		"ボルト内の「{path}」にエクスポートしました。",
	"{range} · exported {date}": "{range} · {date} にエクスポート",

	// Habit modal
	"New habit": "新しい習慣",
	Name: "名前",
	Type: "タイプ",
	"Binary is done or not done. Repetition counts towards a target. Timed tracks minutes.":
		"バイナリは完了か未完了か。回数は目標に向けてカウント。時間は分を記録します。",
	Binary: "バイナリ",
	Repetition: "回数",
	Timed: "時間",
	"Daily target (minutes)": "1日の目標（分）",
	"Daily target": "1日の目標",
	Unit: "単位",
	"Optional label shown next to the count.":
		"カウントの横に表示される任意のラベル。",
	Icon: "アイコン",
	"Choose a Lucide icon or an emoji to represent this habit.":
		"この習慣を表す Lucide アイコンか絵文字を選んでください。",
	Emoji: "絵文字",
	"Choose an emoji": "絵文字を選択",
	"Clear icon": "アイコンをクリア",
	"Choose icon": "アイコンを選択",
	"Save changes": "変更を保存",
	"Targets (optional)": "目標（任意）",
	"Set an optional weekly or monthly goal for how many days you complete this habit. For example, hitting your daily goal on all 7 days is a weekly target of 7. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.":
		"この習慣を達成する日数について、週間または月間の目標を任意で設定できます。たとえば7日間すべてで1日の目標を達成すると週間目標は7です。パーフェクトのスイッチをオンにすると、期間の長さに関係なく毎日を自動的に目指します。",
	"Perfect week": "パーフェクトな週",
	"Aim to complete this habit every day of the week.":
		"この習慣を週の毎日達成することを目指します。",
	"Weekly target": "週間目標",
	"Optional. Days to complete per week (max 7).":
		"任意。1週間に達成する日数（最大7）。",
	None: "なし",
	"Perfect month": "パーフェクトな月",
	"Aim to complete this habit every day of the month.":
		"この習慣を月の毎日達成することを目指します。",
	"Monthly target": "月間目標",
	"Optional. Days to complete per month.":
		"任意。1か月に達成する日数。",
	Colour: "カラー",
	"Pick a colour from your theme, or choose a custom one.":
		"テーマのカラーから選ぶか、カスタムカラーを指定してください。",
	"Your habit": "あなたの習慣",

	// Icon and colour pickers
	"Search icons…": "アイコンを検索…",
	"Search emojis…": "絵文字を検索…",
	Accent: "アクセント",
	Red: "赤",
	Orange: "オレンジ",
	Yellow: "黄",
	Green: "緑",
	Cyan: "シアン",
	Blue: "青",
	Purple: "紫",
	Pink: "ピンク",

	// Comments
	"Comments on cards": "カードのコメント",
	"Show a comment flap on dashboard cards for jotting a note about any day.":
		"ダッシュボードのカードにコメント用のフラップを表示し、その日のメモを書き留められます。",
	"Add comment": "コメントを追加",
	"Flip back": "表に戻す",
	"Add a comment for this day…": "この日のコメントを追加…",
	Comments: "コメント",
	"+{n} more": "他 {n} 件",

	// Limit habits (experimental)
	Experimental: "実験的機能",
	"These features are still being tested and may change before they become permanent. Turning one off only hides it from menus — anything you created with it keeps working.":
		"これらの機能はまだテスト中で、正式版になる前に変更される可能性があります。オフにしてもメニューから隠れるだけで、作成したものはそのまま動き続けます。",
	"Break bad habits": "悪い習慣を断つ",
	"Track habits you want to reduce or avoid by staying under a daily limit — for example at most 2 hours of gaming, or no smoking at all.":
		"1日の上限内に収めることで、減らしたい・やめたい習慣をトラッキングします。たとえばゲームは1日2時間まで、喫煙はゼロなど。",
	Goal: "ゴール",
	"Reach a target for habits you are building. Stay under a limit for habits you are cutting down or giving up.":
		"身につけたい習慣は目標を達成し、減らしたい・やめたい習慣は上限内にとどめます。",
	"Reach a target": "目標を達成する",
	"Stay under a limit": "上限内にとどめる",
	"Binary means avoiding it entirely. Repetition counts against a daily limit. Timed tracks minutes against a daily limit.":
		"バイナリは完全に避けること。回数は1日の上限に対してカウント。時間は1日の上限に対して分を記録します。",
	"Daily limit": "1日の上限",
	"Daily limit (minutes)": "1日の上限（分）",
	"0 means none at all.": "0 は一切なしという意味です。",
	"Set an optional weekly or monthly goal for how many days you stay within your limit. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.":
		"上限内に収めた日数について、週間または月間の目標を任意で設定できます。パーフェクトのスイッチをオンにすると、期間の長さに関係なく毎日を自動的に目指します。",
	Clean: "クリーン",
	Slipped: "スリップ",
	"Mark as clean": "クリーンにする",
	"Mark as slipped": "スリップにする",
	"Days within limit": "上限内の日数",
	Limit: "上限",

	// Frequencies and per-note metrics
	Frequency: "頻度",
	Daily: "毎日",
	"Day of week": "曜日",
	"Day of month": "日にち",
	"How often this habit is due. Weekly and monthly habits only appear on their due date.":
		"この習慣の頻度。週間・月間の習慣は期日にのみ表示されます。",
	"The weekday this habit is due on.":
		"この習慣の期日となる曜日。",
	"The day of the month this habit is due. In shorter months it falls due on the last day, so 31 always lands on the final day of the month.":
		"この習慣の期日となる日。短い月では月末が期日になるため、31 は常にその月の最終日になります。",
	"Every {day}": "毎週 {day}",
	"Monthly · day {day}": "毎月 · {day} 日",
	"No habits are due on this day.":
		"この日に期日の習慣はありません。",
	"Nothing due today.": "今日は期日のものがありません。",
	"Weekly activity": "週間アクティビティ",
	"Monthly activity": "月間アクティビティ",
	"Weeks completed": "完了した週",
	"Months completed": "完了した月",
	"Recent rate": "最近の達成率",
	"{n}-week completion rate": "{n} 週間の達成率",
	"{n}-month completion rate": "{n} か月の達成率",

	// AI summaries
	"AI summaries": "AI サマリー",
	"AI summary": "AI サマリー",
	"Show an AI-generated summary with feedback and advice on the stats page tabs. Uses an OpenAI-compatible service you configure below; your habit stats are sent to it only when you press the generate button.":
		"統計ページのタブに、フィードバックとアドバイス付きの AI 生成サマリーを表示します。下で設定する OpenAI 互換サービスを使用し、習慣の統計は生成ボタンを押したときにのみ送信されます。",
	"AI base URL": "AI ベース URL",
	"Base URL of an OpenAI-compatible API. Works with OpenAI, OpenRouter, or local servers like Ollama (http://localhost:11434/v1).":
		"OpenAI 互換 API のベース URL。OpenAI、OpenRouter、Ollama（http://localhost:11434/v1）などのローカルサーバーで動作します。",
	"AI API key": "AI API キー",
	"Stored locally in this vault's plugin data. Leave blank for local servers that need no key.":
		"このボルトのプラグインデータにローカル保存されます。キー不要のローカルサーバーでは空欄のままにしてください。",
	"AI model": "AI モデル",
	"Model name the service should use.":
		"サービスが使用するモデル名。",
	"Generate summary": "サマリーを生成",
	Regenerate: "再生成",
	"Get feedback and advice on your habits for this period. Your stats are sent to the AI service you configured only when you press the button.":
		"この期間の習慣についてフィードバックとアドバイスを受け取ります。統計は、ボタンを押したときにのみ設定した AI サービスへ送信されます。",
	"Thinking…": "考え中…",
	"Could not generate a summary: {message}":
		"サマリーを生成できませんでした：{message}",
	"Adds an AI-generated overview with feedback and advice. Your habit stats are sent to your configured AI service.":
		"フィードバックとアドバイス付きの AI 生成概要を追加します。習慣の統計は設定した AI サービスへ送信されます。",
	"Generating AI summary…": "AI サマリーを生成中…",
	"The AI summary will be generated when you export.":
		"AI サマリーはエクスポート時に生成されます。",

	// Custom stats range
	Custom: "カスタム",
	"Start date": "開始日",
	"End date": "終了日",

	// Heatmap start markers
	"not tracked yet": "まだ記録なし",
	"started tracking on {date}": "{date} にトラッキング開始",

	// Stats carousel
	"Stats page carousel": "統計ページのカルーセル",
	"Show the per-habit stats as pages you can flip through instead of one long list.":
		"習慣ごとの統計を1つの長いリストではなく、めくれるページとして表示します。",
	"Stats rows per page": "1ページあたりの統計行数",
	"How many habits each stats page shows.":
		"各統計ページに表示する習慣の数。",
};
