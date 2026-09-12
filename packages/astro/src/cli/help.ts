//#region -------------------------------------------------- Type Imports

import type { HelpDisplayPayload, I_OutputStyler } from "./_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { HAQLogger } from "./_shared/logger.js"

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
				description: "Adds a haq.config.json file to your project root."
			},

			{
				cmd: "compile",
				description: "Generates types and runs diagnostics.",
				flags: [["-w, --watch", "Watches files for changes and reruns."]]
			},

			{
				cmd: "env",
				description: "Generates types and a runtime zod schema object from your .env file.",
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
				description: "Generates scaffolding for your custom element.",
				flags: [
					["-t, --tag", "Tag name for your custom element."],
					["-o, --output", "Output dir path."]
				]
			},

			{
				cmd: "webc",
				description: "Generates scaffolding for your Web Component.",
				flags: [
					["-t, --tag", "Tag name for your Web Component."],
					["-o, --output", "Output dir path."]
				]
			},

			{
				cmd: "appc",
				description: "Generates scaffolding for your App Component.",
				flags: [
					["-n, --name", "Component name for your App Component."],
					["-o, --output", "Output dir path."]
				]
			},

			{
				cmd: "help",
				description: "Shows this help message."
			}
		]
	}
	const Logger = new HAQLogger(outputStyler)
	Logger.showHelp(DEFAULT_HELP_PAYLOAD)
}
