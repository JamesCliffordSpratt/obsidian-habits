/** Korean translations, keyed by the English source string. */
export const ko: Record<string, string> = {
	// Commands and ribbon
	"Create habit": "습관 만들기",
	"Insert dashboard": "대시보드 삽입",
	"Insert habit metrics": "습관 지표 삽입",
	"Open panel": "패널 열기",
	"Open habits panel": "습관 패널 열기",
	Habits: "습관",

	// Settings
	"Habits folder": "습관 폴더",
	"Folder where each habit is stored as its own note. It is created automatically if it does not exist.":
		"각 습관이 개별 노트로 저장되는 폴더입니다. 없으면 자동으로 생성됩니다.",
	"Follow daily note date": "데일리 노트 날짜 따라가기",
	"When a dashboard is embedded in a daily note (a note whose name contains a date like 2026-07-01), open it on that note's date instead of today.":
		"대시보드가 데일리 노트(이름에 2026-07-01 같은 날짜가 포함된 노트)에 삽입된 경우, 오늘 대신 해당 노트의 날짜로 엽니다.",
	"Daily note date format": "데일리 노트 날짜 형식",
	"Moment.js format used to read the date from a daily note's name, such as YYYY-MM-DD or YYYYMMDD.":
		"데일리 노트 이름에서 날짜를 읽는 데 사용하는 Moment.js 형식입니다. 예: YYYY-MM-DD, YYYYMMDD.",
	"Cards per view": "한 화면당 카드 수",
	"How many habit cards the carousel shows at once on wider screens.":
		"넓은 화면에서 캐러셀에 한 번에 표시할 습관 카드 수입니다.",
	"Cards per view on mobile": "모바일 한 화면당 카드 수",
	"How many habit cards the carousel shows at once on phone-sized screens.":
		"휴대폰 화면에서 캐러셀에 한 번에 표시할 습관 카드 수입니다.",

	// Confirm dialog defaults
	Cancel: "취소",
	Confirm: "확인",

	// Store notices
	'Could not find the note for "{name}".':
		"“{name}”의 노트를 찾을 수 없습니다.",
	"Please enter a valid habit name.": "올바른 습관 이름을 입력하세요.",
	'A habit called "{name}" already exists.':
		"“{name}” 습관이 이미 있습니다.",
	'Created habit "{name}".': "습관 “{name}”을(를) 만들었습니다.",
	'Updated "{name}".': "“{name}”을(를) 업데이트했습니다.",
	'Paused "{name}".': "“{name}”을(를) 일시정지했습니다.",
	'Resumed "{name}".': "“{name}”을(를) 재개했습니다.",
	'Stopped tracking "{name}". Its history is kept in the note.':
		"“{name}” 추적을 중단했습니다. 기록은 노트에 보관됩니다.",
	'Resumed tracking "{name}".': "“{name}” 추적을 재개했습니다.",
	'Removed "{name}".': "“{name}”을(를) 삭제했습니다.",
	"Habit added to the dashboard.": "습관을 대시보드에 추가했습니다.",

	// Dashboard
	"Back to habits": "습관으로 돌아가기",
	"View stats": "통계 보기",
	"Export stats": "통계 내보내기",
	Weekly: "주간",
	Monthly: "월간",
	"Previous day": "이전 날",
	"Next day": "다음 날",
	"Choose a date": "날짜 선택",
	"Add habit": "습관 추가",
	"No habits yet. Create your first habit to get started.":
		"아직 습관이 없습니다. 첫 습관을 만들어 시작해 보세요.",
	Previous: "이전",
	Next: "다음",
	"Go to position {n}": "{n}번 위치로 이동",
	"Right-click or long-press for more options":
		"더 많은 옵션은 우클릭 또는 길게 누르기",
	"Open habit note": "습관 노트 열기",
	"Open the note for {name}": "{name} 노트 열기",
	Paused: "일시정지됨",
	"Since {date} · right-click to resume":
		"{date}부터 · 우클릭으로 재개",
	"Paused on this day": "이 날은 일시정지됨",
	"Mark as done": "완료로 표시",
	"Mark as not done": "미완료로 표시",
	Done: "완료",
	"Not done": "미완료",
	"Edit value": "값 편집",
	Value: "값",
	"Decrease by 1": "1 줄이기",
	"Increase by 1": "1 늘리기",
	"Increase by {n}": "{n} 늘리기",
	"Edit habit": "습관 편집",
	"Pause habit": "습관 일시정지",
	"Resume habit": "습관 재개",
	"Stop tracking": "추적 중단",
	"Remove habit": "습관 삭제",
	'Stop tracking "{name}"? It leaves the dashboard and stats, but its note and full history are kept. You can resume tracking any time from the note\'s metrics view.':
		"“{name}” 추적을 중단할까요? 대시보드와 통계에서 사라지지만 노트와 전체 기록은 보관됩니다. 노트의 지표 화면에서 언제든지 다시 시작할 수 있습니다.",
	'Remove "{name}"? Its note will be moved to the trash.':
		"“{name}”을(를) 삭제할까요? 노트는 휴지통으로 이동합니다.",
	Remove: "삭제",
	"Perfect!": "퍼펙트!",
	Today: "오늘",
	Yesterday: "어제",
	Tomorrow: "내일",
	"Last 7 days": "지난 7일",
	"Last 30 days": "지난 30일",
	"This week": "이번 주",
	"This month": "이번 달",

	// Sidebar panel
	"Habits completed today": "오늘 완료한 습관",
	"No habits yet.": "아직 습관이 없습니다.",
	"Click to type a value": "클릭해서 값 입력",
	"Open note": "노트 열기",

	// Stats view
	"No habits to show stats for yet.":
		"아직 통계를 표시할 습관이 없습니다.",
	Completion: "달성률",
	"Best streak": "최고 연속 기록",
	"Perfect days": "퍼펙트한 날",
	Completions: "달성 횟수",
	"Goals met": "달성한 목표",
	"{completed}/{days} days": "{completed}/{days}일",
	"{total} total": "총 {total}",
	best: "최고",
	"perfect week": "퍼펙트한 주",
	"perfect month": "퍼펙트한 달",
	"weekly goal": "주간 목표",
	"monthly goal": "월간 목표",
	"{progress}/{goal} days · {label} · {pct}%":
		"{progress}/{goal}일 · {label} · {pct}%",

	// Habit metrics block
	'Place this block inside a habit note, or point it at one with "habit: <name>".':
		"이 블록을 습관 노트 안에 넣거나 “habit: <이름>”으로 습관을 지정하세요.",
	'No habit called "{name}" was found.':
		"“{name}” 습관을 찾을 수 없습니다.",
	"No longer tracked since {date}. All history is kept.":
		"{date}부터 더 이상 추적하지 않습니다. 모든 기록은 보관됩니다.",
	"No longer tracked. All history is kept.":
		"더 이상 추적하지 않습니다. 모든 기록은 보관됩니다.",
	"Resume tracking": "추적 재개",
	"Paused since {date}. Paused days don't count against streaks or stats.":
		"{date}부터 일시정지됨. 일시정지된 날은 연속 기록이나 통계에 영향을 주지 않습니다.",
	"Paused. Paused days don't count against streaks or stats.":
		"일시정지됨. 일시정지된 날은 연속 기록이나 통계에 영향을 주지 않습니다.",
	"Current streak": "현재 연속 기록",
	"Days completed": "완료한 일수",
	"30-day rate": "30일 달성률",
	"Weekly completion rate": "주간 달성률",
	Logged: "기록",
	Target: "목표",

	// Export modal
	Title: "제목",
	"Habits report": "습관 보고서",
	"Date range": "기간",
	"Custom range": "사용자 지정 기간",
	From: "시작",
	To: "끝",
	"Up to {n} days.": "최대 {n}일.",
	Content: "내용",
	"Summary tiles": "요약 타일",
	"Completion trend chart": "달성률 추이 차트",
	"Daily grids": "일별 그리드",
	"Goal progress": "목표 진행률",
	Layout: "레이아웃",
	Orientation: "방향",
	Portrait: "세로",
	Landscape: "가로",
	Density: "밀도",
	Comfortable: "여유",
	Compact: "간결",
	Monochrome: "흑백",
	"Ink-friendly greys instead of accent colours.":
		"강조 색 대신 잉크를 아끼는 회색을 사용합니다.",
	"Export PDF": "PDF 내보내기",
	"No habits to export yet.":
		"아직 내보낼 습관이 없습니다.",
	"Completion trend": "달성률 추이",
	"(paused)": "(일시정지됨)",
	"{rate}% · {total} · streak {current} (best {best})":
		"{rate}% · {total} · 연속 {current} (최고 {best})",
	"Goal: {completed}/{goal} days met":
		"목표: {completed}/{goal}일 달성",
	'Exported to "{path}" in your vault.':
		"보관소의 “{path}”에 내보냈습니다.",
	"{range} · exported {date}": "{range} · {date} 내보냄",

	// Habit modal
	"New habit": "새 습관",
	Name: "이름",
	Type: "유형",
	"Binary is done or not done. Repetition counts towards a target. Timed tracks minutes.":
		"이진은 완료 여부만 기록합니다. 반복은 목표 횟수를 세고, 시간은 분을 기록합니다.",
	Binary: "이진",
	Repetition: "반복",
	Timed: "시간",
	"Daily target (minutes)": "일일 목표(분)",
	"Daily target": "일일 목표",
	Unit: "단위",
	"Optional label shown next to the count.":
		"횟수 옆에 표시되는 선택적 라벨입니다.",
	Icon: "아이콘",
	"Choose a Lucide icon or an emoji to represent this habit.":
		"이 습관을 나타낼 Lucide 아이콘이나 이모지를 선택하세요.",
	Emoji: "이모지",
	"Choose an emoji": "이모지 선택",
	"Clear icon": "아이콘 지우기",
	"Choose icon": "아이콘 선택",
	"Save changes": "변경 사항 저장",
	"Targets (optional)": "목표(선택)",
	"Set an optional weekly or monthly goal for how many days you complete this habit. For example, hitting your daily goal on all 7 days is a weekly target of 7. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.":
		"이 습관을 달성할 일수에 대한 주간 또는 월간 목표를 선택적으로 설정하세요. 예를 들어 7일 모두 일일 목표를 달성하면 주간 목표는 7입니다. 퍼펙트 토글을 켜면 기간 길이와 관계없이 자동으로 매일을 목표로 합니다.",
	"Perfect week": "퍼펙트한 주",
	"Aim to complete this habit every day of the week.":
		"이 습관을 일주일 내내 달성하는 것을 목표로 합니다.",
	"Weekly target": "주간 목표",
	"Optional. Days to complete per week (max 7).":
		"선택. 일주일에 달성할 일수(최대 7).",
	None: "없음",
	"Perfect month": "퍼펙트한 달",
	"Aim to complete this habit every day of the month.":
		"이 습관을 한 달 내내 달성하는 것을 목표로 합니다.",
	"Monthly target": "월간 목표",
	"Optional. Days to complete per month.":
		"선택. 한 달에 달성할 일수.",
	Colour: "색상",
	"Pick a colour from your theme, or choose a custom one.":
		"테마 색상 중에서 고르거나 사용자 지정 색상을 선택하세요.",
	"Your habit": "나의 습관",

	// Icon and colour pickers
	"Search icons…": "아이콘 검색…",
	"Search emojis…": "이모지 검색…",
	Accent: "강조",
	Red: "빨강",
	Orange: "주황",
	Yellow: "노랑",
	Green: "초록",
	Cyan: "청록",
	Blue: "파랑",
	Purple: "보라",
	Pink: "분홍",

	// Comments
	"Comments on cards": "카드 코멘트",
	"Show a comment flap on dashboard cards for jotting a note about any day.":
		"대시보드 카드에 코멘트 플랩을 표시해 그날에 대한 메모를 남길 수 있습니다.",
	"Add comment": "코멘트 추가",
	"Flip back": "앞면으로 돌리기",
	"Add a comment for this day…": "이 날에 대한 코멘트 추가…",
	Comments: "코멘트",
	"+{n} more": "+{n}개 더",

	// Limit habits (experimental)
	Experimental: "실험 기능",
	"These features are still being tested and may change before they become permanent. Turning one off only hides it from menus — anything you created with it keeps working.":
		"이 기능들은 아직 테스트 중이며 정식 기능이 되기 전에 바뀔 수 있습니다. 끄면 메뉴에서 숨겨질 뿐, 이미 만든 것은 계속 작동합니다.",
	"Break bad habits": "나쁜 습관 끊기",
	"Track habits you want to reduce or avoid by staying under a daily limit — for example at most 2 hours of gaming, or no smoking at all.":
		"하루 한도 안에 머무는 방식으로 줄이거나 피하고 싶은 습관을 추적합니다. 예: 게임 하루 최대 2시간, 금연.",
	Goal: "목표",
	"Reach a target for habits you are building. Stay under a limit for habits you are cutting down or giving up.":
		"만들고 싶은 습관은 목표를 달성하고, 줄이거나 끊고 싶은 습관은 한도 안에 머뭅니다.",
	"Reach a target": "목표 달성하기",
	"Stay under a limit": "한도 안에 머물기",
	"Binary means avoiding it entirely. Repetition counts against a daily limit. Timed tracks minutes against a daily limit.":
		"이진은 완전히 피하는 것을 뜻합니다. 반복은 하루 한도에 대해 횟수를 세고, 시간은 하루 한도에 대해 분을 기록합니다.",
	"Daily limit": "일일 한도",
	"Daily limit (minutes)": "일일 한도(분)",
	"0 means none at all.": "0은 전혀 하지 않음을 뜻합니다.",
	"Set an optional weekly or monthly goal for how many days you stay within your limit. Turn on a perfect toggle to aim for every day of the period automatically, whatever its length.":
		"한도 안에 머문 일수에 대한 주간 또는 월간 목표를 선택적으로 설정하세요. 퍼펙트 토글을 켜면 기간 길이와 관계없이 자동으로 매일을 목표로 합니다.",
	Clean: "클린",
	Slipped: "실수",
	"Mark as clean": "클린으로 표시",
	"Mark as slipped": "실수로 표시",
	"Days within limit": "한도 내 일수",
	Limit: "한도",

	// Frequencies and per-note metrics
	Frequency: "주기",
	Daily: "매일",
	"Day of week": "요일",
	"Day of month": "날짜(일)",
	"How often this habit is due. Weekly and monthly habits only appear on their due date.":
		"이 습관의 주기입니다. 주간·월간 습관은 예정일에만 표시됩니다.",
	"The weekday this habit is due on.":
		"이 습관의 예정 요일입니다.",
	"The day of the month this habit is due. In shorter months it falls due on the last day, so 31 always lands on the final day of the month.":
		"이 습관의 예정 일자입니다. 더 짧은 달에는 마지막 날로 넘어가므로 31은 항상 그 달의 마지막 날이 됩니다.",
	"Every {day}": "매주 {day}",
	"Monthly · day {day}": "매월 {day}일",
	"No habits are due on this day.":
		"이 날에 예정된 습관이 없습니다.",
	"Nothing due today.": "오늘은 예정된 것이 없습니다.",
	"Weekly activity": "주간 활동",
	"Monthly activity": "월간 활동",
	"Weeks completed": "완료한 주",
	"Months completed": "완료한 달",
	"Recent rate": "최근 달성률",
	"{n}-week completion rate": "{n}주 달성률",
	"{n}-month completion rate": "{n}개월 달성률",

	// AI summaries
	"AI summaries": "AI 요약",
	"AI summary": "AI 요약",
	"Show an AI-generated summary with feedback and advice on the stats page tabs. Uses an OpenAI-compatible service you configure below; your habit stats are sent to it only when you press the generate button.":
		"통계 페이지 탭에 피드백과 조언이 담긴 AI 생성 요약을 표시합니다. 아래에서 설정한 OpenAI 호환 서비스를 사용하며, 습관 통계는 생성 버튼을 눌렀을 때만 전송됩니다.",
	"AI base URL": "AI 기본 URL",
	"Base URL of an OpenAI-compatible API. Works with OpenAI, OpenRouter, or local servers like Ollama (http://localhost:11434/v1).":
		"OpenAI 호환 API의 기본 URL입니다. OpenAI, OpenRouter 또는 Ollama(http://localhost:11434/v1) 같은 로컬 서버에서 작동합니다.",
	"AI API key": "AI API 키",
	"Stored locally in this vault's plugin data. Leave blank for local servers that need no key.":
		"이 보관소의 플러그인 데이터에 로컬로 저장됩니다. 키가 필요 없는 로컬 서버라면 비워 두세요.",
	"AI model": "AI 모델",
	"Model name the service should use.":
		"서비스가 사용할 모델 이름입니다.",
	"Generate summary": "요약 생성",
	Regenerate: "다시 생성",
	"Get feedback and advice on your habits for this period. Your stats are sent to the AI service you configured only when you press the button.":
		"이 기간의 습관에 대한 피드백과 조언을 받습니다. 통계는 버튼을 눌렀을 때만 설정한 AI 서비스로 전송됩니다.",
	"Thinking…": "생각 중…",
	"Could not generate a summary: {message}":
		"요약을 생성하지 못했습니다: {message}",
	"Adds an AI-generated overview with feedback and advice. Your habit stats are sent to your configured AI service.":
		"피드백과 조언이 담긴 AI 생성 개요를 추가합니다. 습관 통계가 설정한 AI 서비스로 전송됩니다.",
	"Generating AI summary…": "AI 요약 생성 중…",
	"The AI summary will be generated when you export.":
		"AI 요약은 내보낼 때 생성됩니다.",

	// Custom stats range
	Custom: "사용자 지정",
	"Start date": "시작일",
	"End date": "종료일",

	// Heatmap start markers
	"not tracked yet": "아직 기록 없음",
	"started tracking on {date}": "{date}에 추적 시작",

	// Stats carousel
	"Stats page carousel": "통계 페이지 캐러셀",
	"Show the per-habit stats as pages you can flip through instead of one long list.":
		"습관별 통계를 긴 목록 대신 넘겨 볼 수 있는 페이지로 표시합니다.",
	"Stats rows per page": "페이지당 통계 행 수",
	"How many habits each stats page shows.":
		"각 통계 페이지에 표시할 습관 수입니다.",
};
