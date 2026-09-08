//#region -------------------------------------------------- Type Imports

import type {
	CommentNode,
	ComponentNode,
	ExpressionNode,
	FrontmatterNode,
	Node,
	RootNode,
	TagLikeNode
} from "@astrojs/compiler/types"
import type { MarkupDirective } from "../../globals.js"
import type {
	AstroComponentsMap,
	Diagnostic,
	GeneratedComponent,
	I_AstroAttributeNode,
	JSON_AstroComponent
} from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { parse } from "@astrojs/compiler"
import { is } from "@astrojs/compiler/utils"
import { GLOBALS } from "../../globals.js"
import { HAQError } from "./errors.js"
import { loadFile } from "./fs.js"
import { generateArrayFromSpaceSeparatedList, removeTrailingSlash } from "./strings.js"

//#endregion ----------------------------------------------- Module Imports

export async function getRootNodeByFileName(fileName: string, withPosition: boolean): Promise<RootNode | undefined> {
	const file = loadFile(fileName)
	if (!file) return

	const result = await parse(file.toString(), {
		position: withPosition // defaults to `true`
	})

	return result.ast
}

export function hasChildren(node: Node): node is RootNode | ExpressionNode | TagLikeNode {
	return is.root(node) || is.expression(node) || is.tag(node)
}

export function getAttributes(tagNode: TagLikeNode): I_AstroAttributeNode[] {
	return (tagNode.attributes ?? []) as I_AstroAttributeNode[]
}

export function getAttributeByName(
	tagLikeNode: TagLikeNode,
	directive: I_AstroAttributeNode["name"]
): I_AstroAttributeNode | undefined {
	return tagLikeNode.attributes.find((attr) => attr.name === directive) as I_AstroAttributeNode
}

export function isCustomTagNode(tagLikeNode: TagLikeNode): tagLikeNode is TagLikeNode {
	return tagLikeNode.name.match(GLOBALS.REGEX_HTML_CUSTOM_ELEMENT) !== null
}

export function isSlotNode(node: Node): boolean {
	return is.tag(node) && node.name === "slot"
}

export function isAliasNode(node: Node): node is ComponentNode {
	if (!is.component(node)) return false
	const aliasDirective = getAttributeByName(node, "x_alias")
	return aliasDirective !== undefined
}

export function isFragmentNode(tagLikeNode: TagLikeNode): boolean {
	return tagLikeNode.name === "Fragment"
}

export function isWebComponentNode(node: Node): node is ComponentNode {
	if (!is.tag(node)) return false
	return hasWebComponentDirective(node)
}

export function isConditionalExpression(node: Node): boolean {
	return (
		is.expression(node) &&
		node.children.some(
			(child) =>
				is.text(child) && (child.value.includes(" ? ") || child.value.includes("&&") || child.value.includes(" : "))
		)
	)
}

export function hasHAQDirective(tagLikeNode: TagLikeNode): boolean {
	return tagLikeNode.attributes.some((attr) => GLOBALS.HAQ_DIRECTIVES.includes(attr.name as MarkupDirective))
}

export function isDirectiveNode(node: Node): node is TagLikeNode {
	return is.tag(node) && hasTypeDirective(node)
}

export function hasTypeDirective(tagLikeNode: TagLikeNode): boolean {
	const attrMap = new Map(getAttributes(tagLikeNode).map((a) => [a.name, a]))
	const targetDirective = attrMap.get("x_haq") || attrMap.get("x_webc") || attrMap.get("x_alias")
	return targetDirective !== undefined
}

export function hasWebComponentDirective(tagLikeNode: TagLikeNode): boolean {
	const targetDirective = getAttributeByName(tagLikeNode, "x_webc")
	return targetDirective !== undefined
}

export function isAppComponent(tagLikeNode: TagLikeNode): boolean {
	const targetDirective = getAttributeByName(tagLikeNode, "id")
	return targetDirective !== undefined && targetDirective.kind === "quoted" && targetDirective.value.length > 0
}

export function isAliasedAppComponentNode(node: Node): node is ComponentNode {
	if (!is.component(node)) return false
	const appComponentDirective = getAttributeByName(node, "x_appc")
	return appComponentDirective !== undefined
}

export function isDynamicAttribute(attribute: I_AstroAttributeNode): boolean {
	return attribute.value.trim() === "" || attribute.kind !== "quoted"
}

export function getIDAttributeValue(tagLikeNode: TagLikeNode): string | undefined {
	const idAttribute = getAttributeByName(tagLikeNode, "id")
	if (!idAttribute) return
	if (!isDynamicAttribute(idAttribute)) {
		return idAttribute.value
	}
}

export function getXSelectorValue(tagLikeNode: TagLikeNode): string | undefined {
	const xSelectorAttribute = getAttributeByName(tagLikeNode, "x_sel")
	if (xSelectorAttribute?.kind !== "quoted" || !xSelectorAttribute?.value) return
	return xSelectorAttribute.value
}

export function getSlotDirectiveValues(node: Node): string[] | undefined {
	if (!(is.tag(node) && isSlotNode(node))) return

	const targetDirective = getAttributeByName(node, "x_slot")

	if (!targetDirective?.value) return

	return generateArrayFromSpaceSeparatedList(targetDirective.value)
}

export function getPartialRouteFromFilePath(filePath: string): string | null {
	const matches = filePath.match(GLOBALS.REGEX_PARTIAL_PAGES)
	const filePathWithoutExtension = matches?.[1]
	if (!filePathWithoutExtension) return null
	return filePathWithoutExtension.includes("index")
		? removeTrailingSlash(filePathWithoutExtension.replace("index", ""))
		: filePathWithoutExtension
}

export function getClassValue(tagLikeNode: TagLikeNode): string | undefined {
	const classSeparator = GLOBALS.PIPE_CHAR
	const attrMap = new Map(getAttributes(tagLikeNode).map((a) => [a.name, a]))
	const classAttribute = attrMap.get("class") || attrMap.get("class:list")
	if (classAttribute?.value.includes(classSeparator)) {
		const regex = new RegExp(GLOBALS.REGEX_CLASS_LIST_SPECIAL_CHARS, "gi") //handle special characters in class:list syntax {[""]}
		const values = classAttribute.value.replace(regex, " ")
		const classes = values.trim().split(" ")
		const separatorIndex = classes.indexOf(classSeparator)
		if (separatorIndex > 0) {
			return classes[separatorIndex - 1]?.replace(regex, "")
		}
	}
}

export function canIgnoreUniqueSelector(sel: string): boolean {
	return sel === "unknown"
}

type UniqueSelectorArgs = {
	identifierList: Set<string>
	identifier: string
	filePath: string
	ref?: GeneratedComponent
}

export function addUniqueSelectorOrThrow({ filePath, identifier, identifierList, ref }: UniqueSelectorArgs): void {
	if (identifierList.has(identifier)) {
		throw new HAQError({
			message: "Duplicate selector identifier.",
			description: `Selector: ${identifier}`,
			sourceFiles: ref ? [filePath, ref.filePath] : [filePath]
		})
	}
	identifierList.add(identifier)
}

type PositionArgs = {
	node: I_AstroAttributeNode | TagLikeNode | FrontmatterNode | CommentNode
	startOffset?: number
	endOffset?: number
}
export function getPositionRange({ node, startOffset = 0, endOffset = 0 }: PositionArgs): Diagnostic["range"] {
	const positionStart = node.position?.start
	const lineStart = positionStart?.line || 1
	const colStart = (positionStart?.column || 1) + startOffset
	const colEnd = colStart + endOffset

	const rangeStart = {
		line: lineStart,
		column: colStart,
		offset: 0
	}

	const rangeEnd = {
		line: lineStart,
		column: colEnd,
		offset: 0
	}

	return {
		start: rangeStart,
		end: rangeEnd
	}
}

export function createAstroComponentsMap(astroComponentsContent: JSON_AstroComponent[]): AstroComponentsMap {
	const astroComponentsMap: AstroComponentsMap = new Map()
	for (const record of astroComponentsContent) {
		astroComponentsMap.set(record.componentName, record.slotList)
	}

	return astroComponentsMap
}
