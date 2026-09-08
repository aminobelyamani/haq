//#region -------------------------------------------------- Type Imports

import type { CLI_GenFlags, I_OutputStyler } from "../_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import fs from "node:fs"
import { copyFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import watcher from "@parcel/watcher"
import { GLOBALS } from "../../globals.js"
import { HAQError, handleDiag, handleError } from "../_shared/errors.js"
import { filePathExistsOrThrow, loadJSONFile } from "../_shared/fs.js"
import { HAQLogger } from "../_shared/logger.js"
import { isConfigValid } from "../_shared/validation.js"
import { main } from "./main.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_gen = {
	flags: CLI_GenFlags
	outputStyler: I_OutputStyler
	isCheckMode?: true
}

type RT_gen = {
	numOfGenErrors: number
	outDir: string
}
export async function gen({ flags, outputStyler, isCheckMode }: ARGS_gen): Promise<RT_gen> {
	const currentDir = process.cwd()
	const configFile = `${currentDir}/${GLOBALS.HAQ_CONFIG_JSON_FILE_NAME}`

	// config file must exist

	filePathExistsOrThrow({
		filePath: configFile,
		kind: "config file",
		description: `Make sure to include a configured "${GLOBALS.HAQ_CONFIG_JSON_FILE_NAME}" file in the root of your project.\nYou can run "haq init" to add a config file.`
	})

	// load config json content

	const configContent = loadJSONFile(configFile)

	// validate

	if (!isConfigValid(configContent)) {
		throw new HAQError({
			message: "Invalid Config.",
			description: `Run "haq init" to setup a correct config for your project.`,
			sourceFiles: [configFile]
		})
	}

	const outDirInput = path.join(currentDir, configContent.outDir)
	const projectDir = path.join(currentDir, configContent.projectDir)
	const globalCssDir = path.join(currentDir, configContent.globalCssDir)
	const astroDirs = configContent.astroDirs.map((d) => path.relative(currentDir, d))

	filePathExistsOrThrow({
		filePath: outDirInput,
		kind: "outDir"
	})

	filePathExistsOrThrow({
		filePath: projectDir,
		kind: "projectDir"
	})

	filePathExistsOrThrow({
		filePath: globalCssDir,
		kind: "globalCssDir"
	})

	for (const d of astroDirs) {
		filePathExistsOrThrow({
			filePath: d,
			kind: "astroDir"
		})
	}

	const outDir = `${outDirInput}/${GLOBALS.GENERATED_TYPES_FOLDER}`

	// copy static generated files if don't exist

	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir)
	}

	if (!fs.existsSync(`${outDir}/${GLOBALS.NATIVE_ELEMENTS_JSON_FILE_NAME}`)) {
		await copyFile(
			new URL(
				`../../../${GLOBALS.INTERNAL_GENERATED_TYPES_FOLDER}/${GLOBALS.NATIVE_ELEMENTS_JSON_FILE_NAME}`,
				import.meta.url
			),
			`${outDir}/${GLOBALS.NATIVE_ELEMENTS_JSON_FILE_NAME}`
		)
	}

	if (!fs.existsSync(`${outDir}/${GLOBALS.GLOBAL_DECLARATIONS_FILE_NAME}`)) {
		await copyFile(
			new URL(
				`../../../${GLOBALS.INTERNAL_GENERATED_TYPES_FOLDER}/${GLOBALS.GLOBAL_DECLARATIONS_TXT_FILE_NAME}`,
				import.meta.url
			),
			`${outDir}/${GLOBALS.GLOBAL_DECLARATIONS_FILE_NAME}`
		)
	}

	if (!fs.existsSync(`${outDir}/${GLOBALS.NULLABLE_COMPONENT_NAME}.astro`)) {
		await copyFile(
			new URL(
				`../../../${GLOBALS.INTERNAL_GENERATED_TYPES_FOLDER}/${GLOBALS.NULLABLE_COMPONENT_NAME}.astro`,
				import.meta.url
			),
			`${outDir}/${GLOBALS.NULLABLE_COMPONENT_NAME}.astro`
		)
	}

	if (!fs.existsSync(`${outDir}/${GLOBALS.LOG_FILE_NAME}`)) {
		await copyFile(
			new URL(`../../../${GLOBALS.INTERNAL_GENERATED_TYPES_FOLDER}/${GLOBALS.LOG_FILE_NAME}`, import.meta.url),
			`${outDir}/${GLOBALS.LOG_FILE_NAME}`
		)
	}

	// run

	const Logger = new HAQLogger(outputStyler)

	// run and exit if no watch mode

	const watchOption = Boolean(flags.w || flags.watch)
	if (!watchOption) {
		return {
			numOfGenErrors: await main({
				projectDir,
				outDir,
				astroDirs,
				globalCssDir,
				outputStyler
			}),
			outDir
		}
	}

	// watch mode

	// Initialize watcher
	const fileIsWatchable = (filePath: string): boolean =>
		filePath.endsWith(".astro") || filePath.endsWith(".css") || filePath.endsWith(".haq.json")

	await watcher.subscribe(
		configContent.projectDir,
		async (_err, events) => {
			for (const ev of events) {
				if (!fileIsWatchable(ev.path)) continue

				await _runAndCatch()
			}
		},
		{
			ignore: GLOBALS.IGNORABLE_FOLDERS.map((f) => `**/${f}`)
		}
	)
	await _runAndCatch()
	return {
		numOfGenErrors: 0, // we return 0 because diagnostics will be handled by _runAndCatch()
		outDir
	}

	//* ---------- Helpers -----------------------------------------------

	async function _runAndCatch(): Promise<void> {
		try {
			Logger.clear()
			const numOfDiagErrors = await main({
				projectDir,
				outDir,
				astroDirs,
				globalCssDir,
				outputStyler
			})
			handleDiag(numOfDiagErrors)
			_showWatchDisplay()
		} catch (err) {
			handleError({ err, outputStyler })
			_showWatchDisplay()
		}
	}

	function _showWatchDisplay(): void {
		if (isCheckMode) return // watch display handled by check command
		Logger.showInfo({ message: "Watching *.{astro,css,haq.json} files for changes..." })
	}
}
