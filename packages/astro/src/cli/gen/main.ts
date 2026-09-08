//#region -------------------------------------------------- Type Imports

import type {
	Diagnostic,
	GeneratedNamespaceTypes,
	GeneratedNamespaceTypesWithGlobal,
	I_OutputStyler,
	JSON_Lists
} from "../_shared/types.js"
import type { ConfigSchema } from "../_shared/validation.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import fs from "node:fs"
import { GLOBALS } from "../../globals.js"
import { getAllAstroAndJSONFileNamesInDir, getAllCSSFileNamesInDir, writeLogFile } from "../_shared/fs.js"
import { HAQLogger } from "../_shared/logger.js"
import { formatAndWrite } from "../_shared/output.js"
import { addDisclaimerComment, injectTypesInGlobalNamespace } from "../_shared/strings.js"
import { getAstroTypes } from "./astro.js"
import { getAttributeTypes } from "./attributes.js"
import { makeCSSLists } from "./css-lists.js"
import { generateRoutesTypes } from "./routes-type-gen.js"

//#endregion ----------------------------------------------- Module Imports

//------------------------------------------------------------------------------
//
// Main
//
//------------------------------------------------------------------------------

type ARGS_main = ConfigSchema & {
	outputStyler: I_OutputStyler
}
export async function main({ projectDir, outDir, globalCssDir, astroDirs, outputStyler }: ARGS_main): Promise<number> {
	const Logger = new HAQLogger(outputStyler)
	Logger.showInfo({ message: "Generating types and contexts..." })

	const startPerformanceTime = performance.now()
	const result = await generate({
		projectDir,
		outDir,
		globalCssDir,
		astroDirs
	})

	let routeCount = 0
	for (const dir of astroDirs) {
		routeCount++
		generateRoutesTypes({ astroDir: dir, outDir, index: routeCount })
	}

	for (const diagnostic of result.markupDiagnostics) {
		Logger.showDiag(diagnostic)
	}

	writeLogFile(outDir)

	const generatedFiles = fs.readdirSync(outDir, { withFileTypes: true })
	const endPerformanceTime = performance.now()

	Logger.showSuccessSummary({
		parsed: result.filesParsed,
		generated: generatedFiles.length,
		duration: Math.round(endPerformanceTime - startPerformanceTime)
	})

	return result.markupDiagnostics.length
}

//------------------------------------------------------------------------------
//
// Generate
//
//------------------------------------------------------------------------------

type ARGS_generate = ConfigSchema & {
	lint?: true
}

type RT_generate = Promise<{
	filesParsed: number
	markupDiagnostics: Diagnostic[]
}>

async function generate({ projectDir, outDir, globalCssDir, astroDirs }: ARGS_generate): RT_generate {
	const allProjectFiles = getAllAstroAndJSONFileNamesInDir(projectDir)
	const cssFiles = getAllCSSFileNamesInDir(globalCssDir)

	const astroFileNames = allProjectFiles.filter((file) => file.match(GLOBALS.REGEX_ASTRO_EXTENSION))
	const jsonFiles = allProjectFiles.filter((file) => file.match(GLOBALS.REGEX_HAQ_JSON_EXTENSION))

	const astroTypes = await getAstroTypes({
		astroFileNames,
		outDir,
		astroDirs
	})
	const cssLists = makeCSSLists({ cssFiles })

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

	const generatedLists: JSON_Lists = {
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

	return {
		filesParsed: allProjectFiles.length + cssFiles.length,
		markupDiagnostics: astroTypes.markupDiagnostics
	}

	//* ---------- Helpers -----------------------------------------------

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
