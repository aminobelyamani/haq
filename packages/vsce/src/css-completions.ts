//#region -------------------------------------------------- Type Imports

import type { HAQ_MarkupDirective } from "@haq/astro/types"
import type { Disposable, TextDocument } from "vscode"
import type { RT_makeLists } from "./lists.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { GLOBALS, getCSSCompletions } from "@haq/astro/tools"
import { assertUnreachable } from "@haq/utils"
import { CompletionItem, CompletionItemKind, CompletionList, languages, Position, Range, SnippetString } from "vscode"
import { get1BasedIndexPosition } from "./utils.js"

//#endregion ----------------------------------------------- Module Imports

export const cssCompletionProvider = (makeLists: RT_makeLists): Disposable =>
	languages.registerCompletionItemProvider("css", {
		provideCompletionItems(document, position) {
			const offset = document.offsetAt(position)

			const cssMarkupMap = makeLists.getCssMarkupMap()
			const cssMarkupRecord = cssMarkupMap.get(document.fileName)

			const afterCursorRange = new Range(
				new Position(position.line, position.character),
				new Position(position.line, position.character + 1)
			)

			const charAfterCursor = document.getText(afterCursorRange)

			const result = getCSSCompletions({
				document: document.getText(),
				cursorPos: { ...get1BasedIndexPosition(position), offset },
				cssMarkup: cssMarkupRecord?.flatMarkup,
				customElementsMap: makeLists.getCustomElementsMap()
			})

			if (!result) return

			switch (result.context) {
				case "EMPTY_RULE":
					return provideEmptyRuleCompletion(result.completions, position)

				case "TYPE_SELECTOR":
					return provideTypeSelectorCompletions({
						document,
						completions: result.completions,
						position,
						charAfterCursor
					})

				case "EMPTY_ATTRIBUTE":
					return provideAttributeCompletions(result.completions, position)

				case "ATTRIBUTE_VALUE":
					return provideAttributeValueCompletion(result.completions, position)

				case "NONE":
					return

				default:
					assertUnreachable(result.context)
			}
		}
	})

function provideEmptyRuleCompletion(completions: string[], position: Position): CompletionList | undefined {
	const completionItems = completions.map((completion) => {
		const item = new CompletionItem(completion, CompletionItemKind.Value)
		item.insertText = new SnippetString(`${completion} $0 {}`)
		item.filterText = completion
		item.sortText = "0"
		item.range = new Range(
			new Position(position.line, position.character),
			new Position(position.line, position.character)
		)
		return item
	})
	return new CompletionList(completionItems, false)
}

type TypeSelectorCompletionsArgs = {
	document: TextDocument
	completions: string[]
	position: Position
	charAfterCursor: string
}

function provideTypeSelectorCompletions({
	document,
	charAfterCursor,
	position,
	completions
}: TypeSelectorCompletionsArgs): CompletionList | undefined {
	const offset = document.offsetAt(position)
	const text = document.getText()

	const matchesSpecialChar = charAfterCursor.match(GLOBALS.REGEX_CSS_SPECIAL_CHARS)
	const textRightOfCursor = text.slice(offset)

	const nextSpecialCharIndex = textRightOfCursor.search(GLOBALS.REGEX_CSS_SPECIAL_CHARS)

	const endCharacter = nextSpecialCharIndex === -1 ? position.character : position.character + nextSpecialCharIndex

	const replaceRange = new Range(position.line, position.character, position.line, endCharacter)
	const insertRange = new Range(position.line, position.character, position.line, position.character)

	const completionItems = completions.map((completion) => {
		const item = new CompletionItem(completion, CompletionItemKind.Value)
		item.insertText = completion
		item.filterText = completion
		item.sortText = "000"
		item.range = matchesSpecialChar ? insertRange : replaceRange

		return item
	})
	return new CompletionList(completionItems, false)
}

function provideAttributeCompletions(completions: string[], position: Position): CompletionList {
	const selDirective: HAQ_MarkupDirective = "x_sel"
	const dynSelDirective: HAQ_MarkupDirective = "x_dyn_sel"

	const sortText = (str: string): string => {
		if (str.startsWith(selDirective)) return "01"
		if (str.startsWith(dynSelDirective)) return "02"
		if (str.startsWith(GLOBALS.HAQ_DATA_ATTRIBUTE_PREFIX)) return "03"
		return "04"
	}
	const completionItems = completions.map((val) => {
		const item = new CompletionItem(val, CompletionItemKind.Property)
		item.insertText = val
		item.sortText = sortText(val)
		item.range = new Range(
			new Position(position.line, position.character),
			new Position(position.line, position.character)
		)
		return item
	})

	return new CompletionList(completionItems, false)
}

function provideAttributeValueCompletion(values: string[], position: Position): CompletionList | undefined {
	const completionItems = values.map((val) => {
		const item = new CompletionItem(val, CompletionItemKind.Value)
		item.insertText = new SnippetString(`="${val}"`)
		item.filterText = val
		item.sortText = "000"
		item.range = new Range(
			new Position(position.line, position.character),
			new Position(position.line, position.character)
		)
		return item
	})

	return new CompletionList(completionItems, false)
}
