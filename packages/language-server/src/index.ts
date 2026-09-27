//#region -------------------------------------------------- Type Imports

import type {
	CompletionItem,
	InitializeParams,
	ServerCapabilities,
	TextDocumentPositionParams
} from "vscode-languageserver/node"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import process from "node:process"
import { fileURLToPath } from "node:url"
import { isHAQError, makeLspTools } from "@haq/astro/tools"
import { createConnection, ProposedFeatures, TextDocuments } from "vscode-languageserver/node"
import { TextDocument } from "vscode-languageserver-textdocument"

//#endregion ----------------------------------------------- Module Imports

//#region -------------------------------------------------- Types

type ServerInitializationResult = {
	capabilities: ServerCapabilities
}

//#endregion ----------------------------------------------- Types

function run(): void {
	const connection = createConnection(ProposedFeatures.all, process.stdin, process.stdout)

	const documents = new TextDocuments(TextDocument)

	let currentDir: string | undefined
	let LspTools: ReturnType<typeof makeLspTools> | undefined

	connection.onInitialize(_initialize)

	documents.onDidOpen((event) => {
		_publishDiagnostics(event.document)
	})

	documents.onDidSave((event) => {
		_publishDiagnostics(event.document)
	})

	connection.onCompletion(_publishCompletions)

	documents.listen(connection)
	connection.listen()

	//* ---------- Initialization -----------------------------------------------

	function _initialize(params: InitializeParams): ServerInitializationResult {
		const serverInitializationRestuls: ServerInitializationResult = {
			capabilities: {
				textDocumentSync: {
					openClose: true,
					save: true
				},
				completionProvider: {}
			}
		}
		try {
			const workspaceUri = params.workspaceFolders?.at(0)?.uri
			currentDir = workspaceUri ? fileURLToPath(workspaceUri) : undefined

			if (!currentDir) {
				const errorMessage = "Unable to find current workspace directory."
				_showError(errorMessage)
				return serverInitializationRestuls
			}

			LspTools = makeLspTools({
				currentDir,
				successCallback: () => {
					connection.console.log("HAQ Astro language server initialized...")
					connection.window.showInformationMessage("HAQ Astro LSP loaded successfully.")
				},
				updateDiagnosticsCallback: _updateDiagnosticsCallback
			})

			return serverInitializationRestuls
		} catch (e) {
			_handleError(e)
			return serverInitializationRestuls
		}
	}

	//* ---------- Diagnostics -----------------------------------------------

	async function _updateDiagnosticsCallback(): Promise<void> {
		for (const doc of documents.all()) {
			await _publishDiagnostics(doc)
		}
	}

	async function _publishDiagnostics(document: TextDocument): Promise<void> {
		if (!LspTools) return

		const [error, diagnostics] = await _tryCatch(
			LspTools.getFileDiagnostics({
				documentText: document.getText(),
				filePath: fileURLToPath(document.uri)
			})
		)

		if (error) {
			_handleError(error)
			return
		}

		connection.sendDiagnostics({
			uri: document.uri,
			diagnostics
		})
	}

	//* ---------- Completions -----------------------------------------------

	async function _publishCompletions(positionParams: TextDocumentPositionParams): Promise<CompletionItem[]> {
		if (!LspTools) return []

		const textDocument = documents.get(positionParams.textDocument.uri)
		if (!textDocument) return []

		const offset = textDocument.offsetAt(positionParams.position)

		const [error, completions] = await _tryCatch(
			LspTools.getCompletions({
				documentText: textDocument.getText(),
				filePath: fileURLToPath(textDocument.uri),
				cursorPos: {
					offset,
					col: positionParams.position.character + 1,
					line: positionParams.position.line + 1
				}
			})
		)

		if (error) {
			_handleError(error)
			return []
		}

		return completions
	}

	//* ---------- Error Notifications -----------------------------------------------

	function _tryCatch<T>(promise: Promise<T>): Promise<[undefined, T] | [Error]> {
		return promise.then((data) => [undefined, data] as [undefined, T]).catch((error) => [error] as [Error])
	}

	function _getErrorMessage(e: unknown): string {
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

	function _handleError(e: unknown): void {
		const fullMessage = _getErrorMessage(e)
		_showError(fullMessage)
	}

	function _showError(message: string): void {
		connection.console.error(message)
		connection.window.showErrorMessage(message)
	}
}

run()
