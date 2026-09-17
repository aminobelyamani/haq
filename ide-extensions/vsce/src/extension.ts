//#region -------------------------------------------------- Type Imports

import type * as vscode from "vscode"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { GLOBALS, makeLspTools } from "@haq/astro/tools"
import { commands, languages, window, workspace } from "vscode"
import { checkCommand } from "./commands.js"
import { astroCompletionProvider, cssCompletionProvider } from "./completions.js"
import { updateDiagnostics } from "./diagnostics.js"

//#endregion ----------------------------------------------- Module Imports

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	try {
		const currentDir = workspace.workspaceFolders?.at(0)?.uri.fsPath
		if (!currentDir) {
			await showError("Unable to find the current directory.")
			return
		}

		const LspTools = makeLspTools({
			currentDir,
			successCallback: () => {
				window.showInformationMessage(`Activated ${GLOBALS.VS_CODE_EXTENSION_NAME} succesfully.`)
			}
		})

		const collection = languages.createDiagnosticCollection(GLOBALS.VS_CODE_EXTENSION_NAME)

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
	console.info(`Extension ${GLOBALS.VS_CODE_EXTENSION_NAME} deactivated...`)
}

async function showError(message: string): Promise<void> {
	const value = await window.showErrorMessage(message, "Reload")
	if (value === "Reload") {
		commands.executeCommand("workbench.action.reloadWindow")
	}
}
