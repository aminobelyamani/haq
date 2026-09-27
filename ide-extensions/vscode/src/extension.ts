//#region -------------------------------------------------- Type Imports

import type { ExtensionContext } from "vscode"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { HAQ_GLOBALS, isHAQError, makeLspTools } from "@haq/astro/tools"
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

		const collection = languages.createDiagnosticCollection(HAQ_GLOBALS.HAQ_ASTRO_OFFICIAL_NAME)

		const LspTools = makeLspTools({
			currentDir,
			successCallback: () => {
				window.showInformationMessage(`Activated ${HAQ_GLOBALS.HAQ_ASTRO_OFFICIAL_NAME} succesfully.`)
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

		// ON SAVE
		context.subscriptions.push(
			workspace.onDidSaveTextDocument(async (document) => {
				await updateDiagnostics(LspTools, document, collection)
			})
		)

		//CHECK COMMAND
		context.subscriptions.push(checkCommand(LspTools, collection))
	} catch (e) {
		const fullMessage = getErrorMessage(e)
		showError(fullMessage)
		console.trace(e)
	}
}

// This method is called when your extension is deactivated
export function deactivate(): void {
	window.showInformationMessage(`Extension ${HAQ_GLOBALS.HAQ_ASTRO_OFFICIAL_NAME} deactivated...`)
}

function getErrorMessage(e: unknown): string {
	if (isHAQError(e)) {
		let fullMessage = e.message
		if (e.description) fullMessage += `\n${e.description}\n`
		if (e.sourceFiles) {
			for (const file of e.sourceFiles) {
				fullMessage += `\nFILE: ${file}\n`
			}
		}
		return fullMessage
	}
	return "An unknown error occurred."
}

async function showError(message: string): Promise<void> {
	const value = await window.showErrorMessage(message, "Reload")
	if (value === "Reload") {
		commands.executeCommand("workbench.action.restartExtensionHost")
	}
}
