//#region -------------------------------------------------- Type Imports

import type { CLI_CompileFlags, I_OutputStyler } from "../_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import fs from "node:fs"
import { copyFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import watcher from "@parcel/watcher"
import { GLOBALS } from "../../globals.js"
import { handleDiag, handleError } from "../_shared/errors.js"
import { filePathExistsOrThrow, isAstroFile, isCssFile, isHaqJsonFile } from "../_shared/fs.js"
import { HAQLogger } from "../_shared/logger.js"
import { getProjectConfig, loadNativeElementsJson } from "../_shared/validation.js"
import { main } from "./main.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_compile = {
	flags: CLI_CompileFlags
	outputStyler: I_OutputStyler
}

type RT_compile = {
	numOfGenErrors: number
	outDir: string
}
export async function compile({ flags, outputStyler }: ARGS_compile): Promise<RT_compile> {
	const currentDir = process.cwd()

	const configContent = getProjectConfig(currentDir)

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

	const nativeElementsJsonContent = loadNativeElementsJson(outDir)

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
				outputStyler,
				nativeElementsJsonContent
			}),
			outDir
		}
	}

	// watch mode

	// Initialize watcher
	const fileIsWatchable = (filePath: string): boolean =>
		isAstroFile(filePath) || isCssFile(filePath) || isHaqJsonFile(filePath)

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
				outputStyler,
				nativeElementsJsonContent
			})
			handleDiag(numOfDiagErrors)
			_showWatchDisplay()
		} catch (err) {
			handleError({ err, outputStyler })
			_showWatchDisplay()
		}
	}

	function _showWatchDisplay(): void {
		Logger.showInfo({ message: "Watching *.{astro,css,haq.json} files for changes..." })
	}
}
