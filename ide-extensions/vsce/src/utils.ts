//#region -------------------------------------------------- Type Imports

import type { TextDocument, Uri } from "vscode"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { TabInputNotebook, TabInputText, window, workspace } from "vscode"

//#endregion ----------------------------------------------- Module Imports

export async function getDocumentFromUri(uri: Uri): Promise<TextDocument | undefined> {
	try {
		// Retrieves the document object into memory without showing it in the editor UI
		return await workspace.openTextDocument(uri)
	} catch (error) {
		console.error("Failed to load text document:", error)
		return undefined
	}
}

export function getOpenFiles(): Uri[] {
	const openFiles: Uri[] = []

	// Iterate through all tab groups (e.g., split editors)
	for (const group of window.tabGroups.all) {
		for (const tab of group.tabs) {
			// Check if the tab contains a standard text file or a notebook
			if (tab.input instanceof TabInputText || tab.input instanceof TabInputNotebook) {
				openFiles.push(tab.input.uri)
			}
		}
	}

	return openFiles
}
