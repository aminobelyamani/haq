//#region -------------------------------------------------- Type Imports

import type { DiagnosticCollection, Disposable, Uri } from "vscode"
import type { RT_makeDiagnostics } from "./diagnostics.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { GLOBALS } from "@haq/astro/tools"
import { commands, window, workspace } from "vscode"
import { loadFile } from "./utils.js"

//#endregion ----------------------------------------------- Module Imports

export const checkCommand = (Diagnostics: RT_makeDiagnostics, collection: DiagnosticCollection): Disposable =>
	commands.registerCommand("haq.check", () => {
		const startLintTime = performance.now()

		collection.clear()

		workspace.findFiles("**/*.{astro,css}", `**/{${GLOBALS.IGNORABLE_FOLDERS.join()}}/**`).then(async (files) => {
			let count = 0
			let errorCount = 0

			for (const file of files) {
				errorCount += await runFileDiagnostics(file, Diagnostics, collection)
				count++
			}

			const endLintTime = performance.now()

			window.showInformationMessage(
				`Checked ${count} out of ${files.length} files succesfully in ${Math.round(endLintTime - startLintTime)} ms`
			)

			if (errorCount > 0) {
				window.showWarningMessage(`Found ${errorCount} error${errorCount > 1 ? "s" : ""}.`)
			}
		})
	})

async function runFileDiagnostics(
	file: Uri,
	Diagnostics: RT_makeDiagnostics,
	collection: DiagnosticCollection
): Promise<number> {
	try {
		const fileContents = loadFile(file.path)
		if (!fileContents) return 0

		const diagnostics = file.path.endsWith(".astro")
			? await Diagnostics.getAstroDiag({
					document: fileContents.toString(),
					sourceFile: file.path
				})
			: Diagnostics.getCSSDiagnosticsFromHAQ({
					document: fileContents.toString(),
					sourceFile: file.path
				})
		collection.set(file, diagnostics)

		return diagnostics.length
	} catch (err) {
		window.showErrorMessage(`Encountered an error while checking diagnostics for file: ${file.path}`)
		console.trace(err)
		return 0
	}
}
