/**
 * Resolve a CSS colour (including `var(...)` references and a habit's own
 * accent) to a concrete `rgb(...)` value Chart.js can use. `root` anchors the
 * probe element to the right document/window (relevant for popout windows).
 */
export function resolveColor(
	root: HTMLElement,
	preferred: string,
	fallback: string,
): string {
	const probe = root.doc.body.createSpan();
	probe.style.color = preferred || fallback;
	const resolved = probe.win.getComputedStyle(probe).color;
	probe.remove();
	return resolved || "#888888";
}

/** Apply an alpha channel to an `rgb(r, g, b)` colour string. */
export function withAlpha(color: string, alpha: number): string {
	const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);
	if (!match) {
		return color;
	}
	return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
}
