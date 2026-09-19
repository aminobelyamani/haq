//#region -------------------------------------------------- Type Imports

import type { ExtensionContext } from "vscode"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { GLOBALS, makeLspTools } from "@haq/astro/tools"
import { commands, languages, window, workspace } from "vscode"
import { checkCommand } from "./commands.js"
import { astroCompletionProvider, cssCompletionProvider } from "./completions.js"
import { updateDiagnostics } from "./diagnostics.js"
import { getDocumentFromUri, getOpenFiles } from "./utils.js"

//#endregion ----------------------------------------------- Module Imports

export async function activate(context: ExtensionContext): Promise<void> {
	try {
		const currentDir = workspace.workspaceFolders?.at(0)?.uri.fsPath
		if (!currentDir) {
			await showError("Unable to find the current directory.")
			return
		}

		const collection = languages.createDiagnosticCollection(GLOBALS.HAQ_ASTRO_OFFICIAL_NAME)

		const LspTools = makeLspTools({
			currentDir,
			successCallback: () => {
				window.showInformationMessage(`Activated ${GLOBALS.HAQ_ASTRO_OFFICIAL_NAME} succesfully.`)
			},
			errorCallback: async (message: string) => {
				await showError(message)
			},
			updateDiagnosticsCallback: async () => {
				for (const file of getOpenFiles()) {
					const document = await getDocumentFromUri(file)
					if (!document) continue

					await updateDiagnostics(LspTools, document, collection)
				}
			}
		})

		context.subscriptions.push(astroCompletionProvider(LspTools))
		context.subscriptions.push(cssCompletionProvider(LspTools))

		// ON LOAD
		if (window.activeTextEditor) {
			await updateDiagnostics(LspTools, window.activeTextEditor.document, collection)
		}

		// ON SWITCH EDITOR VIEW
		context.subscriptions.push(
			window.onDidChangeActiveTextEditor(async (editor) => {
				if (editor) {
					await updateDiagnostics(LspTools, editor.document, collection)
				}
			})
		)

		// ON CONTENT CHANGE
		context.subscriptions.push(
			workspace.onDidChangeTextDocument(async (event) => {
				await updateDiagnostics(LspTools, event.document, collection)
			})
		)

		//CHECK COMMAND
		context.subscriptions.push(checkCommand(LspTools, collection))
	} catch (err) {
		const message = err instanceof Error ? err.message : "Encountered an unknown error."
		showError(message)
		console.trace(err)
	}
}

// This method is called when your extension is deactivated
export function deactivate(): void {
	window.showInformationMessage(`Extension ${GLOBALS.HAQ_ASTRO_OFFICIAL_NAME} deactivated...`)
}

async function showError(message: string): Promise<void> {
	const value = await window.showErrorMessage(message, "Reload")
	if (value === "Reload") {
		commands.executeCommand("workbench.action.restartExtensionHost")
	}
}
