//#region -------------------------------------------------- Type Imports

import type {
	AttributeSelectorNode,
	Completion,
	CSSNode,
	CursorPos,
	GeneratedCSSMarkupObject,
	IdSelectorNode,
	ListItem,
	PseudoClassSelectorNode,
	RuleNode,
	SelectorKind,
	TypeSelectorNode
} from "../../cli/_shared/types.js"
import type { CustomElementsMap, JSON_CustomElement } from "../../cli/_shared/validation.js"
import type { MarkupDirective } from "../../globals.js"

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
} from "../../cli/_shared/css.js"
import { GLOBALS } from "../../globals.js"

//#endregion ----------------------------------------------- Module Imports

type CSSCompletionContext = "TYPE_SELECTOR" | "ATTRIBUTE_VALUE" | "EMPTY_ATTRIBUTE" | "EMPTY_RULE" | "NONE"

type VisitContext = {
	markupStack: GeneratedCSSMarkupObject[]
	pseudoClassSelectorStack: boolean[]
	typeSelectorStackInHas: boolean[]
	typeSelectorsInSelector: TypeSelectorNode[]
	isCursorInRuleRange: boolean
	revisitAst: CSSNode | undefined
	completions: Completion[]
	context: CSSCompletionContext
}

type ARGS_getCssCompletions = {
	documentText: string
	cursorPos: CursorPos
	cssMarkup: GeneratedCSSMarkupObject[] | undefined
	customElementsMap: CustomElementsMap
}

type RT_getCssCompletions = {
	context: CSSCompletionContext
	completions: Completion[]
}

/*******************************************************************************
 *
 * Function that returns completion data for a given CSS file.
 *
 ******************************************************************************/

export function getCssCompletions(args: ARGS_getCssCompletions): RT_getCssCompletions {
	const AST = parse(args.documentText, {
		positions: true
	})
	const CHAR_BEFORE_CURSOR = args.documentText.at(args.cursorPos.offset - 1)
	const IS_CURRENT_LINE_EMPTY = args.documentText
		.split("\n")
		.some((line, index) => args.cursorPos.line - 1 === index && line.trim().length === 0)

	const ROOT_MARKUP = args.cssMarkup?.find((r) => !r.parentId)

	const SEL_DIRECTIVE: MarkupDirective = "x_sel"
	const DYN_SEL_DIRECTIVE: MarkupDirective = "x_dyn_sel"

	let visitContext: VisitContext = _init()

	_walkAST(AST)

	const revisitAST = visitContext.revisitAst

	if (revisitAST) {
		// adjust cursor
		args.cursorPos.col += GLOBALS.HAQ_CSS_RAW_ATTRIBUTE_PLACEHOLDER.length
		// reset visit context
		visitContext = _init()
		// then traverse
		_walkAST(revisitAST)
	}

	if (!visitContext.isCursorInRuleRange && IS_CURRENT_LINE_EMPTY && ROOT_MARKUP) {
		return {
			context: "EMPTY_RULE",
			completions: [
				{
					label: constructSelectorStringFromMarkup(ROOT_MARKUP)
				}
			]
		}
	}

	return { completions: visitContext.completions, context: visitContext.context }

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
					visitContext.isCursorInRuleRange = _isCursorInRange(node)
					if (visitContext.isCursorInRuleRange) _handleRule(node)
				}

				if (!visitContext.isCursorInRuleRange) return

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
		if (args.cursorPos.col === ruleNode.loc?.start.column && ROOT_MARKUP) {
			visitContext.context = "TYPE_SELECTOR"
			visitContext.completions = [
				{
					label: constructSelectorStringFromMarkup(ROOT_MARKUP)
				}
			]
		}
	}

	//* ---------- In Rule Range -----------------------------------------------

	function _handleInRuleRange(node: CSSNode, item: ListItem): void {
		if (isSelector(node)) _handleSelector()

		if (isTypeSelector(node)) {
			visitContext.typeSelectorsInSelector.push(node)
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
			const parentMarkup = visitContext.markupStack.at(-1)
			if (!parentMarkup) return
			_populateSelectorCompletions(parentMarkup.id)
		}
	}

	//* ---------- PseudoClassSelector -----------------------------------------------

	function _handlePseudoClassSelectorEnter(pseudoClassSelectorNode: PseudoClassSelectorNode): void {
		const hasSelector = isHasSelector(pseudoClassSelectorNode)
		visitContext.pseudoClassSelectorStack.push(hasSelector)
		if (hasSelector) _handleHasSelector(pseudoClassSelectorNode)
	}

	function _handleHasSelector(pseudoClassSelectorNode: PseudoClassSelectorNode): void {
		const parentMarkup = visitContext.markupStack.at(-1)
		if (!parentMarkup) return

		if (!_isCursorInRange(pseudoClassSelectorNode)) return

		_populateSelectorCompletions(parentMarkup.id)
	}

	function _handlePseudoClassSelectorLeave(pseudoClassSelectorNode: PseudoClassSelectorNode): void {
		if (!visitContext.isCursorInRuleRange) return
		visitContext.pseudoClassSelectorStack.pop()

		if (isHasSelector(pseudoClassSelectorNode)) {
			for (const _ of visitContext.typeSelectorStackInHas) {
				visitContext.markupStack.pop()
			}
			visitContext.typeSelectorStackInHas.length = 0
		}
	}

	//* ---------- Selector -----------------------------------------------

	function _handleSelector(): void {
		if (visitContext.pseudoClassSelectorStack.length === 0) {
			// reset only if selector is not inside a PseudoClassSelector
			visitContext.markupStack.length = 0
			visitContext.typeSelectorsInSelector.length = 0
		}
	}

	//* ---------- Combinator -----------------------------------------------

	function _handleSiblingCombinator(node: CSSNode): boolean {
		if (!isCombinator(node)) return false
		if (!_isCursorAfterNode(node)) return false

		const parentMarkup = visitContext.markupStack.at(-2)
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
				(next.name.name === SEL_DIRECTIVE || next.name.name === DYN_SEL_DIRECTIVE) && isStringNode(next.value)
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
		const parentMarkupFromStack = visitContext.markupStack.at(lookupIndex)
		if (parentMarkupFromStack) {
			const validParentMarkup = args.cssMarkup?.find((r) => r.id === markupRecord?.parentId)
			if (validParentMarkup !== parentMarkupFromStack) return
		}

		visitContext.markupStack.push(markupRecord)

		if (visitContext.pseudoClassSelectorStack.some((p) => p === true)) visitContext.typeSelectorStackInHas.push(true)
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

		visitContext.context = "TYPE_SELECTOR"
		visitContext.completions = childRecords.map((r) => ({
			label: constructSelectorStringFromMarkup(r)
		}))
	}

	//* ---------- AttributeSelector Raw [] -----------------------------------------------

	function _handleRawAttribute(rawValue: string, ruleStartOffset: number): void {
		const ATTRIBUTE_REGEX = /\[\]/dg
		const matches = rawValue.matchAll(ATTRIBUTE_REGEX)

		const result = _isCursorInRangeOfRawAttribute(matches, ruleStartOffset)
		if (!result?.isInRange) return

		const newParsableDocument = `${args.documentText.slice(0, ruleStartOffset + result.matchIndex)}${GLOBALS.HAQ_CSS_RAW_ATTRIBUTE_PLACEHOLDER}${args.documentText.slice(ruleStartOffset + result.matchIndex)}`
		const newAST = parse(newParsableDocument, {
			positions: true
		})

		visitContext.revisitAst = newAST
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
		if (!_isCursorWithinAttribute(attributeSelectorNode)) return

		const previous =
			getClosestAttachedTypeSelector({ item }) ??
			(visitContext.pseudoClassSelectorStack.every((s) => s === false)
				? visitContext.typeSelectorsInSelector.at(-1)
				: undefined)
		if (!previous) return

		if (attributeSelectorNode.name.name === GLOBALS.HAQ_CSS_RAW_ATTRIBUTE_PLACEHOLDER) {
			_populateAttributeCompletions(previous.name)
			return
		}

		if (attributeSelectorNode.name.name === SEL_DIRECTIVE || attributeSelectorNode.name.name === DYN_SEL_DIRECTIVE) {
			_populateHaqAttributeSelectors(previous.name)
			return
		}

		_populateOtherAttributeValues(attributeSelectorNode, previous.name)
	}

	function _populateHaqAttributeSelectors(parentMarkupId: string): void {
		visitContext.completions = []
		const filteredCssMarkup = args.cssMarkup?.filter((r) => r.parentId === parentMarkupId) ?? []
		for (const record of filteredCssMarkup) {
			if (record.selKind === "ID" || record.selKind === "TAG" || !record.selValue) continue

			visitContext.context = "ATTRIBUTE_VALUE"
			visitContext.completions.push({ label: record.selValue })
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

		visitContext.context = "ATTRIBUTE_VALUE"
		visitContext.completions = validAttribute.value.map((v) => ({
			label: v
		}))
	}

	function _populateAttributeCompletions(tagName: string): void {
		const customElement = args.customElementsMap.get(tagName)
		if (!customElement) return

		const nativeAttributes = _getNativeElemAttributes(tagName)
		const globalAttributes = _getGlobalCustomAttributes()
		const customAttributes = customElement.attrs || []

		const filteredCssMarkup = args.cssMarkup?.filter((r) => r.tagName === tagName) ?? []
		const haqAttrCompletions: Completion[] = []
		for (const record of filteredCssMarkup) {
			if (record.selKind === "ID" || record.selKind === "TAG") continue
			const sanitizedAttribute = record.selValue
			const directive = record.selKind === "HAQ_SEL_ATTR" ? SEL_DIRECTIVE : DYN_SEL_DIRECTIVE
			const insertText = `${directive}="${sanitizedAttribute}"`
			haqAttrCompletions.push({ label: insertText })
		}

		const allAttributes = nativeAttributes
			.concat(customAttributes)
			.concat(globalAttributes)
			.map((attr) => {
				const acceptsStringValues = attr.value !== undefined
				if (acceptsStringValues) {
					return {
						label: attr.name,
						snippet: `${attr.name}="$0"`
					}
				}
				return { label: attr.name }
			})

		visitContext.context = "EMPTY_ATTRIBUTE"
		visitContext.completions = [...haqAttrCompletions, ...allAttributes]
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

	function _isCursorWithinAttribute(attributeSelectorNode: AttributeSelectorNode): boolean {
		const nodeLoc = attributeSelectorNode.loc
		if (!nodeLoc) return false

		const isSameLine = nodeLoc.start.line === args.cursorPos.line
		return isSameLine && nodeLoc.start.column < args.cursorPos.col && args.cursorPos.col < nodeLoc.end.column
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
