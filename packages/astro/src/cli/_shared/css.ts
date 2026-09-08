//#region -------------------------------------------------- Type Imports

import type { SelectorList, TypeSelector } from "css-tree"
import type {
	AtRuleNode,
	AttributeSelectorNode,
	ClassSelectorNode,
	CombinatorNode,
	CSSNode,
	DeclarationNode,
	FunctionNode,
	GeneratedCSSMarkupObject,
	IdentifierNode,
	IdSelectorNode,
	ListItem,
	PseudoClassSelectorNode,
	PseudoElementSelectorNode,
	RawNode,
	RuleNode,
	SelectorNode,
	StringNode,
	TypeSelectorNode
} from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { assertUnreachable } from "@haq/utils"

//#endregion ----------------------------------------------- Module Imports

export function isRule(node: CSSNode): node is RuleNode {
	return node.type === "Rule"
}

export function isRaw(node: CSSNode): node is RawNode {
	return node.type === "Raw"
}

export function isSelector(node: CSSNode): node is SelectorNode {
	return node.type === "Selector"
}

export function isSelectorList(node: CSSNode): node is SelectorList {
	return node.type === "SelectorList"
}

export function isClassSelector(node: CSSNode): node is ClassSelectorNode {
	return node.type === "ClassSelector"
}

export function isIdSelector(node: CSSNode): node is IdSelectorNode {
	return node.type === "IdSelector"
}

export function isPseudoClassSelector(node: CSSNode): node is PseudoClassSelectorNode {
	return node.type === "PseudoClassSelector"
}

export function isPseudoElementSelector(node: CSSNode): node is PseudoElementSelectorNode {
	return node.type === "PseudoElementSelector"
}

export function isRootSelector(node: CSSNode): node is PseudoClassSelectorNode {
	return node.type === "PseudoClassSelector" && node.name === "root"
}

export function isHasSelector(node: CSSNode): node is PseudoClassSelectorNode {
	return node.type === "PseudoClassSelector" && node.name === "has"
}

export function isCustomPropertyDeclation(node: CSSNode): node is DeclarationNode {
	return node.type === "Declaration" && node.value.type === "Raw"
}

export function isCustomElementSelector(node: CSSNode): node is TypeSelectorNode {
	return node.type === "TypeSelector" && node.name.includes("-")
}

export function isElementSelector(node: CSSNode): node is TypeSelectorNode {
	return node.type === "TypeSelector" && node.name.length > 1
}

export function isTypeSelector(node: CSSNode): node is TypeSelectorNode {
	return node.type === "TypeSelector"
}

export function isAttributeSelector(node: CSSNode): node is AttributeSelectorNode {
	return node.type === "AttributeSelector"
}

export function isStringNode(node: AttributeSelectorNode["value"]): node is StringNode {
	return node?.type === "String"
}

export function isCombinator(node: CSSNode): node is CombinatorNode {
	return node.type === "Combinator"
}

export function isVarFunction(node: CSSNode): node is FunctionNode {
	return node.type === "Function" && node.name === "var"
}

export function isIdentifier(node: CSSNode): node is IdentifierNode {
	return node.type === "Identifier"
}

export function isKeyframesAtRule(node: CSSNode): node is AtRuleNode {
	return node.type === "Atrule" && node.name === "keyframes"
}

export function constructSelectorStringFromMarkup(markup: GeneratedCSSMarkupObject): string {
	// edge case: user used alias directive on component that is unaliasable
	if (!markup.selKind) return markup.tagName ?? ""

	switch (markup.selKind) {
		case "TAG":
			return markup.tagName

		case "ID":
			return `${markup.tagName}#${markup.selValue}`

		case "HAQ_SEL_ATTR":
			return `${markup.tagName}[x_sel="${markup.selValue}"]`

		case "HAQ_DYN_SEL_ATTR":
			return `${markup.tagName}[x_dyn_sel="${markup.selValue}"]`

		default:
			assertUnreachable(markup.selKind)
			return markup.tagName ?? ""
	}
}

export function getClosestAttachedTypeSelector({ item }: { item: ListItem }): TypeSelector | undefined {
	const previousItem = item.prev
	const previous = previousItem?.data

	if (!previous) return
	if (isCombinator(previous)) return

	if (isTypeSelector(previous)) return previous

	return getClosestAttachedTypeSelector({ item: previousItem })
}
