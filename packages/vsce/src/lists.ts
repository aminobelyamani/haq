//#region -------------------------------------------------- Type Imports

import type { HAQ_AstroComponentsMap, HAQ_CSSMarkupMap, HAQ_CustomElementsMap } from "@haq/astro/types"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { watch } from "node:fs"
import { GLOBALS, getGeneratedData, getProjectData } from "@haq/astro/tools"
import { window, workspace } from "vscode"

//#endregion ----------------------------------------------- Module Imports

type ARGS_makeLists = {
	LOG_FILE_PATH: string
}

type GetProjectConfigReturn = {
	globalCssDir: string
}

type ProjectData = ReturnType<typeof getProjectData>

export type RT_makeLists = Readonly<{
	init: () => void
	getProjectConfig: () => GetProjectConfigReturn
	getClassNames: () => string[]
	getRootCustomProperties: () => string[]
	getAliasableComponents: () => string[]
	getCustomElementsMap: () => HAQ_CustomElementsMap
	getAstroComponentsMap: () => HAQ_AstroComponentsMap
	getCssMarkupMap: () => HAQ_CSSMarkupMap
}>

export function makeLists({ LOG_FILE_PATH }: ARGS_makeLists): RT_makeLists {
	const CURRENT_DIR = workspace.workspaceFolders?.at(0)?.uri.fsPath
	const PROJECT_DATA: ProjectData | null = CURRENT_DIR ? getProjectData(CURRENT_DIR) : null
	const GLOBAL_CSS_DIR = PROJECT_DATA?.globalCssDir ?? ""

	let CLASS_NAMES: string[] = []
	let ROOT_CUSTOM_PROPERTIES: string[] = []
	let ALIASABLE_COMPONENTS: string[] = []
	let CUSTOM_ELEMENTS_MAP: HAQ_CustomElementsMap = new Map()
	let ASTRO_COMPONENTS_MAP: HAQ_AstroComponentsMap = new Map()
	let CSS_MARKUP_MAP: HAQ_CSSMarkupMap = new Map()

	let initialized = false

	return Object.freeze({
		init,
		getProjectConfig,
		getClassNames,
		getRootCustomProperties,
		getAliasableComponents,
		getCustomElementsMap,
		getAstroComponentsMap,
		getCssMarkupMap
	})

	//* ---------- Exposed Methods -----------------------------------------------

	function getProjectConfig(): GetProjectConfigReturn {
		return {
			globalCssDir: GLOBAL_CSS_DIR
		}
	}

	function getClassNames(): string[] {
		return CLASS_NAMES
	}

	function getRootCustomProperties(): string[] {
		return ROOT_CUSTOM_PROPERTIES
	}

	function getAliasableComponents(): string[] {
		return ALIASABLE_COMPONENTS
	}

	function getCustomElementsMap(): HAQ_CustomElementsMap {
		return CUSTOM_ELEMENTS_MAP
	}

	function getAstroComponentsMap(): HAQ_AstroComponentsMap {
		return ASTRO_COMPONENTS_MAP
	}

	function getCssMarkupMap(): HAQ_CSSMarkupMap {
		return CSS_MARKUP_MAP
	}

	//* ---------- Initialize -----------------------------------------------

	function init(): void {
		if (initialized === true) return

		watch(LOG_FILE_PATH, (eventType, fileName) => {
			if (!fileName) return
			if (eventType !== "change") return
			_updateLists()
		})

		_updateLists()

		_showSuccess()

		initialized = true
	}

	//* ---------- Helpers -----------------------------------------------

	function _updateLists(): void {
		if (!PROJECT_DATA) return

		const { astroComponentsMap, cssMarkupMap, customElementsMap, listContent } = getGeneratedData(PROJECT_DATA)

		CLASS_NAMES = listContent.classNames
		ROOT_CUSTOM_PROPERTIES = listContent.rootCustomProperties
		ALIASABLE_COMPONENTS = listContent.aliasableComponents
		CUSTOM_ELEMENTS_MAP = customElementsMap
		ASTRO_COMPONENTS_MAP = astroComponentsMap
		CSS_MARKUP_MAP = cssMarkupMap
	}

	function _showSuccess(): void {
		window.showInformationMessage(`Activated ${GLOBALS.VS_CODE_EXTENSION_NAME} succesfully.`)
	}
}
