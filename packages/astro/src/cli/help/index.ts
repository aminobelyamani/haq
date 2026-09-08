//#region -------------------------------------------------- Type Imports

import type { HelpDisplayPayload, I_OutputStyler } from "../_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { HAQLogger } from "../_shared/logger.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_help = {
	outputStyler: I_OutputStyler
}
export function help({ outputStyler }: ARGS_help): void {
	const DEFAULT_HELP_PAYLOAD: HelpDisplayPayload = {
		usage: "[command] [...flags]",
		headline: "Build performant type safe websites and applications.",
		tables: [
			{
				cmd: "init",
				description: "Add a haq.config.json file to your project root."
			},
			{
				cmd: "gen",
				description: "Generate types and contexts from your Astro markup and css.",
				flags: [["-w, --watch", "Watches files for changes and reruns."]]
			},
			{
				cmd: "check",
				description: "Check your Astro and css files for any HAQ errors.",
				note: "Will always generate before checking, so safe to use in your CI pipeline.",
				flags: [["-w, --watch", "Watches files for changes and reruns."]]
			},
			{
				cmd: "env",
				description: "Generate types and a runtime zod schema object from your .env file.",
				note: "The generated files can be used with the validateEnv() function from @haq/astro/tools.",
				flags: [
					["-i, --input", "Relative path to your .env file."],
					["-o, --output", "Output dir path."],
					[
						"-m, --modes",
						"Custom NODE_ENV modes separated by commas (optional). Defaults to development,test,production"
					]
				]
			},
			{
				cmd: "ce",
				description: "Generate scaffolding for your custom element.",
				flags: [
					["-t, --tag", "Tag name for your custom element."],
					["-o, --output", "Output dir path."]
				]
			},
			{
				cmd: "webc",
				description: "Generate scaffolding for your Web Component.",
				flags: [
					["-t, --tag", "Tag name for your Web Component."],
					["-o, --output", "Output dir path."]
				]
			},
			{
				cmd: "appc",
				description: "Generate scaffolding for your App Component.",
				flags: [
					["-n, --name", "Component name for your App Component."],
					["-o, --output", "Output dir path."]
				]
			},

			{
				cmd: "help",
				description: "Show this help message."
			}
		]
	}
	const Logger = new HAQLogger(outputStyler)
	Logger.showHelp(DEFAULT_HELP_PAYLOAD)
}
