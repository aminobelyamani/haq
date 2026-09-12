//#region -------------------------------------------------- Type Imports

import type { CSSNode } from "../../_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { parse, walk } from "css-tree"
import { isClassSelector, isCustomPropertyDeclation, isRootSelector, isSelector } from "../../_shared/css.js"
import { loadFile } from "../../_shared/fs.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_getCSSLists = {
	cssFiles: string[]
}
type RT_getCSSLists = {
	classNames: string[]
	rootCustomProperties: string[]
}
export function getCSSLists({ cssFiles }: ARGS_getCSSLists): RT_getCSSLists {
	const classNameSet: Set<string> = new Set()
	const rootCustomPropertySet: Set<string> = new Set()

	for (const fileName of cssFiles) {
		const file = loadFile(fileName)
		if (!file) continue

		const ast = parse(file.toString())
		_walkAST(ast)
	}

	return {
		classNames: [...classNameSet],
		rootCustomProperties: [...rootCustomPropertySet]
	}

	//* ---------- Helpers -----------------------------------------------

	function _walkAST(ast: CSSNode): void {
		const selectorStack: CSSNode[] = []
		walk(ast, (node, _item) => {
			if (isSelector(node) && node.children?.last) {
				selectorStack.push(node.children.last)
			}
			if (isClassSelector(node)) classNameSet.add(node.name)
			const parentSelector = selectorStack.at(-1)
			if (isCustomPropertyDeclation(node) && parentSelector && isRootSelector(parentSelector))
				rootCustomPropertySet.add(node.property)
		})
	}
}
