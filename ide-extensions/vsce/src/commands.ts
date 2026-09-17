//#region -------------------------------------------------- Type Imports

import type { I_LSPTools } from "@haq/astro/tools"
import type { DiagnosticCollection, Disposable, TextDocument, Uri } from "vscode"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { GLOBALS } from "@haq/astro/tools"
import { commands, window, workspace } from "vscode"
import { updateDiagnostics } from "./diagnostics.js"

//#endregion ----------------------------------------------- Module Imports

export const checkCommand = (LspTools: I_LSPTools, collection: DiagnosticCollection): Disposable =>
	commands.registerCommand("haq-astro-vsce.check", () => {
		const startLintTime = performance.now()

		collection.clear()

		workspace.findFiles("**/*.{astro,css}", `**/{${GLOBALS.IGNORABLE_FOLDERS.join()}}/**`).then(async (files) => {
			let count = 0
			let errorCount = 0

			for (const file of files) {
				const document = await getDocumentFromUri(file)
				if (!document) continue

				errorCount += await updateDiagnostics(LspTools, document, collection)
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

async function getDocumentFromUri(uri: Uri): Promise<TextDocument | undefined> {
	try {
		// Retrieves the document object into memory without showing it in the editor UI
		return await workspace.openTextDocument(uri)
	} catch (error) {
		console.error("Failed to load text document:", error)
		return undefined
	}
}
