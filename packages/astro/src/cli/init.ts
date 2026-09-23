//#region -------------------------------------------------- Type Imports

import type { I_OutputStyler } from "./_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { copyFile } from "node:fs/promises"
import process from "node:process"
import { GLOBALS } from "../globals.js"
import { HAQLogger } from "./_shared/logger.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_init = {
	outputStyler: I_OutputStyler
}
export async function init({ outputStyler }: ARGS_init): Promise<void> {
	const currentDir = process.cwd()

	await copyFile(
		new URL(`../../${GLOBALS.INTERNAL_GENERATED_TYPES_FOLDER}/${GLOBALS.HAQ_CONFIG_JSON_FILE_NAME}`, import.meta.url),
		`${currentDir}/${GLOBALS.HAQ_CONFIG_JSON_FILE_NAME}`
	)

	const Logger = new HAQLogger(outputStyler)

	Logger.showSuccessSummary({
		message: "HAQ Config initialized.",
		description: "Update the config values according to your project setup."
	})
}
