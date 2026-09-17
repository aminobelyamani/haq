//#region -------------------------------------------------- Type Imports

import type { TypedOmit } from "@haq/utils/types"
import type { CompletionItem } from "vscode-languageserver"
import type { Diagnostic as LSPDiagnostic, Range } from "vscode-languageserver/node"
import type {
	AstroComponentsMap,
	CompletionColRange,
	CSSMarkupMap,
	CursorPos,
	Diagnostic,
	JSON_AstroComponent,
	JSON_CSSMarkup,
	JSON_GeneratedLists
} from "../../cli/_shared/types.js"
import type { ConfigSchema, CustomElementsMap, JSON_CustomElement } from "../../cli/_shared/validation.js"
import type { MarkupDirective } from "../../globals.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { watch } from "node:fs"
import path from "node:path"
import { assertUnreachable } from "@haq/utils"
import { CompletionItemKind, InsertTextFormat } from "vscode-languageserver"
import { DiagnosticSeverity } from "vscode-languageserver/node"
import { createAstroComponentsMap, createCssMarkupMap, createCustomElementsMap } from "../../cli/_shared/astro.js"
import { isAstroFile, isCssFile, loadJsonFile, loadNativeElementsJson } from "../../cli/_shared/fs.js"
import { getAstroDiagnostics } from "../../cli/compile/diag/astro-diagnostics.js"
import { getCssDiagnostics } from "../../cli/compile/diag/css-diagnostics.js"
import { GLOBALS } from "../../globals.js"
import { getAstroCompletions } from "./astro-completions.js"
import { getCssCompletions } from "./css-completions.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_makeLspTools = {
	currentDir: string
	successCallback: () => void
}
export function makeLspTools({ currentDir, successCallback }: ARGS_makeLspTools): I_LSPTools {
	const PROJECT_DATA = _getProjectData()
	const LOG_FILE_PATH = `${PROJECT_DATA.outDir}/${GLOBALS.GENERATED_TYPES_FOLDER}/${GLOBALS.LOG_FILE_NAME}`

	let generatedLists: JSON_GeneratedLists = {
		classNames: [],
		aliasableComponents: [],
		rootCustomProperties: []
	}
	let CUSTOM_ELEMENTS_MAP: CustomElementsMap = new Map()
	let ASTRO_COMPONENTS_MAP: AstroComponentsMap = new Map()
	let CSS_MARKUP_MAP: CSSMarkupMap = new Map()

	let initialized = false

	_init()

	return Object.freeze({
		getFileDiagnostics,
		getCompletions
	})

	//* ---------- Exposed Methods -----------------------------------------------

	async function getFileDiagnostics({ documentText, filePath }: ARGS_getFileDiagnostics): Promise<LSPDiagnostic[]> {
		if (!(isAstroFile(filePath) || isCssFile(filePath))) return []

		const targetLang = isAstroFile(filePath) ? "astro" : "css"
		const diagnostics =
			targetLang === "astro"
				? await getAstroDiagnostics({
						documentText,
						filePath,
						astroASTMap: new Map(),
						generatedLists,
						customElementsMap: CUSTOM_ELEMENTS_MAP,
						astroComponentsMap: ASTRO_COMPONENTS_MAP
					})
				: getCssDiagnostics({
						documentText,
						filePath,
						globalCssPath: PROJECT_DATA.globalCssDir,
						customElementsMap: CUSTOM_ELEMENTS_MAP,
						rootCustomProperties: generatedLists.rootCustomProperties,
						cssMarkupMap: CSS_MARKUP_MAP
					})
		return _convertToLSPDiagnostics(diagnostics)
	}

	function _convertToLSPDiagnostics(diagnostics: Diagnostic[]): LSPDiagnostic[] {
		return diagnostics.map((d) => {
			const lspDiag: LSPDiagnostic = {
				message: d.message,
				range: _to0BasedIndexRange(d.range),
				severity: DiagnosticSeverity.Error,
				source: GLOBALS.VS_CODE_EXTENSION_NAME
			}
			return lspDiag
		})
	}

	function _to0BasedIndexRange(range: Diagnostic["range"]): Range {
		return {
			start: {
				line: range.start.line - 1,
				character: range.start.column - 1
			},
			end: {
				line: range.end.line - 1,
				character: range.end.column - 1
			}
		}
	}

	async function getCompletions({ documentText, filePath, cursorPos }: ARGS_getCompletions): Promise<CompletionItem[]> {
		if (!(isAstroFile(filePath) || isCssFile(filePath))) return []

		const targetLang = isAstroFile(filePath) ? "astro" : "css"
		if (targetLang === "astro") {
			const result = await getAstroCompletions({
				documentText,
				cursorPos,
				astroComponentsMap: ASTRO_COMPONENTS_MAP,
				classNames: generatedLists.classNames,
				aliasableComponents: generatedLists.aliasableComponents
			})
			return _provideAstroCompletions(result, cursorPos)
		}

		// css
		const cssMarkupRecord = CSS_MARKUP_MAP.get(filePath)

		const result = getCssCompletions({
			documentText,
			cursorPos,
			cssMarkup: cssMarkupRecord?.flatMarkup,
			customElementsMap: CUSTOM_ELEMENTS_MAP
		})

		return _provideCssCompletions(documentText, result, cursorPos)
	}

	//* ---------- Initialize -----------------------------------------------

	function _init(): void {
		if (initialized === true) return

		watch(LOG_FILE_PATH, (eventType, fileName) => {
			if (!fileName) return
			if (eventType !== "change") return
			_updateLists()
		})

		_updateLists()

		initialized = true

		successCallback()
	}

	//* ---------- Update after generation/compilation -----------------------------------------------

	function _updateLists(): void {
		const { astroComponentsMap, cssMarkupMap, customElementsMap, listContent } = _getGeneratedData()

		generatedLists = listContent
		CUSTOM_ELEMENTS_MAP = customElementsMap
		ASTRO_COMPONENTS_MAP = astroComponentsMap
		CSS_MARKUP_MAP = cssMarkupMap
	}

	//* ---------- Astro Completions -----------------------------------------------

	function _provideAstroCompletions(
		result: Awaited<ReturnType<typeof getAstroCompletions>>,
		cursorPos: CursorPos
	): CompletionItem[] {
		switch (result.context) {
			case "CLASS_LIST":
			case "CLASS":
			case "X_SLOT":
				return _provideValueCompletions(result.completions)

			case "SLOT":
				return _provideSlotNameCompletions(result.completions, cursorPos, result.stringColRange)

			case "NONE":
				return []
			default:
				assertUnreachable(result.context)
				return []
		}
	}

	function _provideValueCompletions(completions: string[]): CompletionItem[] {
		const completionItems = completions.map((completion) => {
			const item: CompletionItem = {
				label: completion,
				kind: CompletionItemKind.Value,
				sortText: " "
			}

			return item
		})

		return completionItems
	}

	function _provideSlotNameCompletions(
		completions: string[],
		cursorPos: CursorPos,
		stringColRange: CompletionColRange
	): CompletionItem[] {
		const completionItems = completions.map((completion) => {
			const range: Range = {
				start: {
					line: cursorPos.line - 1, // back to 0 indexed range
					character: stringColRange.start
				},
				end: {
					line: cursorPos.line - 1, // back to 0 indexed range
					character: stringColRange.end
				}
			}

			const item: CompletionItem = {
				label: completion,
				kind: CompletionItemKind.Value,
				sortText: " ",
				textEdit: {
					newText: completion,
					insert: range,
					replace: range
				}
			}

			return item
		})

		return completionItems
	}

	//* ---------- CSS Completions -----------------------------------------------

	function _provideCssCompletions(
		documentText: string,
		result: ReturnType<typeof getCssCompletions>,
		cursorPos: CursorPos
	): CompletionItem[] {
		switch (result.context) {
			case "EMPTY_RULE":
				return _provideEmptyRuleCompletion(result.completions)

			case "TYPE_SELECTOR":
				return _provideTypeSelectorCompletions(documentText, result.completions, cursorPos)

			case "EMPTY_ATTRIBUTE":
				return _provideAttributeCompletions(result.completions)

			case "ATTRIBUTE_VALUE":
				return _provideAttributeValueCompletion(result.completions)

			case "NONE":
				return []

			default:
				assertUnreachable(result.context)
				return []
		}
	}

	function _provideEmptyRuleCompletion(completions: string[]): CompletionItem[] {
		return completions.map((completion) => {
			const item: CompletionItem = {
				label: completion,
				kind: CompletionItemKind.Snippet,
				insertText: `${completion} $0 {}`,
				sortText: "  ",
				insertTextFormat: InsertTextFormat.Snippet
			}

			return item
		})
	}

	function _provideTypeSelectorCompletions(
		documentText: string,
		completions: string[],
		cursorPos: CursorPos
	): CompletionItem[] {
		const charAfterCursor = documentText.at(cursorPos.offset) ?? ""

		const matchesSpecialChar = charAfterCursor.match(GLOBALS.REGEX_CSS_SPECIAL_CHARS)
		const textRightOfCursor = documentText.slice(cursorPos.offset)

		const nextSpecialCharIndex = textRightOfCursor.search(GLOBALS.REGEX_CSS_SPECIAL_CHARS)

		const endCharacter = nextSpecialCharIndex === -1 ? cursorPos.col - 1 : cursorPos.col - 1 + nextSpecialCharIndex

		const replaceRange: Range = {
			start: {
				line: cursorPos.line - 1,
				character: cursorPos.col - 1
			},
			end: {
				line: cursorPos.line - 1,
				character: endCharacter
			}
		}

		const insertRange: Range = {
			start: {
				line: cursorPos.line - 1,
				character: cursorPos.col - 1
			},
			end: {
				line: cursorPos.line - 1,
				character: cursorPos.col - 1
			}
		}

		return completions.map((completion) => {
			const item: CompletionItem = {
				label: completion,
				insertText: completion,
				kind: CompletionItemKind.Snippet,
				sortText: "  ",
				textEdit: {
					newText: completion,
					insert: matchesSpecialChar ? insertRange : replaceRange,
					replace: replaceRange
				}
			}

			return item
		})
	}

	function _provideAttributeCompletions(completions: string[]): CompletionItem[] {
		const selDirective: MarkupDirective = "x_sel"
		const dynSelDirective: MarkupDirective = "x_dyn_sel"

		const sortText = (str: string): string => {
			if (str.startsWith(selDirective)) return "01"
			if (str.startsWith(dynSelDirective)) return "02"
			if (str.startsWith(GLOBALS.HAQ_DATA_ATTRIBUTE_PREFIX)) return "03"
			return "04"
		}
		return completions.map((completion) => {
			const item: CompletionItem = {
				label: completion,
				kind: CompletionItemKind.Snippet,
				insertText: completion,
				sortText: sortText(completion)
			}
			return item
		})
	}

	function _provideAttributeValueCompletion(completions: string[]): CompletionItem[] {
		return completions.map((completion) => {
			const item: CompletionItem = {
				label: completion,
				kind: CompletionItemKind.Snippet,
				insertText: completion,
				sortText: " "
			}
			return item
		})
	}

	//* ---------- Project Data -----------------------------------------------

	type RT__getProjectData = {
		projectDir: string
		outDir: string
		globalCssDir: string
		nativeElementsContent: JSON_CustomElement[]
	}

	function _getProjectData(): RT__getProjectData {
		const { outDir, projectDir, globalCssDir } = _loadConfig()

		const genOutputDir = `${outDir}/${GLOBALS.GENERATED_TYPES_FOLDER}`

		return {
			projectDir,
			outDir,
			globalCssDir,
			nativeElementsContent: loadNativeElementsJson(genOutputDir)
		}
	}

	function _loadConfig(): TypedOmit<RT__getProjectData, "nativeElementsContent"> {
		const configContent = loadJsonFile(`${currentDir}/${GLOBALS.HAQ_CONFIG_JSON_FILE_NAME}`) as ConfigSchema

		return {
			projectDir: path.join(currentDir, configContent.projectDir),
			outDir: path.join(currentDir, configContent.outDir),
			globalCssDir: path.join(currentDir, configContent.globalCssDir)
		}
	}

	type RT__getGeneratedData = {
		customElementsMap: CustomElementsMap
		astroComponentsMap: AstroComponentsMap
		cssMarkupMap: CSSMarkupMap
		listContent: JSON_GeneratedLists
	}

	function _getGeneratedData(): RT__getGeneratedData {
		const { customElementsContent, astroComponentsContent, listContent, cssMarkupJsonContent } =
			_loadGeneratedJsonContent()

		return {
			customElementsMap: createCustomElementsMap(customElementsContent, PROJECT_DATA.nativeElementsContent),
			astroComponentsMap: createAstroComponentsMap(astroComponentsContent),
			cssMarkupMap: createCssMarkupMap(cssMarkupJsonContent),
			listContent
		}
	}

	type RT__loadJSONContent = {
		listContent: JSON_GeneratedLists
		astroComponentsContent: JSON_AstroComponent[]
		customElementsContent: JSON_CustomElement[]
		cssMarkupJsonContent: JSON_CSSMarkup[]
	}
	function _loadGeneratedJsonContent(): RT__loadJSONContent {
		const genOutputDir = `${PROJECT_DATA.outDir}/${GLOBALS.GENERATED_TYPES_FOLDER}`

		return {
			listContent: loadJsonFile(`${genOutputDir}/${GLOBALS.GEN_LISTS_JSON_FILE_NAME}`) as JSON_GeneratedLists,
			astroComponentsContent: loadJsonFile(
				`${genOutputDir}/${GLOBALS.GEN_ASTRO_COMPONENTS_JSON_FILE_NAME}`
			) as JSON_AstroComponent[],
			customElementsContent: loadJsonFile(
				`${genOutputDir}/${GLOBALS.GEN_CUSTOM_ELEMENTS_JSON_FILE_NAME}`
			) as JSON_CustomElement[],

			cssMarkupJsonContent: loadJsonFile(`${genOutputDir}/${GLOBALS.GEN_CSS_JSON_FILE_NAME}`) as JSON_CSSMarkup[]
		}
	}
}

type ARGS_getFileDiagnostics = {
	documentText: string
	filePath: string
}

type ARGS_getCompletions = ARGS_getFileDiagnostics & {
	cursorPos: CursorPos
}

export interface I_LSPTools {
	readonly getFileDiagnostics: (args: ARGS_getFileDiagnostics) => Promise<LSPDiagnostic[]>

	readonly getCompletions: (args: ARGS_getCompletions) => Promise<CompletionItem[]>
}
