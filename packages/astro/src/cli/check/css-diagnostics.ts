//#region -------------------------------------------------- Type Imports

import type { CssLocation, Identifier } from "css-tree"
import type { MarkupDirective } from "../../globals.js"
import type {
	AttributeSelectorNode,
	CSSMarkupMap,
	CSSNode,
	DeclarationNode,
	Diagnostic,
	FunctionNode,
	GeneratedCSSMarkupObject,
	List,
	ListItem,
	LocationNode,
	PseudoClassSelectorNode,
	SelectorNode,
	TypeSelectorNode
} from "../_shared/types.js"
import type { CustomElementsMap, JSON_Attribute, JSON_CustomElement } from "../_shared/validation.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { assertUnreachable } from "@haq/utils"
import { parse, walk } from "css-tree"
import { GLOBALS } from "../../globals.js"
import {
	constructSelectorStringFromMarkup,
	getClosestAttachedTypeSelector,
	isAttributeSelector,
	isClassSelector,
	isCombinator,
	isCustomElementSelector,
	isCustomPropertyDeclation,
	isHasSelector,
	isIdentifier,
	isIdSelector,
	isKeyframesAtRule,
	isPseudoClassSelector,
	isRule,
	isSelector,
	isStringNode,
	isTypeSelector,
	isVarFunction
} from "../_shared/css.js"
import { sameDiagRanges } from "../_shared/diag.js"
import { getRelativeFilePath } from "../_shared/fs.js"
import { generateUnionFromArray } from "../_shared/strings.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_getCSSDiagnostics = {
	document: string
	filePath: string
	globalCssPath: string
	customElementsMap: CustomElementsMap
	cssMarkupMap: CSSMarkupMap
	rootCustomProperties: string[]
}

/*******************************************************************************
 *
 * Function that gets diagnostics for a given CSS file.
 *
 ******************************************************************************/

export function getCSSDiagnostics(args: ARGS_getCSSDiagnostics): Diagnostic[] {
	const sourceFile = getRelativeFilePath(args.filePath)

	const flatMarkup = args.cssMarkupMap.get(args.filePath)?.flatMarkup
	const isLocalCssFile = !args.filePath.includes(args.globalCssPath)

	const diagnostics: Diagnostic[] = []

	const rootMarkup = flatMarkup?.find((r) => !r.parentId)

	const selDirective: MarkupDirective = "x_sel"
	const dynSelDirective: MarkupDirective = "x_dyn_sel"

	const globalCustomAttributes = args.customElementsMap.get(GLOBALS.STAR_CHAR)

	const markupStack: GeneratedCSSMarkupObject[] = []
	const customElementSelectorsInRule: TypeSelectorNode[] = []
	const typeSelectorsInSelector: TypeSelectorNode[] = []
	const customElementSelectorsInComment: TypeSelectorNode[] = []
	const pseudoClassSelectorStack: boolean[] = [] // if true then it is a :has PseudoClassSelector
	const typeSelectorStackInHas: boolean[] = []
	const ignoreDirectiveStack: { loc: CssLocation; wasUsed: boolean }[] = []

	let shouldWalk = true
	let isInRule = false

	type Comment = {
		locLine: number
		tagName: string
	}

	const comments: Comment[] = []
	const ast = parse(args.document, {
		positions: true,
		onComment: (value, loc) => {
			const trimmedValue = value.trim().toLowerCase()
			if (trimmedValue === GLOBALS.HAQ_CHECK_IGNORE_ENTIRE_FILE_DIRECTIVE) {
				shouldWalk = false
			}

			if (trimmedValue === GLOBALS.HAQ_CHECK_IGNORE_DIRECTIVE) {
				ignoreDirectiveStack.push({ loc, wasUsed: false })
			}

			if (trimmedValue.match(GLOBALS.REGEX_HTML_CUSTOM_ELEMENT)) {
				comments.push({
					locLine: loc.start.line,
					tagName: trimmedValue
				})
			}
		}
	})

	if (!shouldWalk) return []

	// check if localfile and generated markup

	if (isLocalCssFile) {
		if (!flatMarkup) {
			_addDiagnostic({
				message: "No Astro file imports this css file.",
				range: _getPositionRange(undefined)
			})
			return diagnostics
		}
		if (!rootMarkup) {
			_addDiagnostic({
				message:
					"The Astro file that imports this css file does not have any markup. Consider using directives to create a markup context.",
				range: _getPositionRange(undefined)
			})
			return diagnostics
		}
	}

	_walkAST()
	_checkUnusedIgnoreDirectives()

	return diagnostics

	//* ---------- Internals -----------------------------------------------

	function _walkAST(): void {
		walk(ast, {
			enter: (node: CSSNode, item: ListItem) => {
				const { loc } = node

				if (isRule(node)) {
					isInRule = true
					customElementSelectorsInRule.length = 0
					markupStack.length = 0
					_handleEndOfKeyframesAtRule(node)
				}

				if (isKeyframesAtRule(node)) _handleKeyFramesAtRule(node)

				if (!isInRule) return

				if (isPseudoClassSelector(node)) _handlePseudoClassSelectorEnter(node)

				if (isSelector(node)) _handleSelector(node)

				_handleInRuleNode({
					loc,
					node,
					item
				})
			},

			leave: (node: CSSNode, _item: ListItem) => {
				if (isRule(node)) {
					isInRule = false
				}
				if (!isInRule) return

				if (isPseudoClassSelector(node)) _handlePseudoClassSelectorLeave(node)
			}
		})
	}

	function _checkUnusedIgnoreDirectives(): void {
		for (const obj of ignoreDirectiveStack) {
			if (obj.wasUsed) continue
			_addDiagnostic({
				message:
					"Suppression comment has no effect. Remove the suppression or make sure you are suppressing the correct error.",
				range: _getPositionRange(obj.loc)
			})
		}
	}

	//* ---------- PseudoClassSelector -----------------------------------------------

	function _handlePseudoClassSelectorEnter(pseudoClassSelectorNode: PseudoClassSelectorNode): void {
		const hasSelector = isHasSelector(pseudoClassSelectorNode)
		pseudoClassSelectorStack.push(hasSelector)
	}

	function _handlePseudoClassSelectorLeave(pseudoClassSelectorNode: PseudoClassSelectorNode): void {
		pseudoClassSelectorStack.pop()

		if (isHasSelector(pseudoClassSelectorNode)) {
			for (const _ of typeSelectorStackInHas) {
				markupStack.pop()
			}
			typeSelectorStackInHas.length = 0
		}
	}

	//* ---------- Selector -----------------------------------------------

	function _handleSelector(selectorNode: SelectorNode): void {
		if (pseudoClassSelectorStack.length === 0) {
			// reset only if selector is not inside a PseudoClassSelector

			markupStack.length = 0
			typeSelectorsInSelector.length = 0
		}

		const children = selectorNode.children.toArray()
		for (const child of children.filter((ch) => isCustomElementSelector(ch))) {
			customElementSelectorsInRule.push(child)
		}
	}

	//* ---------- KeyFrameRule -----------------------------------------------

	function _handleEndOfKeyframesAtRule(node: CSSNode): void {
		const lastKeyFramesNode = customElementSelectorsInComment.at(-1)
		if (!lastKeyFramesNode) return

		const newRuleStartLine = node.loc?.start.line
		const lastKeyFramesNodeEndline = lastKeyFramesNode.loc?.end.line
		if (!(newRuleStartLine && lastKeyFramesNodeEndline)) return

		if (newRuleStartLine > lastKeyFramesNodeEndline) customElementSelectorsInComment.length = 0
	}

	function _handleKeyFramesAtRule(node: CSSNode): void {
		const startLine = node.loc?.start.line
		if (!startLine) return

		const lastComment = comments.find((comment) => comment.locLine === startLine - 1)
		if (!lastComment) return

		const TypeSelectorInCommentNode: TypeSelectorNode = {
			type: "TypeSelector",
			name: lastComment.tagName,
			loc: node.loc
		}

		customElementSelectorsInComment.push(TypeSelectorInCommentNode)
	}

	//* ---------- In Rule Node -----------------------------------------------

	type ARGS__handleInRuleNode = {
		node: CSSNode
		item: ListItem
		loc: LocationNode
	}

	function _handleInRuleNode({ loc, node, item }: ARGS__handleInRuleNode): void {
		if (isTypeSelector(node)) {
			typeSelectorsInSelector.push(node)
			if (isLocalCssFile) _handleTypeSelector({ typeSelectorNode: node, loc, item })
		}
		if (isAttributeSelector(node)) {
			_handleAttributeSelector({ attributeSelectorNode: node, item, loc })
		}
		if (isVarFunction(node)) {
			_handleVarFunction(node)
		}
		if (isCustomPropertyDeclation(node)) {
			_handleCustomPropertyDeclaration({ declarationNode: node, loc })
		}

		if (isLocalCssFile) {
			_handleLocalFile({ item, loc, node })
			return
		}

		_handleGlobalFile({ node, loc, item })
	}

	//* ---------- Global Css File -----------------------------------------------

	function _handleGlobalFile({ node, loc, item }: ARGS__handleInRuleNode): void {
		// If selector has type selector, it should be first
		if (isSelector(node)) __handleSelectorInGlobalFile(node)

		// ClassSelector should have no typeselector attached

		if (isClassSelector(node)) {
			const previous = getClosestAttachedTypeSelector({ item })
			if (!previous) return

			_addDiagnostic({
				message: "Do not use class selector associated with a type selector in your global css folder.",
				range: _getPositionRange(loc)
			})
		}

		// IdSelector should have no typeselector attached
		if (isIdSelector(node)) {
			_addDiagnostic({
				message: "Do not use id selector in your global css folder.",
				range: _getPositionRange(loc)
			})
		}

		if (!isTypeSelector(node)) return

		__handleTypeSelectorInGlobalFile(node)

		//* ---------- Helpers -----------------------------------------------

		function __handleSelectorInGlobalFile(selectorNode: SelectorNode): void {
			const typeSelIndex = selectorNode.children.toArray().findIndex((n) => {
				if (n.type !== "TypeSelector") return false
				if (n.name === GLOBALS.STAR_CHAR) return false
				return true
			})
			if (typeSelIndex === -1) return
			if (typeSelIndex !== 0) {
				_addDiagnostic({
					message:
						"Do not use child type selector in your global css folder. Type selector rules should be as simple as possible.",
					range: _getPositionRange(loc)
				})
			}
		}

		// TypeSelectors should only be native elements and have no parent typeselector
		function __handleTypeSelectorInGlobalFile(typeSelectorNode: TypeSelectorNode): void {
			// ignore star selector
			if (typeSelectorNode.name === GLOBALS.STAR_CHAR) return

			// ignore script tags
			if (GLOBALS.IGNORABLE_TYPE_SELECTORS.includes(typeSelectorNode.name)) return

			if (typeSelectorNode.name.includes("-")) {
				_addDiagnostic({
					message: "Do not use custom-element type selector in your global css folder.",
					range: _getPositionRange(loc)
				})
				return
			}

			// check if TypeSelector exists natively

			if (!args.customElementsMap.get(typeSelectorNode.name)) {
				_addDiagnostic({
					message: `Invalid type selector: "${typeSelectorNode.name}". This element does not exist natively in the browser.`,
					range: _getPositionRange(loc)
				})
			}

			__handleOtherTypeSelectorUses()
		}

		function __handleOtherTypeSelectorUses(): void {
			if (pseudoClassSelectorStack.length > 0) {
				_addDiagnostic({
					message:
						"Do not use type selectors in pseudo-class selectors in your global css folder. Type selector rules should be as simple as possible.",
					range: _getPositionRange(loc)
				})
				return
			}

			if (typeSelectorsInSelector.at(-2)) {
				_addDiagnostic({
					message:
						"Do not use multiple type selectors in a rule in your global css folder. Type selector rules should be as simple as possible.",
					range: _getPositionRange(loc)
				})
			}
		}
	}

	//* ---------- Local File -----------------------------------------------

	function _handleLocalFile({ item, loc, node }: ARGS__handleInRuleNode): void {
		if (isClassSelector(node)) {
			_addDiagnostic({
				message: "Do not use class selector outside of your global css folder.",
				range: _getPositionRange(loc)
			})
			return
		}

		if (isIdSelector(node)) {
			const previous = item.prev?.data

			if (previous && isTypeSelector(previous)) return // checked by TypeSelector handling

			_addDiagnostic({
				message: "Do not use id selector without a type selector attached.",
				range: _getPositionRange(loc)
			})
		}
	}

	//* ---------- Type Selector -----------------------------------------------

	type ARGS__handleTypeSelector = {
		typeSelectorNode: TypeSelectorNode
		item: ListItem
		loc: LocationNode
	}

	function _handleTypeSelector({ loc, typeSelectorNode, item }: ARGS__handleTypeSelector): void {
		const tagName = typeSelectorNode.name
		if (tagName === GLOBALS.STAR_CHAR) return // ignore star selector

		const parentMarkup = markupStack.at(-1)

		if (!rootMarkup) return

		if (!parentMarkup) {
			__handleRootElem(rootMarkup)
			return
		}

		__handleChildElem(rootMarkup)

		//* ---------- Helpers -----------------------------------------------

		function __handleRootElem(rootRecord: GeneratedCSSMarkupObject): void {
			if (__isNodeValidMarkup(rootRecord)) {
				__handleMarkupStack(rootRecord)
				return
			}
			__addTypeSelectorDiag(`"${constructSelectorStringFromMarkup(rootRecord)}"`)
		}

		function __handleChildElem(rootRecord: GeneratedCSSMarkupObject): void {
			const lookupIndex = __isPreviousSiblingCombinator() ? -2 : -1
			const parentRecord = markupStack.at(lookupIndex)

			if (__isPreviousSiblingCombinator()) {
				__handleSiblingElem({ parentRecord, rootRecord })
				return
			}
			__validateChild(parentRecord)
		}

		function __validateChild(parentRecord: GeneratedCSSMarkupObject | undefined): void {
			if (!parentRecord) return // there must always be a rootRecord

			const childRecords = flatMarkup?.filter((r) => r.parentId === parentRecord.id) ?? []
			const validChild = childRecords.find((r) => __isNodeValidMarkup(r))
			if (validChild) {
				__handleMarkupStack(validChild)
				return
			}
			const expectedSelector =
				childRecords.length === 0
					? `no child of ${constructSelectorStringFromMarkup(parentRecord)}.`
					: childRecords.map((r) => constructSelectorStringFromMarkup(r)).join(` ${GLOBALS.PIPE_CHAR} `)
			__addTypeSelectorDiag(expectedSelector)
		}

		function __handleSiblingElem({
			parentRecord,
			rootRecord
		}: {
			parentRecord: GeneratedCSSMarkupObject | undefined
			rootRecord: GeneratedCSSMarkupObject
		}): void {
			if (!parentRecord) {
				_addDiagnostic({
					message: `Invalid sibling selector. Expected no sibling for ${constructSelectorStringFromMarkup(rootRecord)}`,
					range: _getPositionRange(loc)
				})
				return
			}
			__validateChild(parentRecord)
		}

		function __isPreviousSiblingCombinator(): boolean {
			const prev = item.prev?.data
			if (!prev) return false
			if (!isCombinator(prev)) return false
			if (!GLOBALS.CSS_SIBLING_CHARS.includes(prev.name)) return false
			return true
		}

		function __isNodeValidMarkup(markupRecord: GeneratedCSSMarkupObject): boolean {
			// edge case: user used alias directive on component that is unaliasable
			if (!markupRecord.selKind) return false

			switch (markupRecord.selKind) {
				case "TAG":
					return ___handleTagSel()

				case "ID":
					return ___handleIdSel()

				case "HAQ_SEL_ATTR":
					return ___handleHaqSel()

				case "HAQ_DYN_SEL_ATTR":
					return ___handleHaqDynSel()

				default: {
					assertUnreachable(markupRecord.selKind)
					return false
				}
			}

			//* ---------- Helpers -----------------------------------------------

			function ___handleTagSel(): boolean {
				const next = item.next?.data
				if (tagName !== markupRecord.tagName) return false
				if (next?.type === "IdSelector") return false
				if (
					next?.type === "AttributeSelector" &&
					(next.name.name === selDirective || next.name.name === dynSelDirective)
				)
					return false
				return true
			}

			function ___handleIdSel(): boolean {
				const next = item.next?.data
				if (!next) return false
				if (next.type !== "IdSelector") return false
				return tagName === markupRecord.tagName && next.name === markupRecord.selValue
			}

			function ___handleHaqSel(): boolean {
				const next = item.next?.data
				if (next?.type !== "AttributeSelector") return false
				if (next.name.name !== selDirective) return false
				const attributeValue = isStringNode(next.value) && next.value.value !== "" ? next.value.value : undefined
				return tagName === markupRecord.tagName && attributeValue === markupRecord.selValue
			}

			function ___handleHaqDynSel(): boolean {
				const next = item.next?.data
				if (next?.type !== "AttributeSelector") return false
				if (next.name.name !== dynSelDirective) return false
				const attributeValue = isStringNode(next.value) && next.value.value !== "" ? next.value.value : undefined
				return tagName === markupRecord.tagName && attributeValue === markupRecord.selValue
			}
		}

		function __handleMarkupStack(markupRecord: GeneratedCSSMarkupObject): void {
			markupStack.push(markupRecord)
			if (pseudoClassSelectorStack.some((p) => p === true)) typeSelectorStackInHas.push(true)
		}

		function __addTypeSelectorDiag(expectedSelector: string): void {
			_addDiagnostic({
				message: `Invalid Type Selector. Expected ${expectedSelector}`,
				range: _getPositionRange(loc)
			})
		}
	}

	//* ---------- Attribute Selector -----------------------------------------------

	type ARGS__handleAttributeSelector = {
		attributeSelectorNode: AttributeSelectorNode
		item: ListItem
		loc: LocationNode
	}

	function _handleAttributeSelector({ attributeSelectorNode, item, loc }: ARGS__handleAttributeSelector): void {
		const validAttribute = _isValidAttribute({ attributeSelectorNode, item, loc })
		if (!validAttribute) return
		_handlAttributeValue({ attributeFromMap: validAttribute, attributeSelectorNode, loc })
	}

	function _isValidAttribute({
		item,
		attributeSelectorNode,
		loc
	}: ARGS__handleAttributeSelector): NonNullable<JSON_CustomElement["attrs"]>[number] | undefined {
		const { name } = attributeSelectorNode
		const previous =
			getClosestAttachedTypeSelector({ item }) ??
			(pseudoClassSelectorStack.every((s) => s === false) ? typeSelectorsInSelector.at(-1) : undefined)

		if (!previous) {
			_addDiagnostic({
				message: "Do not use attribute without a Type Selector associated with it.",
				range: _getPositionRange(loc)
			})

			return
		}

		return __getValidAttribute(previous)

		function __getValidAttribute(
			prevTypeSelectorNode: TypeSelectorNode
		): NonNullable<JSON_CustomElement["attrs"]>[number] | undefined {
			const attributeName = name.name
			if (attributeName === selDirective || attributeName === dynSelDirective) return // handled by TypeSelector diagnostics

			const tagName = prevTypeSelectorNode.name === GLOBALS.STAR_CHAR ? "abbr" : prevTypeSelectorNode.name
			const customElement = args.customElementsMap.get(tagName)
			if (!customElement) return //  handled by TypeSelector diagnostics

			// Collect candidate attributes
			const nativeAttributes = _getNativeAttributes(prevTypeSelectorNode)

			const allAttributes = [
				...nativeAttributes,
				...(customElement.attrs ?? []),
				...(globalCustomAttributes?.attrs ?? [])
			]
			const attribute = allAttributes.find((a) => a.name === attributeName)

			// If not found, report diagnostic
			if (!attribute) {
				_addDiagnostic({
					message: `Attribute "${attributeName}" does not exist for element "${prevTypeSelectorNode.name}".`,
					range: _getPositionRange(loc)
				})
				return
			}

			return attribute
		}
	}

	type SelectorStackNode = TypeSelectorNode | PseudoClassSelectorNode

	function _getNativeAttributes(item: SelectorStackNode): NonNullable<JSON_CustomElement["attrs"]> {
		return item.name.match(GLOBALS.REGEX_HTML_CUSTOM_ELEMENT) ? (args.customElementsMap.get("abbr")?.attrs ?? []) : []
	}

	type ARGS__handlAttributeValue = {
		attributeFromMap: JSON_Attribute
		attributeSelectorNode: AttributeSelectorNode
		loc: LocationNode
	}

	function _handlAttributeValue({ attributeFromMap, attributeSelectorNode, loc }: ARGS__handlAttributeValue): void {
		if (!attributeFromMap.value) {
			_expectNoAttributeValue({ attributeFromMap, attributeSelectorNode, loc })
			return
		}
		if (attributeFromMap.value === "string") {
			_expectStringAttributeValue({ attributeFromMap, attributeSelectorNode, loc })
			return
		}
		if (attributeFromMap.value === "number") {
			_expectNumberAttributeValue({ attributeFromMap, attributeSelectorNode, loc })
			return
		}

		if (!isStringNode(attributeSelectorNode.value)) {
			_addDiagnostic({
				message: `Attribute "${attributeFromMap.name}" must take in a value of type ${generateUnionFromArray(attributeFromMap.value)}.`,
				range: _getPositionRange(loc)
			})
			return
		}
		if (attributeFromMap.value.includes(attributeSelectorNode.value.value)) return

		_addDiagnostic({
			message: `"${attributeSelectorNode.value.value}" is not assignable to ${generateUnionFromArray(attributeFromMap.value)}.`,
			range: _getPositionRange(attributeSelectorNode.value.loc)
		})
	}

	function _expectNoAttributeValue({ attributeFromMap, attributeSelectorNode }: ARGS__handlAttributeValue): void {
		if (!isStringNode(attributeSelectorNode.value)) return

		_addDiagnostic({
			message: `Attribute "${attributeFromMap.name}" does not take in any values.`,
			range: _getPositionRange(attributeSelectorNode.value.loc)
		})
	}

	function _expectStringAttributeValue({
		attributeFromMap,
		attributeSelectorNode,
		loc
	}: ARGS__handlAttributeValue): void {
		if (isStringNode(attributeSelectorNode.value) && attributeSelectorNode.value.value !== "") return

		_addDiagnostic({
			message: `Attribute "${attributeFromMap.name}" must take in a string as a value.`,
			range: _getPositionRange(loc)
		})
	}

	function _expectNumberAttributeValue({
		attributeFromMap,
		attributeSelectorNode,
		loc
	}: ARGS__handlAttributeValue): void {
		const numberRegex = GLOBALS.REGEX_STRING_NUMBER
		if (
			isStringNode(attributeSelectorNode.value) &&
			attributeSelectorNode.value.value !== "" &&
			attributeSelectorNode.value.value.match(numberRegex)
		)
			return

		_addDiagnostic({
			message: `Attribute "${attributeFromMap.name}" must take in a number as a value.`,
			range: _getPositionRange(loc)
		})
	}

	//* ---------- CSS Variables -----------------------------------------------

	type ARGS__handleCustomPropertyDeclaration = {
		declarationNode: DeclarationNode
		loc: LocationNode
	}

	function _handleCustomPropertyDeclaration({ loc, declarationNode }: ARGS__handleCustomPropertyDeclaration): void {
		const variableName = declarationNode.property
		_handleCustomPropertyValue({ loc, declarationNode })

		// ignore :root custom properties because they are the source of truth
		if (args.rootCustomProperties.includes(variableName)) return

		const parentSelector = markupStack.at(-1)
		if (!parentSelector) {
			_addDiagnostic({
				message: `Custom property "${variableName}" must have a defined custom-element as a selector.`,
				range: _getPositionRange(loc)
			})
			return
		}

		const tagName = parentSelector.tagName
		_handleCustomPropertyName({ tagName, variableName, loc })
	}

	function _handleCustomPropertyValue({ loc, declarationNode }: ARGS__handleCustomPropertyDeclaration): void {
		if (declarationNode.value.type !== "Raw") return

		const valueLoc = declarationNode.value.loc
		const value = declarationNode.value.value.trim()
		const matches = value.matchAll(/var\(([^()]+)\)/g)

		for (const match of matches) {
			const variableName = match[1]?.trim() || ""
			const positionRange = _getPositionRange(valueLoc)

			const newLoc: NonNullable<LocationNode> = {
				source: loc?.source || "",
				start: positionRange.start,
				end: positionRange.end
			}
			newLoc.start.column = newLoc.start.column + match.index + GLOBALS.CSS_VAR_FUNCTION_OFFSET
			newLoc.end.column = newLoc.start.column + variableName.length

			_handleVariableReference({ loc: newLoc, variableName })
		}
	}

	type ARGS__handleCustomPropertyName = { tagName: string; variableName: string; loc: LocationNode }

	function _handleCustomPropertyName({ tagName, variableName, loc }: ARGS__handleCustomPropertyName): void {
		const customElement = args.customElementsMap.get(tagName)
		if (!customElement) return

		const concatenatedVariables = (customElement.cssDynamicVars || []).concat(customElement.cssStaticVars || [])
		if (!concatenatedVariables.includes(variableName)) {
			const message =
				concatenatedVariables.length === 0
					? `Custom element "${tagName}" does not have any defined custom properties.`
					: `"${variableName}" is not assignable to ${generateUnionFromArray(concatenatedVariables)}.`
			_addDiagnostic({
				message,
				range: _getPositionRange(loc)
			})
		}
	}

	//* ---------- Var declarations -----------------------------------------------

	function _handleVarFunction(functionNode: FunctionNode): void {
		const identifierNode = _getIdentifierNameFromVarFunction(functionNode.children)
		if (!identifierNode) return
		_handleVariableReference({
			variableName: identifierNode.name,
			loc: identifierNode.loc
		})
	}

	function _getIdentifierNameFromVarFunction(nodeList: List): Identifier | undefined {
		const children = nodeList.toArray()
		return children.find((child) => isIdentifier(child))
	}

	type ARGS__handleVariableReference = {
		variableName: string
		loc: LocationNode
	}

	function _handleVariableReference({ loc, variableName }: ARGS__handleVariableReference): void {
		// ignore :root custom properties because they are the source of truth
		if (args.rootCustomProperties.includes(variableName)) return

		let allValidVariables: string[] = []
		const tagNames = customElementSelectorsInRule.concat(customElementSelectorsInComment).map((sel) => sel.name)
		for (const tagName of tagNames) {
			const customElement = args.customElementsMap.get(tagName)
			if (!customElement) continue
			allValidVariables = [
				...allValidVariables,
				...(customElement.cssDynamicVars || []).concat(customElement.cssStaticVars || [])
			]
		}

		allValidVariables = Array.from(new Set(allValidVariables))

		if (allValidVariables.includes(variableName)) return

		_addDiagnostic({
			message: `Undefined variable name "${variableName}".`,
			range: _getPositionRange(loc)
		})
	}

	//* ---------- Helpers -----------------------------------------------

	function _getPositionRange(loc: LocationNode): Diagnostic["range"] {
		const rangeStart = {
			column: loc?.start.column || 1,
			line: loc?.start.line || 1,
			offset: 0
		}
		const rangeEnd = {
			column: loc?.end.column || 1,
			line: loc?.end.line || 1,
			offset: 0
		}
		return { start: rangeStart, end: rangeEnd }
	}

	type AddDiagnosticArgs = Pick<Diagnostic, "message" | "range">

	function _addDiagnostic({ message, range }: AddDiagnosticArgs): void {
		// handle ignoreDirectiveStack

		const hasIgnoreDirective = ignoreDirectiveStack.find((d) => d.loc.start.line + 1 === range.start.line)

		if (hasIgnoreDirective) {
			hasIgnoreDirective.wasUsed = true
			return
		}

		const diagAtLocIndex = diagnostics.findLastIndex((d) =>
			sameDiagRanges(range, { start: d.range.start, end: d.range.end })
		)
		if (diagAtLocIndex !== -1) {
			diagnostics.splice(diagAtLocIndex, 1, {
				message,
				sourceFile,
				range
			})

			return
		}

		diagnostics.push({
			message,
			sourceFile,
			range
		})
	}
}
