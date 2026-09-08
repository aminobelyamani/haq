//#region -------------------------------------------------- Type Imports

import type {
	AttributeSelectorNode,
	CSSNode,
	CursorPos,
	GeneratedCSSMarkupObject,
	IdSelectorNode,
	ListItem,
	PseudoClassSelectorNode,
	RuleNode,
	SelectorKind,
	TypeSelectorNode
} from "../cli/_shared/types.js"
import type { CustomElementsMap, JSON_CustomElement } from "../cli/_shared/validation.js"
import type { MarkupDirective } from "../globals.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { parse, walk } from "css-tree"
import {
	constructSelectorStringFromMarkup,
	getClosestAttachedTypeSelector,
	isAttributeSelector,
	isCombinator,
	isHasSelector,
	isPseudoClassSelector,
	isRule,
	isSelector,
	isStringNode,
	isTypeSelector
} from "../cli/_shared/css.js"
import { GLOBALS } from "../globals.js"

//#endregion ----------------------------------------------- Module Imports

type CSSCompletionContext = "TYPE_SELECTOR" | "ATTRIBUTE_VALUE" | "EMPTY_ATTRIBUTE" | "EMPTY_RULE" | "NONE"

type VisitContext = {
	markupStack: GeneratedCSSMarkupObject[]
	pseudoClassSelectorStack: boolean[]
	typeSelectorStackInHas: boolean[]
	typeSelectorsInSelector: TypeSelectorNode[]
	isCursorInRuleRange: boolean
	revisitAst: CSSNode | undefined
	completions: string[]
	context: CSSCompletionContext
}

type ARGS_getCSSCompletions = {
	document: string
	cursorPos: CursorPos
	cssMarkup: GeneratedCSSMarkupObject[] | undefined
	customElementsMap: CustomElementsMap
}

type RT_getCSSCompletions =
	| {
			context: CSSCompletionContext
			completions: string[]
	  }
	| undefined

/*******************************************************************************
 *
 * Function that returns completion data for a given CSS file.
 *
 ******************************************************************************/

export function getCSSCompletions(args: ARGS_getCSSCompletions): RT_getCSSCompletions {
	const ast = parse(args.document, {
		positions: true
	})
	const CHAR_BEFORE_CURSOR = args.document.at(args.cursorPos.offset - 1)
	const IS_CURRENT_LINE_EMPTY = args.document
		.split("\n")
		.some((line, index) => args.cursorPos.line - 1 === index && line.trim().length === 0)

	const rootMarkup = args.cssMarkup?.find((r) => !r.parentId)

	const selDirective: MarkupDirective = "x_sel"
	const dynSelDirective: MarkupDirective = "x_dyn_sel"

	let VISIT_CONTEXT: VisitContext = _init()

	_walkAST(ast)

	const revisitAST = VISIT_CONTEXT.revisitAst

	if (revisitAST) {
		// adjust cursor
		args.cursorPos.col += GLOBALS.HAQ_CSS_RAW_ATTRIBUTE_PLACEHOLDER.length
		// reset visit context
		VISIT_CONTEXT = _init()
		// then traverse
		_walkAST(revisitAST)
	}

	if (!VISIT_CONTEXT.isCursorInRuleRange && IS_CURRENT_LINE_EMPTY && rootMarkup) {
		return {
			context: "EMPTY_RULE",
			completions: [constructSelectorStringFromMarkup(rootMarkup)]
		}
	}

	return { completions: VISIT_CONTEXT.completions, context: VISIT_CONTEXT.context }

	//* ---------- Initialize -----------------------------------------------

	function _init(): VisitContext {
		return {
			markupStack: [],
			pseudoClassSelectorStack: [],
			typeSelectorStackInHas: [],
			typeSelectorsInSelector: [],
			isCursorInRuleRange: false,
			revisitAst: undefined,
			completions: [],
			context: "NONE"
		}
	}

	//* ---------- Walk AST -----------------------------------------------

	function _walkAST(astNode: CSSNode): void {
		walk(astNode, {
			enter: (node: CSSNode, item: ListItem) => {
				if (isRule(node)) {
					VISIT_CONTEXT.isCursorInRuleRange = _isCursorInRange(node)
					if (VISIT_CONTEXT.isCursorInRuleRange) _handleRule(node)
				}

				if (!VISIT_CONTEXT.isCursorInRuleRange) return

				_handleInRuleRange(node, item)
			},
			leave: (node: CSSNode) => {
				if (isPseudoClassSelector(node)) {
					_handlePseudoClassSelectorLeave(node)
				}
			}
		})
	}

	//* ---------- Rule -----------------------------------------------

	function _handleRule(ruleNode: RuleNode): void {
		const prelude = ruleNode.prelude
		const isRaw = prelude.type === "Raw"

		// Not parsed rule. (e.g) some-elem[|]
		if (isRaw && prelude.value.length > 0) {
			const nodeLoc = ruleNode.loc
			if (!nodeLoc) return

			_handleRawAttribute(prelude.value, nodeLoc.start.offset)
			return
		}

		// Cursor at rule start
		if (args.cursorPos.col === ruleNode.loc?.start.column && rootMarkup) {
			VISIT_CONTEXT.context = "TYPE_SELECTOR"
			VISIT_CONTEXT.completions = [constructSelectorStringFromMarkup(rootMarkup)]
		}
	}

	//* ---------- In Rule Range -----------------------------------------------

	function _handleInRuleRange(node: CSSNode, item: ListItem): void {
		if (isSelector(node)) _handleSelector()

		if (isTypeSelector(node)) {
			VISIT_CONTEXT.typeSelectorsInSelector.push(node)
			_handleTypeSelector(node, item)
		}

		if (isAttributeSelector(node)) {
			_handleAttributeSelector(node, item)
		}

		if (isPseudoClassSelector(node)) {
			_handlePseudoClassSelectorEnter(node)
		}

		const isSiblingCombinator = _handleSiblingCombinator(node)
		if (isSiblingCombinator) return

		// provide selector completions

		_handleChildCombinator(node)
	}

	function _handleChildCombinator(node: CSSNode): void {
		const isAfterTab = CHAR_BEFORE_CURSOR === "\t" && _isCursorAtTypeSelectorNode(node)
		const isAfterSpace = CHAR_BEFORE_CURSOR === GLOBALS.EMPTY_CHAR && _isCursorAfterNode(node)

		if (isAfterTab || isAfterSpace) {
			const parentMarkup = VISIT_CONTEXT.markupStack.at(-1)
			if (!parentMarkup) return
			_populateSelectorCompletions(parentMarkup.id)
		}
	}

	//* ---------- PseudoClassSelector -----------------------------------------------

	function _handlePseudoClassSelectorEnter(pseudoClassSelectorNode: PseudoClassSelectorNode): void {
		const hasSelector = isHasSelector(pseudoClassSelectorNode)
		VISIT_CONTEXT.pseudoClassSelectorStack.push(hasSelector)
		if (hasSelector) _handleHasSelector(pseudoClassSelectorNode)
	}

	function _handleHasSelector(pseudoClassSelectorNode: PseudoClassSelectorNode): void {
		const parentMarkup = VISIT_CONTEXT.markupStack.at(-1)
		if (!parentMarkup) return

		if (!_isCursorInRange(pseudoClassSelectorNode)) return

		_populateSelectorCompletions(parentMarkup.id)
	}

	function _handlePseudoClassSelectorLeave(pseudoClassSelectorNode: PseudoClassSelectorNode): void {
		if (!VISIT_CONTEXT.isCursorInRuleRange) return
		VISIT_CONTEXT.pseudoClassSelectorStack.pop()

		if (isHasSelector(pseudoClassSelectorNode)) {
			for (const _ of VISIT_CONTEXT.typeSelectorStackInHas) {
				VISIT_CONTEXT.markupStack.pop()
			}
			VISIT_CONTEXT.typeSelectorStackInHas.length = 0
		}
	}

	//* ---------- Selector -----------------------------------------------

	function _handleSelector(): void {
		if (VISIT_CONTEXT.pseudoClassSelectorStack.length === 0) {
			// reset only if selector is not inside a PseudoClassSelector
			VISIT_CONTEXT.markupStack.length = 0
			VISIT_CONTEXT.typeSelectorsInSelector.length = 0
		}
	}

	//* ---------- Combinator -----------------------------------------------

	function _handleSiblingCombinator(node: CSSNode): boolean {
		if (!isCombinator(node)) return false
		if (!_isCursorAfterNode(node)) return false

		const parentMarkup = VISIT_CONTEXT.markupStack.at(-2)
		if (!parentMarkup) return false

		if (!GLOBALS.CSS_SIBLING_CHARS.includes(node.name)) return false

		_populateSelectorCompletions(parentMarkup.id)
		return true
	}

	//* ---------- TypeSelector -----------------------------------------------

	function _handleTypeSelector(typeSelectorNode: TypeSelectorNode, item: ListItem): void {
		const next = item.next?.data

		_handleParentMarkupStack("TAG", typeSelectorNode.name, item)

		if (next?.type === "AttributeSelector") {
			_validateNextAttributeOrIdSelector(next, "HAQ_SEL_ATTR", item)
			_validateNextAttributeOrIdSelector(next, "HAQ_DYN_SEL_ATTR", item)
			return
		}

		if (next?.type === "IdSelector") {
			_validateNextAttributeOrIdSelector(next, "ID", item)
		}
	}

	function _validateNextAttributeOrIdSelector(
		next: AttributeSelectorNode | IdSelectorNode,
		selKind: SelectorKind,
		item: ListItem
	): void {
		const isIdSelector = next.type === "IdSelector"
		let value: string | undefined
		if (isIdSelector) {
			value = next.name
		} else {
			value =
				(next.name.name === selDirective || next.name.name === dynSelDirective) && isStringNode(next.value)
					? next.value.value
					: undefined
		}

		if (!value) return

		_handleParentMarkupStack(selKind, value, item)
	}

	function _handleParentMarkupStack(selKind: SelectorKind, selValue: string, item: ListItem): void {
		const markupRecord = args.cssMarkup?.find((r) => {
			const valueToCheck = selKind === "TAG" ? r.tagName : r.selValue
			return r.selKind === selKind && valueToCheck === selValue
		})
		if (!markupRecord) return

		const lookupIndex = _isPreviousSiblingCombinator(item) ? -2 : -1
		const parentMarkupFromStack = VISIT_CONTEXT.markupStack.at(lookupIndex)
		if (parentMarkupFromStack) {
			const validParentMarkup = args.cssMarkup?.find((r) => r.id === markupRecord?.parentId)
			if (validParentMarkup !== parentMarkupFromStack) return
		}

		VISIT_CONTEXT.markupStack.push(markupRecord)

		if (VISIT_CONTEXT.pseudoClassSelectorStack.some((p) => p === true)) VISIT_CONTEXT.typeSelectorStackInHas.push(true)
	}

	function _isPreviousSiblingCombinator(item: ListItem): boolean {
		const prev = item.prev?.data
		if (!prev) return false
		if (!isCombinator(prev)) return false
		if (!GLOBALS.CSS_SIBLING_CHARS.includes(prev.name)) return false
		return true
	}

	function _populateSelectorCompletions(parentMarkupId: string): void {
		const parentRecord = args.cssMarkup?.find((r) => r.id === parentMarkupId)
		if (!parentRecord) return

		const childRecords = args.cssMarkup?.filter((r) => r.parentId === parentRecord.id) ?? []

		VISIT_CONTEXT.context = "TYPE_SELECTOR"
		VISIT_CONTEXT.completions = childRecords.map((r) => constructSelectorStringFromMarkup(r))
	}

	//* ---------- AttributeSelector Raw [] -----------------------------------------------

	function _handleRawAttribute(rawValue: string, ruleStartOffset: number): void {
		const ATTRIBUTE_REGEX = /\[\]/dg
		const matches = rawValue.matchAll(ATTRIBUTE_REGEX)

		const result = _isCursorInRangeOfRawAttribute(matches, ruleStartOffset)
		if (!result?.isInRange) return

		const newParsableDocument = `${args.document.slice(0, ruleStartOffset + result.matchIndex)}${GLOBALS.HAQ_CSS_RAW_ATTRIBUTE_PLACEHOLDER}${args.document.slice(ruleStartOffset + result.matchIndex)}`
		const newAST = parse(newParsableDocument, {
			positions: true
		})

		VISIT_CONTEXT.revisitAst = newAST
	}

	function _isCursorInRangeOfRawAttribute(
		matches: IterableIterator<RegExpExecArray>,
		ruleStartOffset: number
	): { isInRange: true; matchIndex: number } | undefined {
		for (const match of matches) {
			const matchIndices = match.indices
			if (!matchIndices?.[0]) continue

			const adjustedStartIndex = matchIndices[0][0] + ruleStartOffset
			const adjustedEndIndex = matchIndices[0][1] + ruleStartOffset

			const isInRange = args.cursorPos.offset >= adjustedStartIndex && args.cursorPos.offset <= adjustedEndIndex
			if (isInRange) {
				return {
					isInRange: true,
					matchIndex: matchIndices[0][0] + 1
				}
			}
		}
	}

	//* ---------- AttributeSelector Parsed [attr] -----------------------------------------------

	function _handleAttributeSelector(attributeSelectorNode: AttributeSelectorNode, item: ListItem): void {
		if (!_isCursorAtAttributeEnd(attributeSelectorNode)) return

		const previous =
			getClosestAttachedTypeSelector({ item }) ??
			(VISIT_CONTEXT.pseudoClassSelectorStack.every((s) => s === false)
				? VISIT_CONTEXT.typeSelectorsInSelector.at(-1)
				: undefined)
		if (!previous) return

		if (attributeSelectorNode.name.name === GLOBALS.HAQ_CSS_RAW_ATTRIBUTE_PLACEHOLDER) {
			_populateAttributeCompletions(previous.name)
			return
		}

		if (attributeSelectorNode.name.name === selDirective || attributeSelectorNode.name.name === dynSelDirective) {
			_populateHaqAttributeSelectors(previous.name)
			return
		}

		_populateOtherAttributeValues(attributeSelectorNode, previous.name)
	}

	function _populateHaqAttributeSelectors(parentMarkupId: string): void {
		VISIT_CONTEXT.completions = []
		const filteredCssMarkup = args.cssMarkup?.filter((r) => r.parentId === parentMarkupId) ?? []
		for (const record of filteredCssMarkup) {
			if (record.selKind === "ID" || record.selKind === "TAG" || !record.selValue) continue

			VISIT_CONTEXT.context = "ATTRIBUTE_VALUE"
			VISIT_CONTEXT.completions.push(record.selValue)
		}
	}

	function _populateOtherAttributeValues(attributeSelectorNode: AttributeSelectorNode, tagName: string): void {
		const customElement = args.customElementsMap.get(tagName)
		if (!customElement) return

		const nativeAttributes = _getNativeElemAttributes(tagName)
		const globalAttributes = _getGlobalCustomAttributes()
		const customAttributes = customElement.attrs || []
		const allAttributes = nativeAttributes.concat(customAttributes).concat(globalAttributes)

		const validAttribute = allAttributes.find((attr) => attr.name === attributeSelectorNode.name.name)
		if (!(validAttribute && Array.isArray(validAttribute.value))) return

		VISIT_CONTEXT.context = "ATTRIBUTE_VALUE"
		VISIT_CONTEXT.completions = validAttribute.value
	}

	function _populateAttributeCompletions(tagName: string): void {
		const customElement = args.customElementsMap.get(tagName)
		if (!customElement) return

		const nativeAttributes = _getNativeElemAttributes(tagName)
		const globalAttributes = _getGlobalCustomAttributes()
		const customAttributes = customElement.attrs || []

		const filteredCssMarkup = args.cssMarkup?.filter((r) => r.tagName === tagName) ?? []
		const haqAttrCompletions: string[] = []
		for (const record of filteredCssMarkup) {
			if (record.selKind === "ID" || record.selKind === "TAG") continue
			const sanitizedAttribute = record.selValue
			const directive = record.selKind === "HAQ_SEL_ATTR" ? selDirective : dynSelDirective
			const insertText = `${directive}="${sanitizedAttribute}"`
			haqAttrCompletions.push(insertText)
		}

		const allAttributes = nativeAttributes
			.concat(customAttributes)
			.concat(globalAttributes)
			.map((attr) => attr.name)

		VISIT_CONTEXT.context = "EMPTY_ATTRIBUTE"
		VISIT_CONTEXT.completions = [...haqAttrCompletions, ...allAttributes]
	}

	function _getNativeElemAttributes(tagName: string): NonNullable<JSON_CustomElement["attrs"]> {
		if (!tagName.match(GLOBALS.REGEX_HTML_CUSTOM_ELEMENT)) return []
		const nativeElement = args.customElementsMap.get("abbr") // we get attributes for the abbr tag, because it has the basic HTMLAttributes
		if (!nativeElement) {
			return []
		}
		return [...(nativeElement.attrs || [])]
	}

	function _getGlobalCustomAttributes(): NonNullable<JSON_CustomElement["attrs"]> {
		return args.customElementsMap.get(GLOBALS.STAR_CHAR)?.attrs || []
	}

	//* ---------- Helpers -----------------------------------------------

	function _isCursorInRange(node: CSSNode): boolean {
		const nodeLoc = node.loc
		if (!nodeLoc) return false

		return args.cursorPos.offset >= nodeLoc.start.offset && args.cursorPos.offset <= nodeLoc.end.offset
	}

	function _isCursorAtAttributeEnd(attributeSelectorNode: AttributeSelectorNode): boolean {
		const nodeLoc = attributeSelectorNode.loc
		if (!nodeLoc) return false

		const isSameLine = nodeLoc.start.line === args.cursorPos.line
		return isSameLine && args.cursorPos.col === nodeLoc.end.column - 1
	}

	function _isCursorAfterNode(node: CSSNode): boolean {
		const nodeLoc = node.loc
		if (!nodeLoc) return false

		return args.cursorPos.offset === nodeLoc.end.offset + 1
	}

	function _isCursorAtTypeSelectorNode(node: CSSNode): boolean {
		if (!isTypeSelector(node)) return false
		const nodeLoc = node.loc
		if (!nodeLoc) return false

		return args.cursorPos.offset === nodeLoc.end.offset
	}
}
