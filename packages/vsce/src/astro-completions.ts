//#region -------------------------------------------------- Type Imports

import type { HAQ_CompletionColRange } from "@haq/astro/types"
import type { Disposable } from "vscode"
import type { RT_makeLists } from "./lists.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { getAstroCompletions } from "@haq/astro/tools"
import { assertUnreachable } from "@haq/utils"
import { CompletionItem, CompletionItemKind, CompletionList, languages, Position, Range } from "vscode"
import { get1BasedIndexPosition } from "./utils.js"

//#endregion ----------------------------------------------- Module Imports

export const astroCompletionProvider = (makeLists: RT_makeLists): Disposable =>
	languages.registerCompletionItemProvider("astro", {
		async provideCompletionItems(document, position) {
			const offset = document.offsetAt(position)

			const result = await getAstroCompletions({
				document: document.getText(),
				cursorPos: { ...get1BasedIndexPosition(position), offset },
				astroComponentsMap: makeLists.getAstroComponentsMap(),
				classNames: makeLists.getClassNames(),
				aliasableComponents: makeLists.getAliasableComponents()
			})

			if (!result) return

			switch (result.context) {
				case "CLASS_LIST":
				case "CLASS":
				case "X_SLOT":
					return provideValueCompletions(result.completions)

				case "SLOT":
					return provideSlotNameCompletions(result.completions, position, result.stringColRange)

				default:
					assertUnreachable(result.context)
			}
		}
	})

function provideValueCompletions(completions: string[]): CompletionList {
	const completionItems = completions.map((cl) => {
		const item = new CompletionItem(cl, CompletionItemKind.Value)
		item.insertText = cl
		item.filterText = cl
		item.sortText = "0000"
		return item
	})

	return new CompletionList(completionItems, false)
}

function provideSlotNameCompletions(
	slotNames: string[],
	position: Position,
	stringColRange: HAQ_CompletionColRange
): CompletionList {
	const rangeStart = new Position(position.line, stringColRange.start)
	const rangeEnd = new Position(position.line, stringColRange.end)

	const completionItems = slotNames.map((slotName) => {
		const item = new CompletionItem(slotName, CompletionItemKind.Value)
		item.insertText = slotName
		item.filterText = slotName
		item.range = new Range(rangeStart, rangeEnd)
		return item
	})
	return new CompletionList(completionItems, false)
}
