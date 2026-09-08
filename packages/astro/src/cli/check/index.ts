//#region -------------------------------------------------- Type Imports

import type { CLI_GenFlags, I_OutputStyler } from "../_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import process from "node:process"
import watcher from "@parcel/watcher"
import { GLOBALS } from "../../globals.js"
import { handleDiag, handleError } from "../_shared/errors.js"
import { getAllAstroAndJSONFileNamesInDir, getAllCSSFileNamesInDir, loadFile } from "../_shared/fs.js"
import { HAQLogger } from "../_shared/logger.js"
import { getAstroDiagnostics } from "./astro-diagnostics.js"
import { getCSSDiagnostics } from "./css-diagnostics.js"
import { getGeneratedData } from "./load.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_check = {
	outputStyler: I_OutputStyler
	flags: CLI_GenFlags
	outDir: string
	numOfGenErrors: number
}
export async function check({ flags, outputStyler, outDir, numOfGenErrors }: ARGS_check): Promise<number> {
	const Logger = new HAQLogger(outputStyler)

	const watchOption = Boolean(flags.w || flags.watch)
	if (!watchOption) {
		return await _main()
	}

	// watch mode

	await _runAndCatch()

	// Initialize watcher

	await watcher.subscribe(
		outDir,
		async (_err, events) => {
			for (const ev of events) {
				if (!ev.path.endsWith(GLOBALS.LOG_FILE_NAME)) continue

				await _runAndCatch()
			}
		},
		{
			ignore: GLOBALS.IGNORABLE_FOLDERS.map((f) => `**/${f}`)
		}
	)

	return 0 // we return 0 because diagnostics will be handled by _runAndCatch()

	//* ---------- Helpers -----------------------------------------------

	async function _main(): Promise<number> {
		Logger.showInfo({ message: "Checking markup and css for errors..." })

		const currentDir = process.cwd()

		const startPerformanceTime = performance.now()

		const { cssDir, projectDir, astroComponentsMap, cssMarkupMap, customElementsMap, listContent } =
			getGeneratedData(currentDir)

		const allAstroAndJSONFileNames = getAllAstroAndJSONFileNamesInDir(projectDir)
		const cssFileNames = getAllCSSFileNamesInDir(projectDir)
		const astroFileNames = allAstroAndJSONFileNames.filter((file) => file.match(GLOBALS.REGEX_ASTRO_EXTENSION))
		const allFileNames = allAstroAndJSONFileNames.concat(cssFileNames)

		const combinedErrorCount = (await __runAstroDiagonstics()) + __runCSSDiagnostics() + numOfGenErrors

		const endPerformanceTime = performance.now()

		Logger.showSuccessSummary({
			parsed: allFileNames.length,
			duration: Math.round(endPerformanceTime - startPerformanceTime)
		})

		return combinedErrorCount

		//* ---------- Run Diagnostics -----------------------------------------------

		async function __runAstroDiagonstics(): Promise<number> {
			let errorCount = 0
			for (const astroFileName of astroFileNames) {
				const file = loadFile(astroFileName)
				if (!file || file.toString().length === 0) continue

				const fileDiagnostics = await getAstroDiagnostics({
					document: file.toString(),
					filePath: astroFileName,
					lists: {
						...listContent
					},
					customElementsMap,
					astroComponentsMap
				})

				for (const diagnostic of fileDiagnostics) {
					errorCount++
					Logger.showDiag(diagnostic)
				}
			}
			return errorCount
		}

		function __runCSSDiagnostics(): number {
			let errorCount = 0

			for (const cssFileName of cssFileNames) {
				const file = loadFile(cssFileName)
				if (!file || file.toString().length === 0) continue

				const fileDiagnostics = getCSSDiagnostics({
					document: file.toString(),
					filePath: cssFileName,
					globalCssPath: cssDir,
					customElementsMap,
					cssMarkupMap,
					rootCustomProperties: listContent.rootCustomProperties
				})

				for (const diagnostic of fileDiagnostics) {
					errorCount++
					Logger.showDiag(diagnostic)
				}
			}
			return errorCount
		}
	}

	async function _runAndCatch(): Promise<void> {
		try {
			const numOfDiagErrors = await _main()
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
