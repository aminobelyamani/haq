//#region -------------------------------------------------- Type Imports

import type {
	Diagnostic,
	GeneratedNamespaceTypes,
	GeneratedNamespaceTypesWithGlobal,
	I_OutputStyler,
	JSON_GeneratedLists
} from "../_shared/types.js"
import type { ConfigSchema, JSON_CustomElement } from "../_shared/validation.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import fs from "node:fs"
import { GLOBALS } from "../../globals.js"
import { createAstroComponentsMap, createCssMarkupMap, createCustomElementsMap } from "../_shared/astro.js"
import {
	getAllAstroAndJSONFileNamesInDir,
	getAllCSSFileNamesInDir,
	isAstroFile,
	isHaqJsonFile,
	loadFile,
	writeLogFile
} from "../_shared/fs.js"
import { HAQLogger } from "../_shared/logger.js"
import { formatAndWrite } from "../_shared/output.js"
import { addDisclaimerComment, injectTypesInGlobalNamespace } from "../_shared/strings.js"
import { getAstroDiagnostics } from "./diag/astro-diagnostics.js"
import { getCssDiagnostics } from "./diag/css-diagnostics.js"
import { getMarkupDiagnostics } from "./diag/markup-diag.js"
import { getAstroTypes } from "./gen/astro.js"
import { getAttributeTypes } from "./gen/attributes.js"
import { getCSSLists } from "./gen/css-lists.js"
import { generateRoutesTypes } from "./gen/routes-type-gen.js"

//#endregion ----------------------------------------------- Module Imports

//------------------------------------------------------------------------------
//
// Main
//
//------------------------------------------------------------------------------

type ARGS_main = ConfigSchema & {
	nativeElementsJsonContent: JSON_CustomElement[]
	outputStyler: I_OutputStyler
}
export async function main({
	projectDir,
	outDir,
	globalCssDir,
	astroDirs,
	outputStyler,
	nativeElementsJsonContent
}: ARGS_main): Promise<number> {
	const Logger = new HAQLogger(outputStyler)
	Logger.showInfo({ message: "Compiling..." })

	const startPerformanceTime = performance.now()
	const result = await generate({
		projectDir,
		outDir,
		globalCssDir,
		astroDirs,
		nativeElementsJsonContent
	})

	let routeCount = 0
	for (const dir of astroDirs) {
		routeCount++
		generateRoutesTypes({ astroDir: dir, outDir, index: routeCount })
	}

	for (const diagnostic of result.diagnostics) {
		Logger.showDiag(diagnostic)
	}

	writeLogFile(outDir)

	const generatedFiles = fs.readdirSync(outDir)
	const endPerformanceTime = performance.now()

	Logger.showSuccessSummary({
		parsed: result.filesParsed,
		generated: generatedFiles.length,
		duration: Math.round(endPerformanceTime - startPerformanceTime)
	})

	return result.diagnostics.length
}

//------------------------------------------------------------------------------
//
// Generate
//
//------------------------------------------------------------------------------

type ARGS_generate = ConfigSchema & {
	nativeElementsJsonContent: JSON_CustomElement[]
}

type RT_generate = Promise<{
	filesParsed: number
	diagnostics: Diagnostic[]
}>

async function generate({
	projectDir,
	outDir,
	globalCssDir,
	astroDirs,
	nativeElementsJsonContent
}: ARGS_generate): RT_generate {
	const allAstroAndJSONFiles = getAllAstroAndJSONFileNamesInDir(projectDir)
	const allCSSFiles = getAllCSSFileNamesInDir(projectDir)

	const astroFileNames = allAstroAndJSONFiles.filter((filePath) => isAstroFile(filePath))
	const jsonFiles = allAstroAndJSONFiles.filter((filePath) => isHaqJsonFile(filePath))
	const globalCssFiles = allCSSFiles.filter((filePath) => filePath.includes(globalCssDir))

	const astroTypes = await getAstroTypes({
		astroFileNames,
		outDir,
		astroDirs
	})
	const cssLists = getCSSLists({ cssFiles: globalCssFiles })

	const generatedAttributeTypes = getAttributeTypes({
		jsonFiles,
		projectDir,
		rootCustomProperties: cssLists.rootCustomProperties.filter((prop) =>
			prop.startsWith(GLOBALS.CSS_DYNAMIC_VARIABLE_PREFIX)
		)
	})
	const astroAttributeTypes =
		addDisclaimerComment() + injectTypesInGlobalNamespace(generatedAttributeTypes.generatedTypes)

	const customElementTypes =
		addDisclaimerComment() + injectTypesInGlobalNamespace(generatedAttributeTypes.cssPropertyTypes)

	const generatedLists: JSON_GeneratedLists = {
		classNames: cssLists.classNames,
		rootCustomProperties: cssLists.rootCustomProperties,
		aliasableComponents: astroTypes.aliasableComponents
	}

	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir)
	}

	_handleWebComponents(astroTypes.generatedWebComponentTagMapTypes)
	_handleAppComponents(astroTypes.generatedAppComponentMapTypes)

	astroTypes.generatedTypes.push(_handlePartialMarkup(astroTypes.generatedPartialMarkupTypes))
	astroTypes.generatedTypes.push(_handleAppComponentsRouterTypes(astroTypes.generatedAppComponentsRouterTypes))

	const fullAstroTypes = addDisclaimerComment() + _addMarkupTypeHelpers() + astroTypes.generatedTypes.join("")

	// markup.ts
	formatAndWrite({
		outDir,
		filePath: `${outDir}/${GLOBALS.GEN_MARKUP_FILE_NAME}`,
		content: fullAstroTypes
	})

	// custom-elements.ts
	formatAndWrite({
		outDir,
		filePath: `${outDir}/${GLOBALS.GEN_CUSTOM_ELEMENTS_FILE_NAME}`,
		content: customElementTypes
	})

	// attributes.ts
	formatAndWrite({
		outDir,
		filePath: `${outDir}/${GLOBALS.GEN_ATTRIBUTES_FILE_NAME}`,
		content: astroAttributeTypes
	})

	// lists.json
	formatAndWrite({
		outDir,
		filePath: `${outDir}/${GLOBALS.GEN_LISTS_JSON_FILE_NAME}`,
		content: JSON.stringify(generatedLists)
	})

	// custom_elements.json
	formatAndWrite({
		outDir,
		filePath: `${outDir}/${GLOBALS.GEN_CUSTOM_ELEMENTS_JSON_FILE_NAME}`,
		content: JSON.stringify(generatedAttributeTypes.json)
	})

	// astro_components.json
	formatAndWrite({
		outDir,
		filePath: `${outDir}/${GLOBALS.GEN_ASTRO_COMPONENTS_JSON_FILE_NAME}`,
		content: JSON.stringify(astroTypes.astroComponents)
	})

	// css.json
	formatAndWrite({
		outDir,
		filePath: `${outDir}/${GLOBALS.GEN_CSS_JSON_FILE_NAME}`,
		content: JSON.stringify(astroTypes.flatMarkupArray)
	})

	const astroComponentsMap = createAstroComponentsMap(astroTypes.astroComponents)
	const customElementsMap = createCustomElementsMap(generatedAttributeTypes.json, nativeElementsJsonContent)

	const markupDiagnostics = getMarkupDiagnostics({
		astroASTMap: astroTypes.astroASTMap,
		astroComponentsMap,
		generatedComponentMap: astroTypes.generatedComponentMap,
		astroFileNames,
		sortedComponentNames: astroTypes.sortedComponentNames
	})

	const fileSpecificDiagnostics = (await _runAstroDiagonstics()).concat(_runCSSDiagnostics())

	return {
		filesParsed: allAstroAndJSONFiles.length + allCSSFiles.length,
		diagnostics: markupDiagnostics.concat(fileSpecificDiagnostics)
	}

	//* ---------- Helpers -----------------------------------------------

	async function _runAstroDiagonstics(): Promise<Diagnostic[]> {
		const fileDiagnostics: Diagnostic[] = []
		for (const astroFileName of astroFileNames) {
			fileDiagnostics.push(
				...(await getAstroDiagnostics({
					documentText: astroTypes.fileDocumentMap.get(astroFileName) ?? "",
					filePath: astroFileName,
					astroASTMap: astroTypes.astroASTMap,
					generatedLists,
					customElementsMap,
					astroComponentsMap
				}))
			)
		}
		return fileDiagnostics
	}

	function _runCSSDiagnostics(): Diagnostic[] {
		const fileDiagnostics: Diagnostic[] = []

		for (const cssFileName of allCSSFiles) {
			const file = loadFile(cssFileName)
			if (!file || file.toString().length === 0) continue

			fileDiagnostics.push(
				...getCssDiagnostics({
					documentText: file.toString(),
					filePath: cssFileName,
					globalCssPath: globalCssDir,
					customElementsMap,
					cssMarkupMap: createCssMarkupMap(astroTypes.flatMarkupArray),
					rootCustomProperties: generatedLists.rootCustomProperties
				})
			)
		}
		return fileDiagnostics
	}

	function _handleWebComponents(generatedWebComponentTagMapTypes: GeneratedNamespaceTypesWithGlobal): void {
		let count = 1
		for (const key of Object.keys(generatedWebComponentTagMapTypes)) {
			if (!generatedWebComponentTagMapTypes[key]) continue
			const suffix = key === "global" ? "global" : `${count++}`
			const webcTypes = addDisclaimerComment() + injectTypesInGlobalNamespace(generatedWebComponentTagMapTypes[key])

			formatAndWrite({
				outDir,
				filePath: `${outDir}/${GLOBALS.GEN_WEB_C_FILE_NAME_PREFIX}${suffix}.ts`,
				content: webcTypes
			})
		}
	}

	function _handleAppComponents(generatedAppComponentMapTypes: GeneratedNamespaceTypesWithGlobal): void {
		let count = 1
		for (const key of Object.keys(generatedAppComponentMapTypes)) {
			if (!generatedAppComponentMapTypes[key]) continue
			const suffix = key === "global" ? "global" : `${count++}`
			const webcTypes = addDisclaimerComment() + injectTypesInGlobalNamespace(generatedAppComponentMapTypes[key])

			formatAndWrite({
				outDir,
				filePath: `${outDir}/${GLOBALS.GEN_APP_C_FILE_NAME_PREFIX}${suffix}.ts`,
				content: webcTypes
			})
		}
	}

	function _handlePartialMarkup(generatedPartialMarkupTypes: GeneratedNamespaceTypes): string {
		let count = 1
		let types = ""
		for (const key of Object.keys(generatedPartialMarkupTypes)) {
			if (!generatedPartialMarkupTypes[key]) continue
			types += _injectPartialTypesInScaffold(generatedPartialMarkupTypes[key], count++)
		}
		return types
	}

	function _handleAppComponentsRouterTypes(generatedAppCoponentsRouterTypes: GeneratedNamespaceTypes): string {
		let count = 1
		let types = ""
		for (const key of Object.keys(generatedAppCoponentsRouterTypes)) {
			if (!generatedAppCoponentsRouterTypes[key]) continue
			types += _injectAppComponentsRouterTypesInScaffold(generatedAppCoponentsRouterTypes[key], count++)
		}
		return types
	}

	function _injectPartialTypesInScaffold(type: string, index: number): string {
		return `\nexport type HAQ_PartialMarkup_${index} = {\n${type}\n}\n`
	}

	function _injectAppComponentsRouterTypesInScaffold(type: string, index: number): string {
		return `\nexport type HAQ_AppComponents_${index} = {\n${type}\n}\n`
	}

	function _addMarkupTypeHelpers(): string {
		return `
            //@ts-nocheck\n
            import type {
                HAQ_AppComponentByName,
                HAQ_AttributesByTag,
                HAQ_CustomEventsByTag,
                HAQ_DOMElement,
                HAQ_HTMLFormElement,
                HAQ_HTMLTagTypes,
                HAQ_MarkupAlias,
                HAQ_MatchingSelectorsByTag,
                HAQ_StylePropertiesByTag
            } from "@haq/astro/types"\n\n`
	}
}
