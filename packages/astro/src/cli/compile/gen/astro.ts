//#region -------------------------------------------------- Type Imports

import type { ComponentNode, Node, TagLikeNode } from "@astrojs/compiler/types"
import type { TypedOmit } from "@haq/utils/types"
import type {
	__ComponentName__,
	__TypeName__,
	AstroASTMap,
	CSSMarkupObject,
	FileDocumentMap,
	GeneratedComponentMap,
	GeneratedCSSMarkupObject,
	GeneratedNamespaceTypes,
	GeneratedNamespaceTypesWithGlobal,
	I_AstroAttributeNode,
	JSON_AstroComponent,
	JSON_CSSMarkup,
	JSON_GeneratedLists,
	SelectorKind
} from "../../_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import path from "node:path"
import { is } from "@astrojs/compiler/utils"
import { entriesFromObject } from "@haq/utils"
import { GLOBALS } from "../../../globals.js"
import {
	addUniqueSelectorOrThrow,
	canIgnoreUniqueSelector,
	getAttributeByName,
	getIDAttributeValue,
	getPartialRouteFromFilePath,
	getPositionRange,
	getSlotDirectiveValues,
	getXSelectorValue,
	hasChildren,
	hasWebComponentDirective,
	isAliasedAppComponentNode,
	isAliasNode,
	isAppComponent,
	isConditionalExpression,
	isCustomTagNode,
	isDirectiveNode,
	isSlotNode,
	isWebComponentNode,
	parseAstroFile
} from "../../_shared/astro.js"
import { HAQError } from "../../_shared/errors.js"
import { getFileNameWithoutExtension, getRelativeFilePath, getRouteFromAstroPage } from "../../_shared/fs.js"
import {
	containsUppercase,
	generateArrayFromSpaceSeparatedList,
	generateUnionFromArray,
	generateUnionTypeFromSpaceSeparatedList,
	generateUnionTypeFromStringifiedArray,
	getArrayFromStringifiedArray,
	kebab2Pascal,
	removeEmptyLines
} from "../../_shared/strings.js"
import { addUniqueSetValueOrThrow } from "../../_shared/validation.js"

//#endregion ----------------------------------------------- Module Imports

//#region -------------------------------------------------- Types

type ProcessedNodeObj = {
	typeName: string
	typeAsString: string
	tagName: string | undefined
	selKind: SelectorKind | undefined
	selTypeLiteral: string | undefined
	selValue: string | undefined
	formNode: TagLikeNode | undefined
}

type ChildMapRecord = {
	childrenTypeNameSet: Set<string>
	typeAsString: string[]
}
type ChildMap = Map<__TypeName__, ChildMapRecord>

type ProcessedMarkupObject = CSSMarkupObject & { reference: string | undefined }

type FormPayload = {
	filePath: string
	formNode: TagLikeNode
}
type FormASTMap = Map<__ComponentName__, FormPayload>

type AttrValuesPayload = { filePath: string; tagLikeNode: TagLikeNode; attributesToTrack: string[] }

type AttrValuesASTMap = Map<__ComponentName__, AttrValuesPayload>

//#endregion ----------------------------------------------- Types

type ARGS_getAstroTypes = {
	astroFileNames: string[]
	outDir: string
	astroDirs: string[]
}

type RT_getAstroTypes = Promise<{
	generatedTypes: string[]
	generatedWebComponentTagMapTypes: GeneratedNamespaceTypesWithGlobal
	generatedAppComponentMapTypes: GeneratedNamespaceTypesWithGlobal
	generatedPartialMarkupTypes: GeneratedNamespaceTypes
	aliasableComponents: JSON_GeneratedLists["aliasableComponents"]
	astroComponents: JSON_AstroComponent[]
	flatMarkupArray: JSON_CSSMarkup[]
	generatedAppComponentsRouterTypes: GeneratedNamespaceTypes
	fileDocumentMap: FileDocumentMap
	astroASTMap: AstroASTMap
	sortedComponentNames: string[]
	generatedComponentMap: GeneratedComponentMap
}>
export async function getAstroTypes({ astroFileNames, outDir, astroDirs }: ARGS_getAstroTypes): RT_getAstroTypes {
	const generatedTypes: string[] = []
	const generatedWebComponentTagMapTypes: GeneratedNamespaceTypesWithGlobal = _initWebComponentTypes()
	const generatedAppComponentMapTypes: GeneratedNamespaceTypesWithGlobal = _iniAppComponentTypes()
	const generatedPartialMarkupTypes: GeneratedNamespaceTypes = _initPartialMarkupTypes()
	const generatedAppComponentsRouterTypes: GeneratedNamespaceTypes = _initAppComponentsRouterTypes()

	const astroComponentNames: Set<string> = new Set()
	const idSelectorList: Set<string> = new Set()
	const componentMap: GeneratedComponentMap = new Map()
	const astroComponents: JSON_AstroComponent[] = []
	const slotNames: Set<string> = new Set()
	const flatMarkupMap: FlatMarkupMap = new Map()
	const flatMarkupArray: JSON_CSSMarkup[] = []

	const fileDocumentMap: FileDocumentMap = new Map()
	const astroASTMap: AstroASTMap = new Map()
	const formASTMap: FormASTMap = new Map()
	const attrValuesASTMap: AttrValuesASTMap = new Map()

	for (const filePath of astroFileNames) {
		const result = await parseAstroFile(filePath, true)
		if (!result) continue

		fileDocumentMap.set(filePath, result.fileContents)
		astroASTMap.set(filePath, result.ast)

		// no directives allowed in /pages, except /pages/@partial
		const fileShouldNotHaveDirective = filePath.match(GLOBALS.REGEX_PAGES_WITHOUT_PARTIAL) !== null
		const partialRoute = getPartialRouteFromFilePath(filePath)

		const generatedFileTypes = generateFileTypes({
			filePath,
			node: result.ast,
			outDir,
			astroComponentNames,
			idSelectorList,
			componentMap,
			flatMarkupMap,
			fileShouldNotHaveDirective,
			partialRoute,
			formASTMap,
			attrValuesASTMap
		})

		_initFlatMarkupArray(generatedFileTypes, filePath)

		if (partialRoute) _updatePartialMarkupTypes({ filePath, genTypes: generatedFileTypes, partialRoute })
		else {
			generatedTypes.push(generatedFileTypes.fileTypes)
		}

		_updateWebComponentTypes(filePath, generatedFileTypes.webComponentTagMapTypes)

		_handleAppComponentTypes({
			hasAppComponentDirective: generatedFileTypes.hasAppComponentDirective,
			filePath,
			route: getRouteFromAstroPage(filePath),
			type: generatedFileTypes.ccTypes
		})

		// skip all astro files within the /pages dir

		if (fileShouldNotHaveDirective || partialRoute) continue
		_updateAppComponentTypes(filePath, generatedFileTypes.appComponentMapTypes)

		const astroComponentName = getFileNameWithoutExtension(filePath)

		generateAstroComponentsList({
			astroComponents,
			filePath,
			root: result.ast,
			astroComponentName,
			slotNames
		})
	}

	// build dependency graph (handle aliased components)

	const graph = buildDependencyGraph(componentMap)
	const sortedComponentNames = topologicalSort(graph)

	generateFormDataTypes({ astroFileNames, astroASTMap, formASTMap, generatedTypes, componentMap })

	generateAttrValuesTypes({ astroFileNames, componentMap, astroASTMap, attrValuesASTMap, generatedTypes })

	// Populate flat markup and handle unique ids

	populateRefMarkup(flatMarkupMap, sortedComponentNames, componentMap)

	populateFlatMarkup(flatMarkupMap, flatMarkupArray)

	_handleTypeConcatenation()

	return {
		generatedTypes,
		generatedWebComponentTagMapTypes,
		generatedAppComponentMapTypes,
		generatedPartialMarkupTypes,
		aliasableComponents: Array.from(astroComponentNames),
		astroComponents,
		flatMarkupArray,
		generatedAppComponentsRouterTypes,
		fileDocumentMap,
		astroASTMap,
		generatedComponentMap: componentMap,
		sortedComponentNames
	}

	//* ---------- Helpers -----------------------------------------------

	function _initWebComponentTypes(): GeneratedNamespaceTypesWithGlobal {
		const obj: GeneratedNamespaceTypesWithGlobal = {
			global: ""
		}
		for (const dir of astroDirs) {
			obj[dir] = ""
		}
		return obj
	}

	function _updateWebComponentTypes(filePath: string, type: string): void {
		const appDir = astroDirs.find((dir) => filePath.includes(dir))
		if (appDir) {
			generatedWebComponentTagMapTypes[appDir] += type
		} else {
			generatedWebComponentTagMapTypes.global += type
		}
	}

	function _iniAppComponentTypes(): GeneratedNamespaceTypesWithGlobal {
		const obj: GeneratedNamespaceTypesWithGlobal = {
			global: ""
		}
		for (const dir of astroDirs) {
			obj[dir] = ""
		}
		return obj
	}

	function _updateAppComponentTypes(filePath: string, type: string): void {
		const appDir = astroDirs.find((dir) => filePath.includes(dir))
		if (appDir) {
			generatedAppComponentMapTypes[appDir] += type
		} else {
			generatedAppComponentMapTypes.global += type
		}
	}

	function _initPartialMarkupTypes(): GeneratedNamespaceTypes {
		const obj: GeneratedNamespaceTypes = {}
		for (const dir of astroDirs) {
			obj[dir] = ""
		}
		return obj
	}

	function _updatePartialMarkupTypes({
		filePath,
		genTypes,
		partialRoute
	}: {
		filePath: string
		genTypes: RT_generateFileTypes
		partialRoute: string
	}): void {
		const appDir = astroDirs.find((dir) => filePath.includes(dir))
		if (!appDir)
			throw new HAQError({
				message: "Missing astro directory.",
				description: "Unable to find the astro dir file.",
				sourceFiles: [filePath]
			})

		const contextPartialTypes =
			genTypes.componentName === ""
				? `\n\n// LINK ${getRelativeFilePath(filePath)}\n\n${injectTypeInPartialRoute({
						generatedType: genTypes.partialFileTypes,
						partialRoute,
						typeName: "",
						withChildren: false,
						isAlias: false
					})}`
				: genTypes.partialFileTypes
		generatedPartialMarkupTypes[appDir] += contextPartialTypes
	}

	function _initFlatMarkupArray(context: RT_generateFileTypes, filePath: string): void {
		if (!context.cssFilePath) return
		const maybeExists = flatMarkupArray.find((r) => r.cssFilePath === context.cssFilePath)
		if (maybeExists)
			throw new HAQError({
				message: "Duplicate css import.",
				description: "Avoid sharing css imports in your astro files to avoid confusion.",
				sourceFiles: [context.cssFilePath, filePath]
			})
		flatMarkupArray.push({
			cssFilePath: context.cssFilePath,
			astroFilePath: filePath,
			componentName: context.componentName,
			flatMarkup: []
		})
	}

	function _initAppComponentsRouterTypes(): GeneratedNamespaceTypes {
		const obj: GeneratedNamespaceTypes = {}
		for (const dir of astroDirs) {
			obj[dir] = ""
		}
		return obj
	}

	function _handleAppComponentTypes({
		hasAppComponentDirective,
		filePath,
		route,
		type
	}: {
		hasAppComponentDirective: boolean
		filePath: string
		route: string | undefined
		type: string
	}): void {
		if (!(hasAppComponentDirective && route)) return

		const appDir = astroDirs.find((dir) => filePath.includes(dir))
		if (!appDir)
			throw new HAQError({
				message: "Missing astro directory.",
				description: "Unable to find the astro dir file.",
				sourceFiles: [filePath]
			})

		const withEmptyType = "{ readonly __noExtraProps?: never }"
		const withType = `{${type}}`

		const appComponentsRouterTypes = `
            \n\n// LINK ${getRelativeFilePath(filePath)}\n\n
            "${route}": ${type === "" ? withEmptyType : withType} \n\n`
		generatedAppComponentsRouterTypes[appDir] += appComponentsRouterTypes
	}

	function _handleTypeConcatenation(): void {
		for (const key of Object.keys(generatedWebComponentTagMapTypes)) {
			if (!generatedWebComponentTagMapTypes[key]) continue
			generatedWebComponentTagMapTypes[key] =
				`\n${injectWebComponentTagMapTypesInScaffold(generatedWebComponentTagMapTypes[key])}`
		}

		for (const key of Object.keys(generatedAppComponentMapTypes)) {
			if (!generatedAppComponentMapTypes[key]) continue
			generatedAppComponentMapTypes[key] =
				`\n${injectAppComponentMapTypesInScaffold(generatedAppComponentMapTypes[key])}`
		}

		for (const key of Object.keys(generatedPartialMarkupTypes)) {
			if (!generatedPartialMarkupTypes[key]) continue
			generatedPartialMarkupTypes[key] = `\n${generatedPartialMarkupTypes[key]}`
		}
	}
}

/* Type Generation
-----------------------------------------------*/

type FileBaseArgs = {
	filePath: string
	outDir: string
}

type ARGS_generateFileTypes = FileBaseArgs & {
	node: Node
	astroComponentNames: Set<string>
	idSelectorList: Set<string>
	componentMap: GeneratedComponentMap
	flatMarkupMap: FlatMarkupMap
	fileShouldNotHaveDirective: boolean
	partialRoute: string | null
	formASTMap: FormASTMap
	attrValuesASTMap: AttrValuesASTMap
}
type RT_generateFileTypes = {
	fileTypes: string
	webComponentTagMapTypes: string
	appComponentMapTypes: string
	partialFileTypes: string
	hasAppComponentDirective: boolean
	ccTypes: string
	cssFilePath: string
	componentName: string
}

function generateFileTypes({
	filePath,
	node: root,
	astroComponentNames,
	idSelectorList,
	componentMap,
	flatMarkupMap,
	outDir,
	fileShouldNotHaveDirective,
	partialRoute,
	formASTMap,
	attrValuesASTMap
}: ARGS_generateFileTypes): RT_generateFileTypes {
	const context: RT_generateFileTypes = {
		fileTypes: "",
		partialFileTypes: "",
		ccTypes: "",
		cssFilePath: "",
		componentName: "",
		webComponentTagMapTypes: "",
		appComponentMapTypes: "",
		hasAppComponentDirective: false
	}

	let topLevelCount = 0
	let tagVisitedCount = 0
	let hasRootConditionalExpression = false

	// x_appc directive allowed only in /pages that are not /pages/@partial or /pages/@email
	const fileCanHaveAppComponentDirective = filePath.match(GLOBALS.REGEX_PAGES_WITHOUT_PARTIAL_AND_EMAIL) !== null

	_visitNode(root)

	return context

	//* ---------- Helpers -----------------------------------------------

	function _visitNode(node: Node): void {
		_handleFrontMatter(node)
		_handleTagNode(node)
		_handleAppComponentDirectiveNode(node)

		if (isConditionalExpression(node)) {
			hasRootConditionalExpression = true
		}

		if (isDirectiveNode(node)) {
			_handleDirectiveNode(node)
			topLevelCount++
			_handleTopLevelDirectiveNode(node)

			// We return early because we only want top-level elements
			return
		}

		if (hasChildren(node)) {
			for (const child of node.children || []) {
				_visitNode(child)
			}
			if (topLevelCount > 1) {
				throw new HAQError({
					message: "Multiple astro components.",
					description:
						"Avoid using multiple top level components in one file. Instead, separate them into their own files.",
					sourceFiles: [filePath]
				})
			}
		}
	}

	function _handleTagNode(node: Node): void {
		if (is.tag(node)) {
			tagVisitedCount++
		}
	}

	function _handleFrontMatter(node: Node): void {
		if (!is.frontmatter(node)) return

		// first split frontmatter into new lines
		const lines = node.value.split("\n")
		for (const line of lines) {
			// ignore comments
			if (line.trim().startsWith("//")) continue
			_handleCssImport(line)
		}
	}

	function _handleCssImport(line: string): void {
		const match = line.match(GLOBALS.REGEX_CSS_IMPORT)?.[1]

		if (!match?.startsWith(".")) return // ignore path aliases, user must only use path aliases with global css folder, which is ignored

		const dirname = path.dirname(filePath)
		context.cssFilePath = path.join(dirname, match)
	}

	function _handleDirectiveNode(tagLikeNode: TagLikeNode): void {
		if (hasRootConditionalExpression) {
			throw new HAQError({
				message: "Invalid use of directive.",
				description:
					"Root level component with directives should not be rendered conditionally. This avoids confusion when aliasing this component.",
				sourceFiles: [filePath],
				ranges: [getPositionRange({ node: tagLikeNode })]
			})
		}
		if (tagVisitedCount > 1) {
			throw new HAQError({
				message: "Invalid use of directive.",
				description:
					"Directives should be used on your root component within a file. This avoids confusion when aliasing this component.",
				sourceFiles: [filePath],
				ranges: [getPositionRange({ node: tagLikeNode })]
			})
		}
	}

	function _handleTopLevelDirectiveNode(tagLikeNode: TagLikeNode): void {
		if (context.fileTypes === "") {
			context.fileTypes += `\n\n// LINK ${getRelativeFilePath(filePath)}\n\n`
		}
		if (context.partialFileTypes === "") {
			context.partialFileTypes += `\n\n// LINK ${getRelativeFilePath(filePath)}\n\n`
		}
		const generated = _processNode({
			childMap: new Map(),
			isMaybeRendered: false,
			isRootVisited: false,
			node: tagLikeNode,
			rootTypeName: getFileNameWithoutExtension(filePath),
			markupObject: [],
			currentDirectiveAncestor: undefined,
			formNode: undefined
		})

		if (!generated) return

		handleCssSelectors({
			data: generated.markupObject,
			processedNode: generated,
			reference: isAliasNode(tagLikeNode) ? generated.tagName : undefined,
			parentId: undefined
		})

		context.componentName = generated.typeName

		_handleFormAST(generated.formNode)
		_handleAttrValuesAST(tagLikeNode)

		flatMarkupMap.set(generated.typeName, {
			children: generated.markupObject,
			filePath,
			cssFilePath: context.cssFilePath
		})

		// WebComponent
		if (hasWebComponentDirective(tagLikeNode)) _handleWebComponent(generated)

		//AppComponent
		if (isAppComponent(tagLikeNode)) _handleAppComponent(generated)

		if (partialRoute) {
			context.partialFileTypes += removeEmptyLines(generated.typeAsString)
			return
		}

		addUniqueSetValueOrThrow({
			identifierList: astroComponentNames,
			identifier: generated.typeName,
			filePath,
			type: "component"
		})

		context.fileTypes += removeEmptyLines(generated.typeAsString)
	}

	function _handleFormAST(formNode: TagLikeNode | undefined): void {
		if (formNode) {
			formASTMap.set(context.componentName, {
				filePath,
				formNode
			})
		}
	}

	function _handleAttrValuesAST(tagLikeNode: TagLikeNode): void {
		const attrValuesDirective = getAttributeByName(tagLikeNode, "x_attr_values")
		if (attrValuesDirective?.kind !== "quoted") return

		if (
			hasWebComponentDirective(tagLikeNode) ||
			(getAttributeByName(tagLikeNode, "id") && getAttributeByName(tagLikeNode, "id")?.kind === "quoted")
		) {
			attrValuesASTMap.set(context.componentName, {
				filePath,
				tagLikeNode,
				attributesToTrack: generateArrayFromSpaceSeparatedList(attrValuesDirective.value)
			})
		}
	}

	function _handleAppComponentDirectiveNode(node: Node): void {
		if (!isAliasedAppComponentNode(node)) return

		if (!fileCanHaveAppComponentDirective) {
			throw new HAQError({
				message: "Invalid directive use.",
				description: `"x_appc" directive must only be used inside the "/pages" folder and not inside the "/@partial" or "/@email" subfolders.`,
				sourceFiles: [filePath],
				ranges: [getPositionRange({ node })]
			})
		}

		context.hasAppComponentDirective = true

		const componentName = node.name
		context.ccTypes += `${componentName}: HAQ_AppComponentByName<"${componentName}">\n`
	}

	function _handleWebComponent(processed: RT__processNode): void {
		const targetComponent = componentMap.get(processed.typeName)
		if (targetComponent) {
			targetComponent.isWebComponent = true
		}

		if (!processed.tagName) return

		context.webComponentTagMapTypes = _generateWebComponentTagMapRecord({
			tagName: processed.tagName,
			typeName: processed.typeName
		})
	}

	function _generateWebComponentTagMapRecord({ tagName, typeName }: { typeName: string; tagName: string }): string {
		const JSFilePath = path.relative(outDir, filePath).replace(GLOBALS.REGEX_ASTRO_EXTENSION, "$1.js")

		return `
			"${tagName}": {
				el: import('./${JSFilePath}').${typeName};
				customEvents: typeof import('./${JSFilePath}').${typeName}.__T_customEvents;
			}`
	}

	function _handleAppComponent(processed: RT__processNode): void {
		if (!processed.tagName) return

		context.appComponentMapTypes = _generateAppComponentTagMapRecord(processed.typeName)
	}

	function _generateAppComponentTagMapRecord(typeName: string): string {
		const JSFilePath = path.relative(outDir, filePath).replace(GLOBALS.REGEX_ASTRO_EXTENSION, "$1.js")

		return `"${typeName}": typeof  import('./${JSFilePath}').${typeName};\n`
	}

	type ARGS__processNode = {
		node: Node
		childMap: ChildMap
		isMaybeRendered: boolean
		isRootVisited: boolean
		rootTypeName: string
		markupObject: ProcessedMarkupObject[]
		currentDirectiveAncestor: string | undefined
		formNode: TagLikeNode | undefined
	}
	type RT__processNode = ProcessedNodeObj & { markupObject: ProcessedMarkupObject[]; isAlias: boolean }

	function _processNode({
		formNode,
		node,
		currentDirectiveAncestor,
		isRootVisited,
		isMaybeRendered,
		childMap,
		rootTypeName,
		markupObject
	}: ARGS__processNode): RT__processNode | undefined {
		_handleAppComponentDirectiveNode(node)
		_enforceCustomElementRule(node, !isRootVisited)

		if (isSlotNode(node)) {
			const xSlotValues = getSlotDirectiveValues(node)
			_handleMaybeChild({
				isAlias: true,
				isSlot: true,
				componentIdentifier: rootTypeName,
				aliasNames: xSlotValues,
				currentDirectiveAncestor,
				thisTypeName: currentDirectiveAncestor,
				childMap,
				markupObject
			})

			return
		}

		let scopedIsMaybeRendered = isMaybeRenderedByNode(node) ? true : isMaybeRendered

		let scopedRootTypeName = rootTypeName

		const isDirective = isDirectiveNode(node)
		const isAlias = isAliasNode(node)
		const isWebComponent = isWebComponentNode(node)

		let thisGeneratedType: ProcessedNodeObj = {
			typeName: "",
			typeAsString: "",
			selKind: undefined,
			tagName: undefined,
			selValue: undefined,
			selTypeLiteral: undefined,
			formNode
		}
		let thisTypeName: string | undefined

		// If current node is a directive node, generate its type
		if (isDirective) __handleDirectiveNode(node)

		const children = "children" in node ? node.children : []

		// Traverse children
		for (const child of children) {
			__processChild(child)
		}

		if (!thisTypeName) return

		return {
			markupObject,
			selKind: thisGeneratedType.selKind,
			selTypeLiteral: thisGeneratedType.selTypeLiteral,
			selValue: thisGeneratedType.selValue,
			typeName: thisTypeName,
			tagName: thisGeneratedType.tagName,
			isAlias,
			formNode,
			typeAsString: isRootVisited
				? _injectChildrenTypeInChild({
						childMap,
						typeName: thisTypeName,
						generatedType: thisGeneratedType.typeAsString,
						isAlias
					})
				: _injectChildrenTypeInRootParent({
						childMap,
						typeName: thisTypeName,
						generatedType: thisGeneratedType.typeAsString,
						isAlias
					})
		}

		//* ---------- Helpers -----------------------------------------------

		function __handleDirectiveNode(tagLikeNode: TagLikeNode): void {
			if (fileShouldNotHaveDirective) {
				throw new HAQError({
					message: "Invalid directive use.",
					description: `Do not use any haq directives inside the "/pages" folder. Create a separate component instead.`,
					sourceFiles: [filePath],
					ranges: [getPositionRange({ node: tagLikeNode })]
				})
			}
			thisGeneratedType = _generateNodeType({
				isAlias,
				isMaybeRendered: scopedIsMaybeRendered,
				isRootNode: !isRootVisited,
				tagLikeNode,
				isWebComponent,
				rootTypeName
			})

			if (thisGeneratedType.formNode) {
				formNode = thisGeneratedType.formNode
			}

			thisTypeName = thisGeneratedType.typeName
			scopedIsMaybeRendered = false // children of mayberendered will never be null since parent will be checked if null before using in DOM

			const reference = isAlias ? thisGeneratedType.tagName : undefined

			scopedRootTypeName = isRootVisited ? rootTypeName : thisTypeName

			_handleComponentMap({
				identifier: rootTypeName ?? thisTypeName,
				isAlias,
				isRootVisited,
				reference,
				selector: thisGeneratedType.selTypeLiteral
			})
		}

		function __processChild(child: Node): void {
			const processedChild = _processNode({
				node: child,
				currentDirectiveAncestor: isDirective ? thisTypeName : currentDirectiveAncestor,
				isMaybeRendered: scopedIsMaybeRendered,
				isRootVisited: true,
				childMap,
				rootTypeName: scopedRootTypeName ?? rootTypeName,
				markupObject,
				formNode
			})

			if (processedChild?.formNode) {
				formNode = processedChild.formNode
			}

			_handleChildMap({
				currentDirectiveAncestor,
				processedChild,
				thisTypeName,
				childMap
			})
			handleCssSelectors({
				processedNode: processedChild,
				parentId: isDirective ? thisTypeName : currentDirectiveAncestor,
				data: markupObject,
				reference: processedChild?.isAlias ? processedChild.tagName : undefined
			})
		}
	}

	function _enforceCustomElementRule(node: Node, isRootNode: boolean): void {
		if (is.tag(node) && isCustomTagNode(node) && !isRootNode) {
			throw new HAQError({
				message: "Invalid custom element.",
				description: "Do not use custom elements inside other components. Instead separate them into their own file.",
				sourceFiles: [filePath],
				ranges: [getPositionRange({ node })]
			})
		}
	}

	/* Generating Types
    -----------------------------------------------*/

	type ARGS__generateNodeType = {
		tagLikeNode: TagLikeNode
		rootTypeName: string
		isRootNode: boolean
		isMaybeRendered: boolean
		isWebComponent: boolean
	}

	function _generateNodeType({
		isAlias,
		isMaybeRendered,
		rootTypeName,
		isRootNode,
		tagLikeNode,
		isWebComponent
	}: ARGS__generateNodeType & { isAlias: boolean }): ProcessedNodeObj {
		if (isAlias) {
			return _generateAliasType({
				tagLikeNode,
				isMaybeRendered,
				isRootNode,
				rootTypeName,
				isWebComponent
			})
		}

		return _generateType({
			tagLikeNode,
			isMaybeRendered,
			isRootNode,
			isWebComponent,
			rootTypeName
		})
	}

	function _generateType({
		tagLikeNode,
		isMaybeRendered,
		isRootNode,
		rootTypeName,
		isWebComponent
	}: ARGS__generateNodeType): ProcessedNodeObj {
		const tagName = tagLikeNode.name

		//* ---------- HAQ_tag -----------------------------------------------

		const HAQ_tag = `HAQ_tag: "${tagName}"`

		//* ---------- HAQ_elType -----------------------------------------------

		const HAQ_elType = `HAQ_elType: ${generateDOMElementType(tagName)}`

		//* ---------- HAQ_attributes -----------------------------------------------

		const HAQ_attributes = `HAQ_attributes: HAQ_AttributesByTag<"${tagName}">`

		//* ---------- HAQ_styleProperties -----------------------------------------------

		const HAQ_styleProperties = `HAQ_styleProperties: HAQ_StylePropertiesByTag<'${tagName}'>`

		//* ---------- HAQ_id & HAQ_selector & HAQ_hasDynSelector -----------------------------------------------

		const selectors = _generateSelectorType({
			tagLikeNode,
			isRootNode,
			tagName
		})

		const HAQ_id = __getIdType(selectors.idTypeLiteral)

		const HAQ_selector = __getSelType(selectors.selTypeLiteral)

		//* ---------- HAQ_matchingSelectors -----------------------------------------------

		const HAQ_matchingSelectors = `HAQ_matchingSelectors: HAQ_MatchingSelectorsByTag<'${tagName}'>`

		//* ---------- HAQ_classList -----------------------------------------------

		const HAQ_classList = __getXClassListType()

		//* ---------- HAQ_formData -----------------------------------------------

		const formNode = tagName === "form" ? tagLikeNode : undefined
		const HAQ_formData = tagName === "form" ? `HAQ_formData : FD_${rootTypeName}` : ""

		//* ---------- HAQ_attributeValues -----------------------------------------------

		const HAQ_attributeValues = __getAttrValuesType()

		//* ---------- HAQ_eventListenerType -----------------------------------------------

		const eventListenerTypes = _generateEventListenerTypes(tagLikeNode)

		const HAQ_eventListenerType =
			eventListenerTypes.length === 0 ? "" : `HAQ_eventListenerType: ${generateUnionFromArray(eventListenerTypes)}`

		//* ---------- HAQ_isWebComponent -----------------------------------------------

		const HAQ_isWebComponent = hasWebComponentDirective(tagLikeNode) ? "HAQ_isWebComponent : true" : ""

		//* ---------- HAQ_isMaybeRendered -----------------------------------------------

		const HAQ_isMaybeRendered = isMaybeRendered ? "HAQ_isMaybeRendered : true" : ""

		//* ---------- Type Alias Name -----------------------------------------------

		const typeName = _generateTypeNameByDirective(tagLikeNode, isRootNode)

		return {
			tagName,
			selKind: selectors.selKind,
			selTypeLiteral: selectors.selTypeLiteral,
			selValue: selectors.selValue,
			typeName,
			formNode,
			typeAsString: `
                ${HAQ_tag}
                ${HAQ_elType}
                ${HAQ_attributes}
                ${HAQ_matchingSelectors}
                ${HAQ_styleProperties}
                ${HAQ_id}
                ${HAQ_selector}
                ${HAQ_classList}
                ${HAQ_formData}
                ${HAQ_attributeValues}
                ${HAQ_eventListenerType}
                ${HAQ_isWebComponent}
                ${HAQ_isMaybeRendered}`
		}

		//* ---------- Helpers -----------------------------------------------

		function __getSelType(selTypeLiteral: string | undefined): string {
			return selTypeLiteral ? `HAQ_selector: ${selTypeLiteral}` : ""
		}

		function __getIdType(idTypeLiteral: string | undefined): string {
			return idTypeLiteral ? `HAQ_id: ${idTypeLiteral}` : ""
		}

		function __getXClassListType(): string {
			const toggleClassAttribute = getAttributeByName(tagLikeNode, "x_class_list")

			if (!toggleClassAttribute?.value) return ""

			return `HAQ_classList: ${generateUnionTypeFromSpaceSeparatedList(toggleClassAttribute.value)};`
		}

		function __getAttrValuesType(): string {
			const attributeValuesDirective = getAttributeByName(tagLikeNode, "x_attr_values")
			if (attributeValuesDirective?.kind !== "quoted") return ""

			if (isRootNode && (isWebComponent || HAQ_id !== "")) return `HAQ_attributeValues : AV_${rootTypeName}`

			throw new HAQError({
				message: "Invalid directive use.",
				description: `You can only use "x_attr_values" directives on the root of a Web Component or an App Component.`,
				sourceFiles: [filePath],
				ranges: [getPositionRange({ node: tagLikeNode })]
			})
		}
	}

	function _generateAliasType({
		tagLikeNode,
		isMaybeRendered,
		isRootNode,
		rootTypeName,
		isWebComponent
	}: ARGS__generateNodeType): ProcessedNodeObj {
		const { name: aliasName } = tagLikeNode

		//* ---------- HAQ_id & HAQ_selector -----------------------------------------------

		const selectors = _generateSelectorType({
			tagLikeNode,
			isRootNode,
			tagName: aliasName
		})

		const selTypeLiteral = selectors.selTypeLiteral
		const id = selectors.idTypeLiteral

		const HAQ_idExtension = id ? `& { HAQ_id: ${id} } ` : ""
		const HAQ_selectorExtension = selTypeLiteral ? `& { HAQ_selector: ${selTypeLiteral} }` : ""

		//* ---------- HAQ_eventListenerType -----------------------------------------------

		const eventListenerTypes = _generateEventListenerTypes(tagLikeNode)
		const HAQ_eventListenerTypeExtension =
			eventListenerTypes.length === 0
				? ""
				: `& { HAQ_eventListenerType:  ${generateUnionFromArray(eventListenerTypes)} }`

		//* ---------- HAQ_classList -----------------------------------------------

		const HAQ_classListExtension = __getXClassListType()

		//* ---------- HAQ_isMaybeRendered -----------------------------------------------

		const HAQ_isMaybeNotRenderedExtension = isMaybeRendered ? "& { HAQ_isMaybeRendered: true }" : ""

		//* ---------- HAQ_attributeValues -----------------------------------------------

		const HAQ_attributeValues = __getAttrValuesType()

		const HAQ_attributeValuesExtension = HAQ_attributeValues ? `& { ${HAQ_attributeValues} }` : ""

		//* ---------- Alias Type Concatenation -----------------------------------------------

		return {
			selKind: selectors.selKind,
			selTypeLiteral,
			selValue: selectors.selValue,
			tagName: aliasName,
			formNode: undefined,
			typeName: _generateTypeNameByDirective(tagLikeNode, isRootNode),
			typeAsString: `${injectAliasTypeInHelper(aliasName)}
                ${HAQ_idExtension}
                ${HAQ_selectorExtension}
                ${HAQ_eventListenerTypeExtension}
                ${HAQ_classListExtension}
                ${HAQ_isMaybeNotRenderedExtension}
                ${HAQ_attributeValuesExtension}`
		}

		//* ---------- Helpers -----------------------------------------------

		function __getAttrValuesType(): string {
			const attributeValuesDirective = getAttributeByName(tagLikeNode, "x_attr_values")
			if (attributeValuesDirective?.kind !== "quoted") return ""

			if (isRootNode && (isWebComponent || HAQ_idExtension !== "")) return `HAQ_attributeValues : AV_${rootTypeName}`

			throw new HAQError({
				message: "Invalid directive use.",
				description: `You can only use "x_attr_values" directives on the root of a Web Component or an App Component.`,
				sourceFiles: [filePath],
				ranges: [getPositionRange({ node: tagLikeNode })]
			})
		}

		function __getXClassListType(): string {
			const toggleClassAttribute = getAttributeByName(tagLikeNode, "x_class_list")

			const toggleClasses = toggleClassAttribute?.value
				? generateUnionTypeFromSpaceSeparatedList(toggleClassAttribute.value)
				: ""

			return toggleClasses === "" ? "" : `& { HAQ_classList: ${toggleClasses} }`
		}
	}

	type ARGS__generateSelectorType = {
		tagLikeNode: TagLikeNode
		tagName: string
		isRootNode: boolean
	}

	type RT__generateSelectorType = {
		selTypeLiteral: string | undefined
		idTypeLiteral?: string | undefined
		selValue: string | undefined
		selKind: SelectorKind | undefined
	}

	function _generateSelectorType({
		tagLikeNode,
		isRootNode,
		tagName
	}: ARGS__generateSelectorType): RT__generateSelectorType {
		//* ---------- html (document.documentElement) -----------------------------------------------

		if (tagName === "html") {
			return {
				selTypeLiteral: "unknown",
				selValue: undefined,
				selKind: "TAG"
			}
		}

		//* ---------- x_dyn_sel -----------------------------------------------

		const dynamicSelector = getAttributeByName(tagLikeNode, "x_dyn_sel")
		if (dynamicSelector) {
			return __handleDynSelector(dynamicSelector)
		}

		//* ---------- x_sel -----------------------------------------------

		const xSelectorAttributeValue = getXSelectorValue(tagLikeNode)
		if (xSelectorAttributeValue)
			return {
				selTypeLiteral: `"[x_sel='${xSelectorAttributeValue}']"`,
				selValue: xSelectorAttributeValue,
				selKind: "HAQ_SEL_ATTR"
			}

		//* ---------- id Selector -----------------------------------------------

		const idAttributeValue = getIDAttributeValue(tagLikeNode)
		if (idAttributeValue) {
			if (!isRootNode) {
				throw new HAQError({
					message: "Invalid directive use.",
					description: "Do not use id selectors for child components. Use an x_sel attribute instead.",
					sourceFiles: [filePath],
					ranges: [getPositionRange({ node: tagLikeNode })]
				})
			}
			addUniqueSetValueOrThrow({
				filePath,
				identifierList: idSelectorList,
				identifier: idAttributeValue,
				type: "id selector"
			})
			return {
				selTypeLiteral: `"#${idAttributeValue}"`,
				idTypeLiteral: `"${idAttributeValue}"`,
				selKind: "ID",
				selValue: idAttributeValue
			}
		}

		// defaults to tag-name if it is a custom-element
		if (isCustomTagNode(tagLikeNode)) {
			return { selTypeLiteral: `"${tagName}"`, selValue: tagName, selKind: "TAG" }
		}

		if (is.component(tagLikeNode)) {
			return { selTypeLiteral: undefined, selValue: undefined, selKind: undefined }
		}

		// throw error, must contain a selector if native element
		throw new HAQError({
			message: "Invalid directive use.",
			description: `You must have either an id, or x_sel selector on this native html element: ${tagName}`,
			sourceFiles: [filePath],
			ranges: [getPositionRange({ node: tagLikeNode })]
		})

		//* ---------- Helpers -----------------------------------------------

		function __handleDynSelector(attributeNode: I_AstroAttributeNode): RT__generateSelectorType {
			if (!isRootNode || partialRoute) {
				throw new HAQError({
					message: "Invalid directive use.",
					description: `You can only use "x_dyn_sel" on a top-level component.`,
					sourceFiles: [filePath],
					ranges: [getPositionRange({ node: attributeNode })]
				})
			}

			if (!(isCustomTagNode(tagLikeNode) || attributeNode.value)) {
				throw new HAQError({
					message: "Missing selector value.",
					description: `You need to add a value to "x_dyn_sel" on a native html element.`,
					sourceFiles: [filePath],
					ranges: [getPositionRange({ node: tagLikeNode })]
				})
			}

			return {
				selTypeLiteral: "unknown",
				selValue: attributeNode.value || undefined,
				selKind: attributeNode.value ? "HAQ_DYN_SEL_ATTR" : "TAG"
			}
		}
	}

	function _generateEventListenerTypes(tagLikeNode: TagLikeNode): string[] {
		let eventTypesArray: string[] = []
		const eventTypeAttribute = getAttributeByName(tagLikeNode, "x_ev_types")
		if (eventTypeAttribute?.value) {
			eventTypesArray = getArrayFromStringifiedArray(eventTypeAttribute.value, filePath)
		}
		return eventTypesArray
	}

	function _generateTypeNameByDirective(tagLikeNode: TagLikeNode, isRootNode: boolean): string {
		if (isRootNode && !partialRoute) {
			return getFileNameWithoutExtension(filePath)
		}

		// typenames inside a HAQ_Component obj

		const idAttributeValue = getIDAttributeValue(tagLikeNode)
		if (idAttributeValue) return __handleIdAttribute(idAttributeValue)

		const xSelectorAttributeValue = getXSelectorValue(tagLikeNode)
		if (xSelectorAttributeValue) {
			return kebab2Pascal(xSelectorAttributeValue)
		}

		// defaults to tag-name ONLY if Aliased Component and not partial route

		return __handleDefaultAliasTypeName()

		//* ---------- Helpers -----------------------------------------------

		function __handleIdAttribute(idValue: string): string {
			if (partialRoute) {
				throw new HAQError({
					message: "Invalid directive use.",
					description: "Do not use id selectors for partial routes.",
					sourceFiles: [filePath],
					ranges: [getPositionRange({ node: tagLikeNode })]
				})
			}
			return idValue[0]?.toUpperCase() + idValue.slice(1)
		}

		function __handleDefaultAliasTypeName(): string {
			return partialRoute && isRootNode
				? `${kebab2Pascal(getFileNameWithoutExtension(filePath))}_${kebab2Pascal(tagLikeNode.name)}`
				: kebab2Pascal(tagLikeNode.name)
		}
	}

	/* Child Map
    -----------------------------------------------*/

	type ARGS__handleMaybeChild = Omit<ARGS__handleChildMap, "processedChild"> & {
		componentIdentifier: string | undefined
		isAlias: boolean
		isSlot: boolean
		aliasNames: string[] | undefined
		markupObject: ProcessedMarkupObject[]
	}

	function _handleMaybeChild({
		componentIdentifier,
		isAlias,
		isSlot,
		aliasNames,
		childMap,
		thisTypeName,
		currentDirectiveAncestor,
		markupObject
	}: ARGS__handleMaybeChild): void {
		if (!(aliasNames && componentIdentifier)) return

		for (const aliasName of aliasNames) {
			const extension = aliasNames.length === 1 && isSlot ? "" : "& { HAQ_isMaybeRendered: true }"
			const processedChild = {
				typeAsString: `${aliasName}: ${injectAliasTypeInHelper(aliasName)} ${extension} `,
				typeName: aliasName,
				tagName: aliasName,
				selKind: undefined,
				selValue: undefined,
				selTypeLiteral: undefined,
				isDynSel: false,
				nullableChildren: undefined
			}
			_handleComponentMap({
				identifier: componentIdentifier,
				isAlias,
				isRootVisited: true,
				reference: aliasName,
				selector: undefined
			})
			_handleChildMap({
				currentDirectiveAncestor,
				processedChild,
				thisTypeName,
				childMap
			})
			handleCssSelectors({
				processedNode: processedChild,
				parentId: currentDirectiveAncestor,
				data: markupObject,
				reference: aliasName
			})
		}
	}

	type ARGS__handleChildMap = {
		childMap: ChildMap
		processedChild: TypedOmit<ProcessedNodeObj, "formNode"> | undefined
		thisTypeName: string | undefined
		currentDirectiveAncestor: string | undefined
	}

	function _handleChildMap({
		currentDirectiveAncestor,
		processedChild,
		thisTypeName,
		childMap
	}: ARGS__handleChildMap): void {
		const childMapKey = thisTypeName ? thisTypeName : currentDirectiveAncestor
		if (processedChild && childMapKey) {
			__updateChildMap({
				key: childMapKey,
				childTypeName: processedChild.typeName,
				childTypeAsString: processedChild.typeAsString
			})
		}

		type ARGS___updateChildMap = {
			key: string
			childTypeName: string
			childTypeAsString: string
		}
		function __updateChildMap({ key, childTypeName, childTypeAsString }: ARGS___updateChildMap): void {
			if (!childMap.has(key)) {
				childMap.set(key, {
					childrenTypeNameSet: new Set(),
					typeAsString: []
				})
			}

			const record = childMap.get(key)

			if (!record) return

			addUniqueSetValueOrThrow({
				filePath,
				identifierList: record.childrenTypeNameSet,
				identifier: childTypeName,
				type: "component"
			})

			record.typeAsString.push(childTypeAsString)
			childMap.set(key, record)
		}
	}

	/* Component Map
    -----------------------------------------------*/

	type ARGS__handleComponentMap = {
		identifier: string
		selector: string | undefined
		reference: string | undefined
		isAlias: boolean
	}

	function _handleComponentMap({
		identifier,
		isAlias,
		isRootVisited,
		reference,
		selector
	}: ARGS__handleComponentMap & { isRootVisited: boolean }): void {
		if (!isRootVisited) {
			_initComponentMap({
				identifier,
				isAlias,
				selector,
				reference
			})
			return
		}
		_updateComponentMap({
			identifier,
			isAlias,
			reference,
			selector
		})
	}

	function _initComponentMap({ identifier, isAlias, selector, reference }: ARGS__handleComponentMap): void {
		componentMap.set(identifier, {
			filePath,
			rootSelector: selector,
			childSelectors: new Set(),
			slotChildSelectors: new Set(),
			references: isAlias && reference ? new Set([reference]) : new Set(),
			isWebComponent: false,
			isAlias
		})
	}

	function _updateComponentMap({ identifier, selector, reference }: ARGS__handleComponentMap): void {
		const targetComponent = componentMap.get(identifier)
		if (!targetComponent) return

		if (selector && !canIgnoreUniqueSelector(selector)) {
			addUniqueSelectorOrThrow({
				filePath: targetComponent.filePath,
				identifierList: targetComponent.isAlias ? targetComponent.slotChildSelectors : targetComponent.childSelectors,
				identifier: selector
			})
		}

		if (!reference) return

		targetComponent.references.add(reference)
	}

	/* Injecting & Concatenating types
    -----------------------------------------------*/

	type ARGS__injectChildrenTypeInChild = {
		childMap: ChildMap
		typeName: string
		generatedType: string
		isAlias: boolean
	}
	function _injectChildrenTypeInChild({
		childMap,
		typeName,
		generatedType,
		isAlias
	}: ARGS__injectChildrenTypeInChild): string {
		const childrenTypes = _joinChildrenTypes(childMap, typeName)
		let HAQ_children = ""
		if (childrenTypes !== "never") {
			HAQ_children = isAlias ? `& { HAQ_slotChildren:  ${childrenTypes} }` : `HAQ_children: ${childrenTypes}`
		}

		const typeDef = isAlias
			? `${typeName} : ${generatedType} ${HAQ_children}\n`
			: `
        ${typeName} : {
            ${generatedType}
            ${HAQ_children}
        }\n`

		return typeDef
	}

	function _injectChildrenTypeInRootParent({
		childMap,
		typeName,
		generatedType,
		isAlias
	}: ARGS__injectChildrenTypeInChild): string {
		const childrenTypes = _joinChildrenTypes(childMap, typeName)
		let HAQ_children = ""
		if (childrenTypes !== "never") {
			HAQ_children = isAlias ? `& { HAQ_slotChildren: ${childrenTypes} }` : `HAQ_children: ${childrenTypes}`
		}

		const typeDef = isAlias
			? `\nexport type ${GLOBALS.HAQ_MARKUP_TYPE_PREFIX}${typeName} = ${generatedType} ${HAQ_children}\n`
			: `
        \nexport type ${GLOBALS.HAQ_MARKUP_TYPE_PREFIX}${typeName} = {
            ${generatedType}
            ${HAQ_children}
        }\n`

		return partialRoute
			? injectTypeInPartialRoute({
					partialRoute,
					typeName,
					generatedType: `${generatedType} ${HAQ_children}`,
					withChildren: true,
					isAlias
				})
			: typeDef
	}

	function _joinChildrenTypes(childMap: ChildMap, typeName: string): string {
		if (childMap.has(typeName) && childMap.get(typeName)) {
			return `{ ${childMap.get(typeName)?.typeAsString.join("\n")} }`
		}
		return "never"
	}
}

/* Astro Component Lists Generation
-----------------------------------------------*/

type ARGS_generateAstroComponentsList = {
	filePath: string
	astroComponentName: string
	root: Node
	astroComponents: JSON_AstroComponent[]
	slotNames: Set<string>
}

function generateAstroComponentsList({
	filePath,
	root,
	astroComponents,
	astroComponentName,
	slotNames
}: ARGS_generateAstroComponentsList): void {
	_addUniqueAstroComponentRecordOrThrow()
	_visitNode(root)

	//* ---------- Helpers -----------------------------------------------

	function _addUniqueAstroComponentRecordOrThrow(): void {
		const astroComponent = astroComponents.find((c) => c.componentName === astroComponentName)
		if (astroComponent) {
			throw new HAQError({
				message: "Duplicate astro component.",
				description: `Identifier: ${astroComponentName}`,
				sourceFiles: [filePath]
			})
		}
		const obj: JSON_AstroComponent = {
			componentName: astroComponentName,
			slotList: []
		}
		astroComponents.push(obj)
	}

	function _visitNode(node: Node): void {
		if (is.tag(node)) _handleAstroComponentSlots(node)

		if (hasChildren(node)) {
			for (const child of node.children || []) {
				_visitNode(child)
			}
		}
	}

	function _handleAstroComponentSlots(tagLikeNode: TagLikeNode): void {
		if (!isSlotNode(tagLikeNode)) return

		const nameAttribute = tagLikeNode.attributes.find((attribute) => attribute.name === "name" && attribute.value)
		const xSlotAttribute = tagLikeNode.attributes.find((attribute) => attribute.name === "x_slot")

		const slotName = nameAttribute ? nameAttribute.value : GLOBALS.ASTRO_DEFAULT_SLOT_NAME
		const componentNames = xSlotAttribute?.value ? generateArrayFromSpaceSeparatedList(xSlotAttribute.value) : []

		const astroComponent = astroComponents.find((c) => c.componentName === astroComponentName)
		if (!astroComponent) return

		_addUniqueSlotNameOrThrow({
			slotName,
			astroComponent,
			componentNames,
			required: xSlotAttribute ? true : undefined
		})
	}

	type ARGS__addUniqueSlotNameOrThrow = {
		astroComponent: JSON_AstroComponent
		slotName: string
		componentNames: string[]
		required: true | undefined
	}
	function _addUniqueSlotNameOrThrow({
		astroComponent,
		slotName,
		componentNames,
		required
	}: ARGS__addUniqueSlotNameOrThrow): void {
		const slotNameExists = astroComponent.slotList.find((s) => s.slotName === slotName)
		const globalSlotsHasSlot = slotNames.has(slotName)
		if (slotNameExists || globalSlotsHasSlot) {
			throw new HAQError({
				message: "Duplicate slot name.",
				description: `Slot name: ${slotName}.`,
				sourceFiles: [filePath]
			})
		}
		if (slotName !== GLOBALS.ASTRO_DEFAULT_SLOT_NAME) slotNames.add(slotName)
		astroComponent.slotList.push({
			slotName,
			componentNames,
			required
		})
	}
}

/* Form Data Types
-----------------------------------------------*/

type ARGS_generateFormDataTypes = {
	astroFileNames: string[]
	componentMap: GeneratedComponentMap
	astroASTMap: AstroASTMap
	formASTMap: FormASTMap
	generatedTypes: string[]
}

function generateFormDataTypes({
	astroFileNames,
	componentMap,
	astroASTMap,
	formASTMap,
	generatedTypes
}: ARGS_generateFormDataTypes): void {
	for (const [componentName, formObj] of formASTMap.entries()) {
		const formRecord = _processFormNode({
			formObj,
			formDataRecord: {},
			quotedComponentStack: [],
			fileTypeAttrStack: []
		})

		const formTypes = _generateTypeFromRecord(formRecord)
		generatedTypes.push(injectFormDataType(componentName, formTypes, formObj.filePath))
	}

	//* ---------- Helpers -----------------------------------------------

	type ARGS__processFormNode = {
		formObj: FormPayload
		formDataRecord: Record<string, string>
		quotedComponentStack: {
			componentName: string
			formRecordProp: string
		}[]
		fileTypeAttrStack: (string | "tag")[]
	}
	function _processFormNode({
		formObj,
		formDataRecord,
		quotedComponentStack,
		fileTypeAttrStack
	}: ARGS__processFormNode): Record<string, string> {
		if (hasChildren(formObj.formNode)) {
			for (const child of formObj.formNode.children || []) {
				__traverse(child)
			}
		} else {
			__traverse(formObj.formNode)
		}

		return formDataRecord

		//* ---------- Helpers -----------------------------------------------

		function __traverse(node: Node): void {
			const isTagNode = is.tag(node)

			if (isTagNode) __handleTagNode(node)

			if (is.component(node)) __handleComponentNode(node.name)

			if (hasChildren(node)) {
				for (const child of node.children || []) {
					__traverse(child)
				}
			}

			if (isTagNode) __handlefileTypeAttrStack(node)
			if (is.component(node)) __handleComponentLeave(node)
		}

		function __handlefileTypeAttrStack(tagLikeNode: TagLikeNode): void {
			if (is.component(tagLikeNode)) {
				const prevComponent = fileTypeAttrStack.at(-1)
				if (!prevComponent) return

				if (prevComponent !== tagLikeNode.name) return

				fileTypeAttrStack.pop()
				return
			}
			fileTypeAttrStack.pop()
		}

		function __handleComponentLeave(componentNode: ComponentNode): void {
			const prevComponent = quotedComponentStack.at(-1)
			if (!prevComponent) return

			if (prevComponent.componentName !== componentNode.name) return

			quotedComponentStack.pop()
		}

		function __handleTagNode(tagLikeNode: TagLikeNode): void {
			const nameAttribute = getFormInputNameAttributeValue(tagLikeNode)

			if (hasFileTypeAttribute(tagLikeNode)) {
				fileTypeAttrStack.push(is.component(tagLikeNode) ? tagLikeNode.name : "tag")
			}

			if (nameAttribute) __handleNameAttribute(tagLikeNode, nameAttribute)
		}

		function __handleNameAttribute(tagLikeNode: TagLikeNode, nameAttribute: I_AstroAttributeNode): void {
			const validFormTags = ["input", "select", "textarea"]
			if (!is.component(tagLikeNode)) ___handleNativeFormElement()

			if (nameAttribute.kind === "quoted") ___handleQuotedNameAttribute()

			//* ---------- Helpers -----------------------------------------------

			function ___handleNativeFormElement(): void {
				const prevComponent = quotedComponentStack.at(-1)
				if (!prevComponent) return

				if (!validFormTags.includes(tagLikeNode.name)) {
					__removeFormRecord(prevComponent.formRecordProp)
					return
				}

				__updateFormRecord(tagLikeNode, prevComponent.formRecordProp)
			}

			function ___handleQuotedNameAttribute(): void {
				if (!(is.component(tagLikeNode) || validFormTags.includes(tagLikeNode.name))) return

				__setFormRecord(tagLikeNode, nameAttribute.value)

				const prevComponent = quotedComponentStack.at(-1)
				if (prevComponent) {
					throw new HAQError({
						message: "Nested name attributes encountered.",
						description: `"${tagLikeNode.name}" implements a name attribute inside "${prevComponent.componentName}". This will likely cause unexpected behavior.`,
						sourceFiles: [formObj.filePath],
						ranges: [getPositionRange({ node: tagLikeNode })]
					})
				}

				if (is.component(tagLikeNode)) {
					const componentFromMap = componentMap.get(tagLikeNode.name)
					if (componentFromMap?.isWebComponent) return

					quotedComponentStack.push({
						componentName: tagLikeNode.name,
						formRecordProp: nameAttribute.value
					})
				}
			}
		}

		function __handleComponentNode(nodeName: string): void {
			const targetAstroFile = astroFileNames.find((f) => f.endsWith(`/${nodeName}.astro`))
			if (!targetAstroFile) return

			const ast = astroASTMap.get(targetAstroFile)
			if (!ast) return

			const componentFromMap = componentMap.get(nodeName)
			if (componentFromMap?.isWebComponent) return

			__traverse(ast)
		}

		function __setFormRecord(tagLikeNode: TagLikeNode, nameAttributeValue: string): void {
			formDataRecord[nameAttributeValue] = __generateFormRecordValue(tagLikeNode)
		}

		function __removeFormRecord(nameAttributeValue: string): void {
			delete formDataRecord[nameAttributeValue]
		}

		function __updateFormRecord(tagLikeNode: TagLikeNode, nameAttributeValue: string): void {
			const inputValuesAttribute = getAttributeByName(tagLikeNode, "x_input_values")
			if (inputValuesAttribute) {
				formDataRecord[nameAttributeValue] = generateUnionTypeFromStringifiedArray(
					inputValuesAttribute.value,
					formObj.filePath
				)
			}

			if (fileTypeAttrStack.at(-1)) {
				formDataRecord[nameAttributeValue] = "File"
			}
		}

		function __generateFormRecordValue(tagLikeNode: TagLikeNode): string {
			const inputValuesAttribute = getAttributeByName(tagLikeNode, "x_input_values")
			if (inputValuesAttribute) {
				return generateUnionTypeFromStringifiedArray(inputValuesAttribute.value, formObj.filePath)
			}

			if (fileTypeAttrStack.at(-1)) {
				return "File"
			}

			return "string"
		}
	}

	function _generateTypeFromRecord(formDataRecord: Record<string, string>): string {
		let formTypes = ""
		for (const [key, value] of entriesFromObject(formDataRecord)) {
			formTypes += `${key} : ${value}\n`
		}
		return formTypes
	}
}

/* x_attr_values types
-----------------------------------------------*/

type ARGS_generateAttrValuesTypes = {
	astroFileNames: string[]
	componentMap: GeneratedComponentMap
	astroASTMap: AstroASTMap
	attrValuesASTMap: AttrValuesASTMap
	generatedTypes: string[]
}

function generateAttrValuesTypes({
	astroFileNames,
	componentMap,
	astroASTMap,
	attrValuesASTMap,
	generatedTypes
}: ARGS_generateAttrValuesTypes): void {
	for (const [componentName, mapEntry] of attrValuesASTMap.entries()) {
		const result = _processRootComponentNode({
			mapEntry,
			record: {}
		})

		const attrValuesTypes = _generateTypeFromRecord(result)
		generatedTypes.push(injectAttrValuesType(componentName, attrValuesTypes, mapEntry.filePath))
	}

	//* ---------- Helpers -----------------------------------------------

	type ARGS__processRootComponentNode = {
		mapEntry: AttrValuesPayload
		record: Record<string, Set<string>>
	}
	function _processRootComponentNode({
		mapEntry,
		record
	}: ARGS__processRootComponentNode): Record<string, Set<string>> {
		if (hasChildren(mapEntry.tagLikeNode)) {
			for (const child of mapEntry.tagLikeNode.children || []) {
				__traverse(child)
			}
		} else {
			__traverse(mapEntry.tagLikeNode)
		}

		return record

		//* ---------- Helpers -----------------------------------------------

		function __traverse(node: Node): void {
			const isTagNode = is.tag(node)

			if (isTagNode) __populateRecord(node)

			if (is.component(node)) __handleComponentNode(node.name)

			if (hasChildren(node)) {
				for (const child of node.children || []) {
					__traverse(child)
				}
			}
		}

		function __populateRecord(tagLikeNode: TagLikeNode): void {
			for (const targetAttr of mapEntry.attributesToTrack) {
				const foundAttr = tagLikeNode.attributes.find((attr) => attr.name === targetAttr)
				if (foundAttr?.kind !== "quoted" || foundAttr.value.trim() === "") continue

				const value = foundAttr.value.trim()
				if (record[targetAttr]) record[targetAttr].add(value)
				else {
					record[targetAttr] = new Set([value])
				}
			}
		}

		function __handleComponentNode(nodeName: string): void {
			const targetAstroFile = astroFileNames.find((f) => f.endsWith(`/${nodeName}.astro`))
			if (!targetAstroFile) return

			const ast = astroASTMap.get(targetAstroFile)
			if (!ast) return

			const componentFromMap = componentMap.get(nodeName)
			if (componentFromMap?.isWebComponent) return

			__traverse(ast)
		}
	}

	function _generateTypeFromRecord(record: Record<string, Set<string>>): string {
		let generatedType = ""
		for (const [key, value] of entriesFromObject(record)) {
			generatedType += `${key} : ${generateUnionFromArray([...value])}\n`
		}
		return generatedType
	}
}

/* Topological Sorting
-----------------------------------------------*/

type DepdendencyGraph = Map<__ComponentName__, Set<__ComponentName__>>
function buildDependencyGraph(componentMap: GeneratedComponentMap): DepdendencyGraph {
	const graph: DepdendencyGraph = new Map()
	for (const [identifier, info] of componentMap.entries()) {
		graph.set(identifier, info.references ?? [])
	}
	return graph
}

function topologicalSort(graph: DepdendencyGraph): string[] {
	const visited = new Set<string>()
	const temp = new Set<string>()
	const result: string[] = []

	function _visit(node: string): void {
		if (visited.has(node)) return
		if (temp.has(node)) {
			throw new HAQError({
				message: "Circular dependency.",
				description: `Node: ${node}`
			})
		}
		temp.add(node)

		for (const dep of graph.get(node) || []) {
			_visit(dep)
		}

		temp.delete(node)
		visited.add(node)
		result.push(node)
	}

	for (const node of graph.keys()) {
		_visit(node)
	}

	return result
}

/* Flat Markup Generation (for css linting & completions)
-----------------------------------------------*/

type FlatMarkupMapContent = { children: ProcessedMarkupObject[]; filePath: string; cssFilePath?: string }
type FlatMarkupMap = Map<__TypeName__, FlatMarkupMapContent>

type ARGS_handleCssSelectors = {
	reference: string | undefined
	parentId: string | undefined
	processedNode: TypedOmit<ProcessedNodeObj, "formNode"> | undefined
	data: ProcessedMarkupObject[]
}
function handleCssSelectors({ data, parentId, processedNode, reference }: ARGS_handleCssSelectors): void {
	if (!processedNode) return

	const id = processedNode.typeName
	const selValue = processedNode.selValue

	if (reference) {
		data.push({
			tagName: undefined,
			reference,
			id,
			selKind: processedNode.selKind,
			selValue,
			parentId
		})
		return
	}
	if (!processedNode.tagName) return

	data.push({
		reference,
		id,
		selKind: processedNode.selKind,
		selValue,
		parentId,
		tagName: processedNode.tagName
	})
}

function populateFlatMarkup(flatMarkupMap: FlatMarkupMap, flatMarkupArray: JSON_CSSMarkup[]): void {
	for (const record of flatMarkupArray) {
		if (!record.componentName) continue

		const component = flatMarkupMap.get(record.componentName)
		if (!component) continue

		for (const child of component.children) {
			const { reference: _, ...rest } = child // remove reference prop for json output

			_handleDefaults({ ...rest, reference: undefined })
			_handleUniqueId(record, rest.id)

			record.flatMarkup.push(rest as GeneratedCSSMarkupObject)
		}
	}

	//* ---------- Helpers -----------------------------------------------

	function _handleDefaults(obj: ProcessedMarkupObject): void {
		if (!obj.selValue) {
			// defaults to tagName
			obj.selValue = obj.tagName
		}
		if (!obj.selKind) {
			// defaults to tagName
			obj.selKind = "TAG"
		}
	}

	function _handleUniqueId(record: JSON_CSSMarkup, id: string): void {
		if (record.flatMarkup.some((r) => r.id === id)) {
			throw new HAQError({
				message: "Duplicate markup identifier.",
				description: `Id: ${id}\nConsider changing a selector name to avoid collisions.`,
				sourceFiles: [record.astroFilePath]
			})
		}
	}
}

type CurrentChildrenMapContent = TypedOmit<ProcessedMarkupObject, "id">
type CurrentChildrenMap = Map<__ComponentName__, CurrentChildrenMapContent>

function populateRefMarkup(
	flatMarkupMap: FlatMarkupMap,
	sortedIdentifiers: string[],
	componentMap: GeneratedComponentMap
): void {
	for (const identifier of sortedIdentifiers) {
		const current = flatMarkupMap.get(identifier)
		if (!current) continue

		const currentChildrenMap: CurrentChildrenMap = new Map()
		for (const child of current.children) {
			const { id, ...rest } = child
			currentChildrenMap.set(id, { ...rest })
			if (!child.reference) continue

			_handleRef(child, current, currentChildrenMap)
		}

		// repopulate original current.children
		_handleCurrentChildren(currentChildrenMap, current)
	}

	//* ---------- Helpers -----------------------------------------------

	function _handleRef(
		child: ProcessedMarkupObject,
		current: FlatMarkupMapContent,
		currentChildrenMap: CurrentChildrenMap
	): void {
		const id = child.reference ? child.reference : child.id
		const ref = flatMarkupMap.get(id)
		if (!ref) return

		const refRoot = ref.children.find((r) => !r.parentId)

		if (!refRoot?.tagName) return

		child.tagName = _handleTagName(refRoot.tagName)
		child.selValue = child.selValue ? child.selValue : refRoot.selValue
		child.selKind = child.selKind ? child.selKind : refRoot.selKind

		const currentFromComponentMap = componentMap.get(id)
		if (!currentFromComponentMap) return

		// ignore webcomponent
		if (currentFromComponentMap.isWebComponent) return

		const { newParentId, oldParentId } = _handleUnknownRootSelector(refRoot, current)

		const refChildren = ref.children.filter((c) => c.selValue)
		_populateRefChildren({ refChildren, oldParentId, newParentId, currentChildrenMap, current })
	}

	type ParentIds = {
		oldParentId: string
		newParentId: string | undefined
	}
	function _handleUnknownRootSelector(refRoot: ProcessedMarkupObject, current: FlatMarkupMapContent): ParentIds {
		const oldParentId = refRoot.id
		const newParentId = current.children.find((r) => r.reference && r.reference === oldParentId)?.id
		return { oldParentId, newParentId }
	}

	function _handleTagName(tagName: string): string | undefined {
		if (!containsUppercase(tagName)) return tagName
		const ref = flatMarkupMap.get(tagName)
		if (!ref) return
		const refRoot = ref.children.find((r) => !r.parentId)
		if (!refRoot?.tagName) return
		return _handleTagName(refRoot.tagName)
	}

	type ARGS__populateRefChildren = {
		refChildren: ProcessedMarkupObject[]
		currentChildrenMap: CurrentChildrenMap
		oldParentId: string
		newParentId: string | undefined
		current: FlatMarkupMapContent
	}

	function _populateRefChildren({
		refChildren,
		oldParentId,
		newParentId,
		currentChildrenMap,
		current
	}: ARGS__populateRefChildren): void {
		for (const refChild of refChildren) {
			if (!refChild.parentId) continue

			const newChild: CurrentChildrenMapContent = { ...refChild }
			if (refChild.parentId === oldParentId) {
				newChild.parentId = newParentId
			}

			if (currentChildrenMap.has(refChild.id)) {
				throw new HAQError({
					message: "Duplicate selector identifier.",
					description: `Selector: ${refChild.selValue}\nComponent: ${refChild.id}`,
					sourceFiles: [current.filePath]
				})
			}

			currentChildrenMap.set(refChild.id, { ...newChild })
		}
	}

	function _handleCurrentChildren(currentChildrenMap: CurrentChildrenMap, current: FlatMarkupMapContent): void {
		for (const [id, rec] of currentChildrenMap.entries()) {
			const existingIndex = current.children.findIndex((r) => r.id === id)

			if (existingIndex !== -1) {
				let recToReplace = current.children.at(existingIndex)
				if (!recToReplace) continue

				recToReplace = { ...rec, id }
				continue
			}
			current.children.push({ id, ...rec })
		}
	}
}

/* Helpers
-----------------------------------------------*/

function getFormInputNameAttributeValue(tagLikeNode: TagLikeNode): I_AstroAttributeNode | undefined {
	const nameAttribute = getAttributeByName(tagLikeNode, "name")
	if (!nameAttribute || isSlotNode(tagLikeNode)) {
		return
	}
	return nameAttribute
}

function hasFileTypeAttribute(tagLikeNode: TagLikeNode): boolean {
	const typeAttribute = tagLikeNode.attributes.find((attr) => attr.name === "type")
	if (!typeAttribute) {
		return false
	}
	return typeAttribute.kind === "quoted" && typeAttribute.value === "file"
}

function generateDOMElementType(tagName: string): string {
	if (tagName === "form") return "HAQ_HTMLFormElement"

	return `HAQ_HTMLTagTypes['${tagName}'];`
}

function isNullableComponent(node: Node): node is ComponentNode {
	return is.component(node) && node.name === GLOBALS.NULLABLE_COMPONENT_NAME
}

function isMaybeRenderedByNode(node: Node): boolean {
	return isConditionalExpression(node) || isNullableComponent(node)
}

/* String Literal Composition
-----------------------------------------------*/

function injectFormDataType(componentName: string, types: string, filePath: string): string {
	return `
	 	\n\n// LINK ${getRelativeFilePath(filePath)}\n\n
		export type FD_${componentName} = {
			${types}
		}\n\n`
}

function injectAttrValuesType(componentName: string, types: string, filePath: string): string {
	return `
	 	\n\n// LINK ${getRelativeFilePath(filePath)}\n\n
		export type AV_${componentName} = {
			${types}
		}\n\n`
}

function injectAliasTypeInHelper(aliasName: string): string {
	return `HAQ_MarkupAlias< ${GLOBALS.HAQ_MARKUP_TYPE_PREFIX}${aliasName}>`
}

function injectWebComponentTagMapTypesInScaffold(type: string): string {
	return `namespace HAQ {
            interface WebComponentTagNameMap {\n${type}\n}
        }\n\n`
}

function injectAppComponentMapTypesInScaffold(type: string): string {
	return `namespace HAQ {
            interface AppComponentMap {\n${type}\n}
        }\n\n`
}

type ARGS_injectTypeInPartialRoute = {
	partialRoute: string
	typeName: string
	generatedType: string
	withChildren: boolean
	isAlias: boolean
}
function injectTypeInPartialRoute({
	generatedType,
	partialRoute,
	typeName,
	withChildren,
	isAlias
}: ARGS_injectTypeInPartialRoute): string {
	return `"${partialRoute}": ${injectPartialRouteTypeInBody({ generatedType, typeName, partialRoute, withChildren, isAlias })}\n`
}

function injectPartialRouteTypeInBody({
	generatedType,
	typeName,
	withChildren,
	isAlias
}: ARGS_injectTypeInPartialRoute): string {
	const withAlias = `HAQ_children: { ${typeName} : ${generatedType} }\n`
	const withoutAlias = `HAQ_children: { ${typeName}: { ${generatedType}}\n }\n`
	const result = isAlias ? withAlias : withoutAlias
	const HAQ_Children = withChildren ? result : ""
	return `HAQ_DOMElement<
        {
            HAQ_tag: "body"
            HAQ_elType: HAQ_HTMLTagTypes["body"]
            HAQ_attributes: HAQ_AttributesByTag<"body">
            HAQ_matchingSelectors: HAQ_MatchingSelectorsByTag<"body">
            HAQ_styleProperties: HAQ_StylePropertiesByTag<"body">
            ${HAQ_Children}
        }>\n\n`
}
