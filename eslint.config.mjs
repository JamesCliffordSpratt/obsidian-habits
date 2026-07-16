import tsparser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
	globalIgnores([
		"node_modules/",
		"main.js",
		"esbuild.config.mjs",
		"version-bump.mjs",
		"eslint.config.mjs",
		// package.json is skipped: the recommended config applies type-aware
		// rules globally, which cannot run on JSON files.
		"package.json",
	]),
	...obsidianmd.configs.recommended,
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
		rules: {
			"obsidianmd/ui/sentence-case": [
				"warn",
				{
					brands: ["Lucide", "Obsidian"],
					// The date tokens cover Moment.js format strings such
					// as the YYYY-MM-DD placeholder in the settings tab.
					acronyms: ["ID", "PDF", "YYYY-MM-DD", "YYYYMMDD"],
				},
			],
		},
	},
]);
