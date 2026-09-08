//#region -------------------------------------------------- Type Imports

import type { HAQ_Diagnostic, HAQ_GeneratedLists } from "@haq/astro/types"
import type { Diagnostic, DiagnosticCollection, TextDocument } from "vscode"
import type { RT_makeLists } from "./lists.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { GLOBALS, getAstroDiagnostics, getCSSDiagnostics } from "@haq/astro/tools"
import { DiagnosticSeverity, Position, Range, window } from "vscode"
import { isAstroFile, isCSSFile } from "./utils.js"

//#endregion ----------------------------------------------- Module Imports

type GetDiagArgs = {
	document: string
	sourceFile: string
}
export type RT_makeDiagnostics = Readonly<{
	getAstroDiag: ({ document, sourceFile }: GetDiagArgs) => Promise<Diagnostic[]>
	getCSSDiagnosticsFromHAQ: ({ document, sourceFile }: GetDiagArgs) => Diagnostic[]
	update: (document: TextDocument, collection: DiagnosticCollection) => Promise<void>
}>

export function makeDiagnostics(makeLists: RT_makeLists): RT_makeDiagnostics {
	return Object.freeze({
		getAstroDiag,
		getCSSDiagnosticsFromHAQ,
		update
	})

	async function getAstroDiag({ document, sourceFile }: GetDiagArgs): Promise<Diagnostic[]> {
		const vsCodeDiagnostics: Diagnostic[] = []

		const lists: HAQ_GeneratedLists = {
			classNames: makeLists.getClassNames(),
			rootCustomProperties: makeLists.getRootCustomProperties(),
			aliasableComponents: makeLists.getAliasableComponents()
		}

		const astroDiagnostics = await getAstroDiagnostics({
			document,
			filePath: sourceFile,
			lists,
			customElementsMap: makeLists.getCustomElementsMap(),
			astroComponentsMap: makeLists.getAstroComponentsMap()
		})

		_addDiagnostics(astroDiagnostics, vsCodeDiagnostics)

		return vsCodeDiagnostics
	}

	function getCSSDiagnosticsFromHAQ({ document, sourceFile }: GetDiagArgs): Diagnostic[] {
		const { cssDir } = makeLists.getProjectConfig()

		const vsCodeDiagnostics: Diagnostic[] = []

		const HAQ_CSSDiagnostics = getCSSDiagnostics({
			document,
			filePath: sourceFile,
			globalCssPath: cssDir,
			customElementsMap: makeLists.getCustomElementsMap(),
			rootCustomProperties: makeLists.getRootCustomProperties(),
			cssMarkupMap: makeLists.getCssMarkupMap()
		})

		_addDiagnostics(HAQ_CSSDiagnostics, vsCodeDiagnostics)

		return vsCodeDiagnostics
	}

	async function update(document: TextDocument, collection: DiagnosticCollection): Promise<void> {
		try {
			let diagnostics: Diagnostic[] = []
			if (isAstroFile(document)) {
				const astroDiagnostics = await getAstroDiag({
					document: document.getText(),
					sourceFile: document.uri.fsPath
				})
				diagnostics = [...diagnostics, ...astroDiagnostics]
				collection.set(document.uri, diagnostics)
				return
			}
			if (isCSSFile(document)) {
				const cssDiagnostics = getCSSDiagnosticsFromHAQ({
					document: document.getText(),
					sourceFile: document.uri.fsPath
				})
				diagnostics = [...diagnostics, ...cssDiagnostics]
				collection.set(document.uri, diagnostics)
			}
		} catch (err) {
			console.trace(err)
			window.showErrorMessage(`Encountered an error while checking diagnostics for file: ${document.uri.path}`)
		}
	}

	function _addDiagnostics(diagnostics: HAQ_Diagnostic[], vsCodeDiagnostics: Diagnostic[]): void {
		for (const diagnostic of diagnostics) {
			vsCodeDiagnostics.push({
				code: "",
				message: diagnostic.message,
				range: _adaptRangeToVSCode(diagnostic.range),
				severity: DiagnosticSeverity.Error,
				source: GLOBALS.VS_CODE_EXTENSION_NAME
			})
		}
	}

	type DiagnosticRange = HAQ_Diagnostic["range"]

	function _adaptRangeToVSCode(range: DiagnosticRange): Range {
		const rangeStart = new Position(
			range.start.line - 1, // vscode using 0 based indexing
			range.start.column - 1 // vscode using 0 based indexing
		)

		const rangeEnd = new Position(
			range.end.line - 1, // vscode using 0 based indexing
			range.end.column - 1 // vscode using 0 based indexing
		)
		return new Range(rangeStart, rangeEnd)
	}
}
