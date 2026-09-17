//#region -------------------------------------------------- Type Imports

import type { AttributeNode, Position, RootNode } from "@astrojs/compiler/types"
import type { AstroBuiltinAttributes } from "astro"
import type * as csstree from "css-tree"
import type { MarkupDirective } from "../../globals.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// Aliases for string keys/values in records
//
//------------------------------------------------------------------------------

export type __FilePath__ = string & { filePath?: never }
export type __FileContents__ = string & { fileContents?: never }
export type __ComponentName__ = string & { componentName?: never }
export type __TagName__ = string & { tagName?: never }

//------------------------------------------------------------------------------
//
// Astro AST
//
//------------------------------------------------------------------------------

export interface I_AstroAttributeNode extends AttributeNode {
	name: MarkupDirective | keyof AstroBuiltinAttributes | "name" | "id" | "class" | "slot" | "transition:persist-props"
}

export type AstroASTMap = Map<__FilePath__, RootNode>
export type FileDocumentMap = Map<__FilePath__, __FileContents__>

export type GeneratedComponent = {
	filePath: string
	rootSelector: string | undefined
	childSelectors: Set<string>
	slotChildSelectors: Set<string>
	references: Set<string>
	isWebComponent: boolean
	isAlias: boolean
}

export type GeneratedComponentMap = Map<__ComponentName__, GeneratedComponent>

export type GeneratedNamespaceTypesWithGlobal = {
	global: string
	[key: string]: string
}

export type GeneratedNamespaceTypes = {
	[key: string]: string
}

//------------------------------------------------------------------------------
//
// Generated CSS Markup Context
//
//------------------------------------------------------------------------------

export type SelectorKind = "TAG" | "ID" | "HAQ_SEL_ATTR" | "HAQ_DYN_SEL_ATTR"

export type CSSMarkupObject = {
	id: string
	selKind: SelectorKind | undefined
	tagName: string | undefined
	selValue: string | undefined
	parentId: string | undefined
}

export type GeneratedCSSMarkupObject = {
	id: string
	selKind: SelectorKind
	tagName: string
	selValue?: string
	parentId?: string
}

export type JSON_CSSMarkup = {
	componentName: string
	astroFilePath: string
	cssFilePath: string
	flatMarkup: GeneratedCSSMarkupObject[]
}

/*******************************************************************************
 *
 * Map of generated CSS flat markup.
 *
 ******************************************************************************/

export type CSSMarkupMap = Map<__FilePath__, JSON_CSSMarkup>

//------------------------------------------------------------------------------
//
// CSS AST
//
//------------------------------------------------------------------------------

export type CSSNode = csstree.CssNode
export type List = csstree.List<CSSNode>
export type ListItem = csstree.ListItem<CSSNode>

export type AtRuleNode = csstree.Atrule
export type RuleNode = csstree.Rule
export type SelectorNode = csstree.Selector
export type TypeSelectorNode = csstree.TypeSelector
export type AttributeSelectorNode = csstree.AttributeSelector
export type StringNode = csstree.StringNode
export type FunctionNode = csstree.FunctionNode
export type IdentifierNode = csstree.Identifier
export type LocationNode = csstree.CssLocation | undefined
export type DeclarationNode = csstree.Declaration
export type ClassSelectorNode = csstree.ClassSelector
export type IdSelectorNode = csstree.IdSelector
export type PseudoClassSelectorNode = csstree.PseudoClassSelector
export type PseudoElementSelectorNode = csstree.PseudoElementSelector
export type CombinatorNode = csstree.Combinator
export type RawNode = csstree.Raw

//------------------------------------------------------------------------------
//
// LSP
//
//------------------------------------------------------------------------------

type Point = Position["start"]

/*******************************************************************************
 *
 * Diagnostic payload
 *
 ******************************************************************************/

export type Diagnostic = {
	message: string
	sourceFile: string
	range: {
		start: Point
		end: Point
	}
}

/*******************************************************************************
 *
 * Completion column range
 *
 ******************************************************************************/

export type CompletionColRange = {
	start: number
	end: number
}

/*******************************************************************************
 *
 * Cursor Position
 *
 ******************************************************************************/

export type CursorPos = {
	line: number
	col: number
	offset: number
}

export type CharType = "EMPTY_STRING" | "OTHER"

//------------------------------------------------------------------------------
//
// Generated Lists for Diagnostics/Completions
//
//------------------------------------------------------------------------------

/*******************************************************************************
 *
 * Type of generated `lists.json`.
 *
 ******************************************************************************/

export type JSON_GeneratedLists = {
	classNames: string[]
	rootCustomProperties: string[]
	aliasableComponents: string[]
}

/*******************************************************************************
 *
 * Type of generated `astro_components.json`.
 *
 ******************************************************************************/

export type JSON_AstroComponent = {
	componentName: string
	slotList: SlotList[]
}
export type SlotList = {
	slotName: string
	componentNames: string[]
	required: true | undefined
}

/*******************************************************************************
 *
 * Map of Astro slot lists by component.
 *
 ******************************************************************************/

export type AstroComponentsMap = Map<__ComponentName__, SlotList[]>

//------------------------------------------------------------------------------
//
// CLI
//
//------------------------------------------------------------------------------

export type CLI_SubCommand = "help" | "init" | "compile" | "env" | "webc" | "appc" | "ce"

// compile flags
export type CLI_CompileFlags = {
	w?: true
	watch?: true
}

// env flags
export type CLI_EnvFlags = {
	i?: string
	input?: string
	o?: string
	output?: string
	m?: string
	modes?: string
}

// webc/ce flags
export type CLI_WebCFlags = {
	t?: string
	tag?: string
	o?: string
	output?: string
}

// appc flags
export type CLI_AppCFlags = {
	n?: string
	name?: string
	o?: string
	output?: string
}

export type CLI_Flags = CLI_CompileFlags | CLI_EnvFlags | CLI_WebCFlags

export interface I_OutputStyler {
	bgGreen: (msg: string) => string
	bgWhite: (msg: string) => string
	bgYellow: (msg: string) => string
	bgRed: (msg: string) => string
	black: (msg: string) => string
	green: (msg: string) => string
	cyan: (msg: string) => string
	red: (msg: string) => string
	yellow: (msg: string) => string
	bold: (msg: string) => string
	dim: (msg: string) => string
}

export type HelpDisplayPayload = {
	headline?: string
	usage?: string
	tables: {
		cmd: CLI_SubCommand
		description: string
		note?: string
		flags?: [flag: string, help: string][]
	}[]

	description?: string
}

export type ErrorDisplayPayload = {
	message: string
	description?: string | undefined
	sourceFiles?: string[] | undefined
	ranges?: Diagnostic["range"][] | undefined
}

export type SuccessDisplayPayload = {
	message?: string
	description?: string
	parsed?: number
	generated?: number
	duration?: number
	dir?: string
}

//------------------------------------------------------------------------------
//
// CI
//
//------------------------------------------------------------------------------

export type CI_Flag = "astro" | "astro-ssr"

export type CI_PackageJson = {
	version: string
	dependencies: {
		"@haq/utils": string
	}
}
