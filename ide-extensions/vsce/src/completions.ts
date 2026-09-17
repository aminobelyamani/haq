//#region -------------------------------------------------- Type Imports

import type { I_LSPTools } from "@haq/astro/tools"
import type { HAQ_CursorPos } from "@haq/astro/types"
import type { CompletionItem, Disposable } from "vscode"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { languages, Position, Range, SnippetString } from "vscode"

//#endregion ----------------------------------------------- Module Imports

export const astroCompletionProvider = (LspTools: I_LSPTools): Disposable =>
	languages.registerCompletionItemProvider("astro", {
		async provideCompletionItems(document, position) {
			const offset = document.offsetAt(position)

			const completions = await LspTools.getCompletions({
				documentText: document.getText(),
				filePath: document.uri.fsPath,
				cursorPos: {
					offset,
					...get1BasedIndexPosition(position)
				}
			})

			const vsCodeCompletions: CompletionItem[] = []
			for (const completion of completions) {
				vsCodeCompletions.push(toVSCodeCompletion(completion))
			}

			return vsCodeCompletions
		}
	})

export const cssCompletionProvider = (LspTools: I_LSPTools): Disposable =>
	languages.registerCompletionItemProvider("css", {
		async provideCompletionItems(document, position) {
			const offset = document.offsetAt(position)

			const completions = await LspTools.getCompletions({
				documentText: document.getText(),
				filePath: document.uri.fsPath,
				cursorPos: {
					offset,
					...get1BasedIndexPosition(position)
				}
			})

			const vsCodeCompletions: CompletionItem[] = []
			for (const completion of completions) {
				vsCodeCompletions.push(toVSCodeCompletion(completion))
			}
			return vsCodeCompletions
		}
	})

function toVSCodeCompletion(completion: Awaited<ReturnType<I_LSPTools["getCompletions"]>>[number]): CompletionItem {
	const { documentation, textEdit, additionalTextEdits, kind, insertText, ...rest } = completion

	let range: CompletionItem["range"] | undefined

	const vsCodeCompletion: CompletionItem = {
		...rest
	}

	if (kind) {
		vsCodeCompletion.kind = kind - 1 // vscode kind enum types are 1 off from lsp enum types
	}

	if (insertText) {
		vsCodeCompletion.insertText = new SnippetString(insertText)
	}

	if (textEdit && "replace" in textEdit) {
		range = {
			inserting: new Range(
				new Position(textEdit.insert.start.line, textEdit.insert.start.character),
				new Position(textEdit.insert.end.line, textEdit.insert.end.character)
			),
			replacing: new Range(
				new Position(textEdit.replace.start.line, textEdit.replace.start.character),
				new Position(textEdit.replace.end.line, textEdit.replace.end.character)
			)
		}
		vsCodeCompletion.range = range
	}

	return vsCodeCompletion
}

function get1BasedIndexPosition(position: Position): Pick<HAQ_CursorPos, "col" | "line"> {
	return {
		line: position.line + 1,
		col: position.character + 1
	}
}
