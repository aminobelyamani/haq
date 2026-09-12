//#region -------------------------------------------------- Type Imports

import type * as vscode from "vscode"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { GLOBALS } from "@haq/astro/tools"
import { commands, languages, window, workspace } from "vscode"
import { astroCompletionProvider } from "./astro-completions.js"
import { checkCommand } from "./commands.js"
import { cssCompletionProvider } from "./css-completions.js"
import { makeDiagnostics } from "./diagnostics.js"
import { makeLists } from "./lists.js"

//#endregion ----------------------------------------------- Module Imports

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const logFile = await getFileByName(`${GLOBALS.GENERATED_TYPES_FOLDER}/${GLOBALS.LOG_FILE_NAME}`)

	if (!logFile[0]) {
		await showError(GLOBALS.LOG_FILE_NAME)
		return
	}

	const Lists = makeLists({
		LOG_FILE_PATH: logFile[0].path
	})
	Lists.init()

	const Diagnostics = makeDiagnostics(Lists)

	const collection = languages.createDiagnosticCollection(GLOBALS.VS_CODE_EXTENSION_NAME)

	context.subscriptions.push(astroCompletionProvider(Lists))
	context.subscriptions.push(cssCompletionProvider(Lists))

	// ON LOAD
	if (window.activeTextEditor) {
		await Diagnostics.update(window.activeTextEditor.document, collection)
	}

	// ON SWITCH EDITOR VIEW
	context.subscriptions.push(
		window.onDidChangeActiveTextEditor(async (editor) => {
			if (editor) {
				await Diagnostics.update(editor.document, collection)
			}
		})
	)

	// ON SAVE
	context.subscriptions.push(
		workspace.onDidSaveTextDocument(async (document) => {
			await Diagnostics.update(document, collection)
		})
	)

	//CHECK COMMAND
	context.subscriptions.push(checkCommand(Diagnostics, collection))
}

// This method is called when your extension is deactivated
export function deactivate(): void {
	console.info(`Extension ${GLOBALS.VS_CODE_EXTENSION_NAME} deactivated...`)
}

async function getFileByName(fileName: string): Promise<vscode.Uri[]> {
	return await workspace.findFiles(`**/${fileName}`, `**/{${GLOBALS.IGNORABLE_FOLDERS.join()}}/**`)
}

async function showError(fileName: string): Promise<void> {
	const value = await window.showErrorMessage(
		`HAQ Astro generated file: ${fileName} not found. Make sure to run the "haq compile" command first. Then click on Reload`,
		"Reload"
	)
	if (value === "Reload") {
		commands.executeCommand("workbench.action.reloadWindow")
	}
}
