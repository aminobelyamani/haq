//#region -------------------------------------------------- Type Imports

import type { Node, Position, TagLikeNode } from "@astrojs/compiler/types"
import type { AstroComponentsMap, CompletionColRange, CursorPos } from "../../cli/_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { parse } from "@astrojs/compiler"
import { is } from "@astrojs/compiler/utils"
import { getAttributeByName, hasChildren } from "../../cli/_shared/astro.js"
import { cleanUpObjectValues, getClassesFromClassListValues } from "../../cli/_shared/strings.js"
import { GLOBALS } from "../../globals.js"

//#endregion ----------------------------------------------- Module Imports

type AstroCompletionContext = "CLASS" | "CLASS_LIST" | "SLOT" | "X_SLOT" | "NONE"

type ARGS_getAstroCompletions = {
	documentText: string
	astroComponentsMap: AstroComponentsMap
	cursorPos: CursorPos
	classNames: string[]
	aliasableComponents: string[]
}

type RT_getAstroCompletions = {
	completions: string[]
	context: AstroCompletionContext
	stringColRange: CompletionColRange
}

/*******************************************************************************
 *
 * Function that returns completion data for a given Astro file.
 *
 ******************************************************************************/

export async function getAstroCompletions(args: ARGS_getAstroCompletions): Promise<RT_getAstroCompletions> {
	const parsed = await parse(args.documentText, { position: true })

	const parentComponentStack: string[] = []
	let completions: string[] = []
	let context: AstroCompletionContext = "NONE"
	const stringColRange: CompletionColRange = {
		start: args.cursorPos.col,
		end: args.cursorPos.col
	}

	_visitNode(parsed.ast)

	if (!context) return { completions: [], context, stringColRange }

	return { completions, context, stringColRange }

	//* ---------- Internals -----------------------------------------------

	function _visitNode(node: Node): void {
		let componentTakesSlots = false

		if (completions.length > 0) return // return early if we found a match

		if (is.tag(node)) {
			componentTakesSlots = _componentTakesSlots(node)
			_handleSlotAttribute(node)
			_handleClassAttribute(node, "class")
			_handleClassAttribute(node, "x_class_list")
			_handleClassListAttribute(node)
			_handleSlotDirective(node)
		}

		if (hasChildren(node)) {
			for (const child of node.children || []) {
				_visitNode(child)
			}
		}

		_handleComponentStack(componentTakesSlots)
	}

	//* ---------- class & x_class_list Attribute -----------------------------------------------

	function _handleClassAttribute(tagLikeNode: TagLikeNode, attrName: "class" | "x_class_list"): void {
		const classAttribute = getAttributeByName(tagLikeNode, attrName)
		if (!classAttribute?.position) return

		if (
			!_isCursorInRange({
				position: classAttribute.position,
				offset: attrName === "class" ? GLOBALS.CLASS_ATTRIBUTE_OFFSET : GLOBALS.X_CLASS_LIST_DIRECTIVE_OFFSET,
				valueLength: classAttribute.value?.length || 0
			})
		)
			return

		const classesOnAttributeSet = new Set(classAttribute.value.split(GLOBALS.EMPTY_CHAR))
		const newClassSet = new Set(args.classNames).difference(classesOnAttributeSet)

		context = "CLASS"
		completions = [...newClassSet]
	}

	//* ---------- class:list Attribute -----------------------------------------------

	function _handleClassListAttribute(tagLikeNode: TagLikeNode): void {
		const classAttribute = getAttributeByName(tagLikeNode, "class:list")
		if (!classAttribute?.position) return

		const valuesSplitByNewLine = classAttribute.value?.split("\n")

		// multi-line values

		if (valuesSplitByNewLine.length > 1) {
			const endOfStringLine = classAttribute.position.start.line + (valuesSplitByNewLine.length - 1)
			if (!_isCursorInMultiLineRange(classAttribute.position, endOfStringLine)) return
		} else if (
			!_isCursorInRange({
				position: classAttribute.position,
				offset: GLOBALS.CLASS_LIST_ATTRIBUTE_OFFSET,
				valueLength: classAttribute.value?.length || 0
			})
		)
			return

		const rawClasses = cleanUpObjectValues(classAttribute.value) // make it into parseable array

		// Will store the classes found on the class attribute
		const classesOnAttribute = getClassesFromClassListValues(rawClasses)
		const classesOnAttributeSet = new Set(classesOnAttribute)
		const newClassSet = new Set(args.classNames).difference(classesOnAttributeSet)

		context = "CLASS_LIST"
		completions = [...newClassSet]
	}

	//* ---------- x_slot Attribute -----------------------------------------------

	function _handleSlotDirective(tagLikeNode: TagLikeNode): void {
		const slotAttribute = getAttributeByName(tagLikeNode, "x_slot")
		if (!slotAttribute?.position) return

		if (
			!_isCursorInRange({
				position: slotAttribute.position,
				offset: GLOBALS.X_SLOT_DIRECTIVE_OFFSET,
				valueLength: slotAttribute.value?.length || 0
			})
		)
			return

		const currentSet = new Set(slotAttribute.value.split(GLOBALS.EMPTY_CHAR))
		const newSet = new Set(args.aliasableComponents).difference(currentSet)

		context = "X_SLOT"
		completions = [...newSet]
	}

	//* ---------- slot Attribute -----------------------------------------------

	function _componentTakesSlots(tagLikeNode: TagLikeNode): boolean {
		if (!is.component(tagLikeNode)) return false
		const slotList = args.astroComponentsMap.get(tagLikeNode.name)
		if (!slotList) return false
		if (slotList.length === 0) return false

		parentComponentStack.push(tagLikeNode.name)
		return true
	}

	function _handleSlotAttribute(tagLikeNode: TagLikeNode): void {
		const slotAttribute = getAttributeByName(tagLikeNode, "slot")
		if (!slotAttribute?.position) return

		const parentComponent = parentComponentStack.at(-1)
		if (!parentComponent) return

		const result = _getSlotNames({
			componentName: tagLikeNode.name,
			parentComponent,
			position: slotAttribute.position,
			valueLength: slotAttribute.value?.length || 0
		})

		if (result && completions.length === 0) {
			context = "SLOT"
			completions = [...result]
			stringColRange.start = slotAttribute.position.start.column + GLOBALS.SLOT_ATTRIBUTE_OFFSET - 1
			stringColRange.end = stringColRange.start + slotAttribute.value?.length
		}
	}

	function _getSlotNames({
		componentName,
		parentComponent,
		position,
		valueLength
	}: {
		position: Position
		parentComponent: string
		componentName: string
		valueLength: number
	}): string[] | undefined {
		// here we're handling the case when a component is a slot child of a parent and the component itself takes in slots
		const correctParentComponent = parentComponent === componentName ? parentComponentStack.at(-2) : parentComponent

		if (!correctParentComponent) return

		const slotList = args.astroComponentsMap.get(correctParentComponent)
		if (!slotList) return

		if (!_isCursorInRange({ position, offset: GLOBALS.SLOT_ATTRIBUTE_OFFSET, valueLength })) return

		return slotList.map((s) => s.slotName)
	}

	function _handleComponentStack(componentTakesSlots: boolean): void {
		if (componentTakesSlots) parentComponentStack.pop()
	}

	//* ---------- Helpers -----------------------------------------------

	type ARGS__isCursorInRange = {
		position: Position
		offset: number
		valueLength: number
	}

	function _isCursorInRange({ position, offset, valueLength }: ARGS__isCursorInRange): boolean {
		const startOfStringCol = position.start.column + offset
		const endOfStringCol = startOfStringCol + valueLength

		const isSameLine = position.start.line === args.cursorPos.line
		const isWithinStringRange = args.cursorPos.col >= startOfStringCol && args.cursorPos.col <= endOfStringCol
		return isSameLine && isWithinStringRange
	}

	function _isCursorInMultiLineRange(position: Position, endOfStringLine: number): boolean {
		const startOfStringLine = position.start.line

		return args.cursorPos.line >= startOfStringLine && args.cursorPos.line <= endOfStringLine
	}
}
