//#region -------------------------------------------------- Type Imports

import type { CompletionItem, InitializeParams, TextDocumentPositionParams } from "vscode-languageserver/node"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import process from "node:process"
import { fileURLToPath } from "node:url"
import { makeLspTools } from "@haq/astro/tools"
import { createConnection, ProposedFeatures, TextDocumentSyncKind, TextDocuments } from "vscode-languageserver/node"
import { TextDocument } from "vscode-languageserver-textdocument"

//#endregion ----------------------------------------------- Module Imports

function run(): void {
	const connection = createConnection(ProposedFeatures.all, process.stdin, process.stdout)

	const documents = new TextDocuments(TextDocument)

	let currentDir: string | undefined
	let LspTools: ReturnType<typeof makeLspTools> | undefined

	connection.onInitialize((params: InitializeParams) => {
		const workspaceUri = params.workspaceFolders?.at(0)?.uri
		currentDir = workspaceUri ? fileURLToPath(workspaceUri) : undefined

		if (!currentDir) {
			return {
				capabilities: {},
				message: "Unable to find current workspace directory."
			}
		}

		LspTools = makeLspTools({
			currentDir,
			successCallback: () => {
				connection.console.log("HAQ Astro LSP Initialized...")
			}
		})

		return {
			capabilities: {
				textDocumentSync: TextDocumentSyncKind.Incremental,
				// Tell the client that this server supports code completion.
				completionProvider: {}
			}
		}
	})

	documents.onDidChangeContent((event) => {
		publishDiagnostics(event.document)
	})

	connection.onCompletion(publishCompletions)

	documents.listen(connection)
	connection.listen()

	//* ---------- Diagnostics -----------------------------------------------

	async function publishDiagnostics(document: TextDocument): Promise<void> {
		if (!LspTools) return

		const diagnostics = await LspTools.getFileDiagnostics({
			documentText: document.getText(),
			filePath: fileURLToPath(document.uri)
		})

		connection.sendDiagnostics({
			uri: document.uri,
			diagnostics
		})
	}

	//* ---------- Completions -----------------------------------------------

	async function publishCompletions(positionParams: TextDocumentPositionParams): Promise<CompletionItem[]> {
		if (!LspTools) return []

		const textDocument = documents.get(positionParams.textDocument.uri)
		if (!textDocument) return []

		const offset = textDocument.offsetAt(positionParams.position)

		const completions = await LspTools.getCompletions({
			documentText: textDocument.getText(),
			filePath: fileURLToPath(textDocument.uri),
			cursorPos: {
				offset,
				col: positionParams.position.character + 1,
				line: positionParams.position.line + 1
			}
		})
		return completions
	}
}

run()
