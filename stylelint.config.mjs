// CSS checks for styles.css. Syntax errors (an unclosed block, a stray brace)
// always fail; the rules below catch a few mistakes that are valid syntax
// but silently break a stylesheet. Obsidian's plugin review lints CSS too.
export default {
	rules: {
		"no-invalid-double-slash-comments": true,
		"declaration-block-no-duplicate-properties": [
			true,
			// Repeating a property as a fallback (e.g. a plain background
			// before a color-mix() one) is deliberate.
			{ ignore: ["consecutive-duplicates-with-different-syntaxes"] },
		],
	},
};
