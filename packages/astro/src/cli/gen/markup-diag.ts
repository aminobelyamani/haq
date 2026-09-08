//#region -------------------------------------------------- Type Imports

import type { ComponentNode, Node, TagLikeNode } from "@astrojs/compiler/types"
import type {
	AstroASTMap,
	AstroComponentsMap,
	Diagnostic,
	GeneratedComponent,
	GeneratedComponentMap,
	SelectorKind,
	SlotList
} from "../_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { is } from "@astrojs/compiler/utils"
import { assertUnreachable } from "@haq/utils"
import { GLOBALS } from "../../globals.js"
import {
	addUniqueSelectorOrThrow,
	canIgnoreUniqueSelector,
	getAttributeByName,
	getIDAttributeValue,
	getPositionRange,
	getXSelectorValue,
	hasChildren,
	isAliasedAppComponentNode
} from "../_shared/astro.js"
import { sameDiagRanges } from "../_shared/diag.js"
import { getFileNameWithoutExtension, getRelativeFilePath } from "../_shared/fs.js"
import { arraysAreEqual } from "../_shared/strings.js"

//#endregion ----------------------------------------------- Module Imports

//------------------------------------------------------------------------------
//
// Local Types
//
//------------------------------------------------------------------------------

type SelObj = {
	sel: string
	kind: SelectorKind
}

type SelectorOccurrence = SelObj & {
	parentPath: string[]
	file: string
	range: Diagnostic["range"]
	webComponentName: string | undefined
	appComponentName: string | undefined
}

type IdSelectorOccurence = {
	sel: string
	file: string
	range: Diagnostic["range"]
}

type InvalidChildOfFragileTagOccurence = {
	tagName: string
	file: string
	range: Diagnostic["range"]
}

type SelDiag = SelObj & {
	fileA: string
	rangeA: Diagnostic["range"]
	fileB: string
	rangeB: Diagnostic["range"]
	parentA: string[]
	parentB: string[]
}

type SlotNameMap = Map<string, { hasValidComponent: boolean }>
type SlottableComponent = {
	componentName: string
	slotNameMap: SlotNameMap
	hasChildTagLikeNode: boolean
}

//------------------------------------------------------------------------------
//
// Markup Diag
//
//------------------------------------------------------------------------------

type ARGS_getMarkupDiagnostics = {
	astroASTMap: AstroASTMap
	componentMap: GeneratedComponentMap
	astroComponentsMap: AstroComponentsMap
	astroFileNames: string[]
	sortedIdentifiers: string[]
}
export function getMarkupDiagnostics(args: ARGS_getMarkupDiagnostics): Diagnostic[] {
	const globalDiagnostics: Diagnostic[] = []

	// Propogate all selectors first before handling unique selectors
	_propagateSelectors()

	for (const astroFile of args.astroFileNames) {
		const isAstroPage = astroFile.match(GLOBALS.REGEX_ASTRO_PAGES_PATH) !== null

		if (!isAstroPage) continue

		const invalidChildOfFragileTagOccurence: InvalidChildOfFragileTagOccurence[] = []

		const componentName = getFileNameWithoutExtension(astroFile)
		const component = args.componentMap.get(componentName)

		const selDiags = _traverseAstroPage({
			astroPage: astroFile,
			filePath: astroFile,
			invalidChildOfFragileTagOccurence,
			ancestorFragileSlotAttrStack: [],
			ancestorFragileTagStack: [],
			ancestorTransitionPersistStack: [],
			selectors: component ? initSelectorsObj(component) : [],
			ancestorSelStack: [getRelativeFilePath(astroFile)],
			webComponentSelectors: [],
			ancestorWebComponentMap: new Map(),
			appComponentSelectors: [],
			ancestorAppComponentMap: new Map(),
			selectorOccurenceMap: new Map(),
			idSelectorOccs: [],
			diagnostics: [],
			ancestorSlottableComponentStack: []
		})

		_processFragileTags(astroFile, invalidChildOfFragileTagOccurence)

		_processComponentSels(astroFile, selDiags)
	}

	return globalDiagnostics

	//* ---------- Helpers -----------------------------------------------

	function _processFragileTags(
		astroFile: string,
		invalidChildOfFragileTagOccurence: InvalidChildOfFragileTagOccurence[]
	): void {
		for (const d of invalidChildOfFragileTagOccurence) {
			const message = `Invalid slot child <${d.tagName}> within the component "${getFileNameWithoutExtension(astroFile)}".\n\n  → ${getRelativeFilePath(d.file)}\n\n  Passing a <${d.tagName}> into another <${d.tagName}> will most likely cause unexpected behavior.`

			globalDiagnostics.push({
				message,
				sourceFile: getRelativeFilePath(astroFile),
				range: d.range
			})
		}
	}

	function _processComponentSels(astroFile: string, selDiags: SelDiag[]): void {
		for (const d of selDiags) {
			const message = `Selector "${d.sel}" (${d.kind}) used in both:\n\n  → ${d.parentA.join(" > ")}\n\n    file: ${getRelativeFilePath(d.fileA)}:${d.rangeA.start.line}:${d.rangeA.start.column}\n\n  → ${d.parentB.join(" > ")}\n\n    file: ${getRelativeFilePath(d.fileB)}:${d.rangeB.start.line}:${d.rangeB.start.column}`

			globalDiagnostics.push({
				message,
				sourceFile: getRelativeFilePath(astroFile),
				range: {
					start: {
						line: 1,
						column: 1,
						offset: 0
					},
					end: {
						line: 1,
						column: 1,
						offset: 0
					}
				}
			})
		}
	}

	function _propagateSelectors(): void {
		for (const identifier of args.sortedIdentifiers) {
			const current = args.componentMap.get(identifier)
			if (!current) continue

			const uniqueSelectors: Set<string> = new Set()
			_populateCurrentSelectors(current, uniqueSelectors)

			for (const refId of current.references) {
				const ref = args.componentMap.get(refId)
				if (!ref) continue

				_populateRefSelectors({ current, ref, uniqueSelectors })
			}
		}
	}

	function _populateCurrentSelectors(current: GeneratedComponent, uniqueSelectors: Set<string>): void {
		if (current.rootSelector && !canIgnoreUniqueSelector(current.rootSelector)) {
			addUniqueSelectorOrThrow({
				filePath: current.filePath,
				identifier: current.rootSelector,
				identifierList: uniqueSelectors
			})
		}
		for (const sel of current.childSelectors) {
			if (canIgnoreUniqueSelector(sel)) continue
			addUniqueSelectorOrThrow({
				filePath: current.filePath,
				identifier: sel,
				identifierList: uniqueSelectors
			})
		}
		for (const sel of current.slotChildSelectors) {
			if (canIgnoreUniqueSelector(sel)) continue
			addUniqueSelectorOrThrow({
				filePath: current.filePath,
				identifier: sel,
				identifierList: uniqueSelectors
			})
		}
	}

	type ARGS__populateRefSelectors = {
		current: GeneratedComponent
		ref: GeneratedComponent
		uniqueSelectors: Set<string>
	}
	function _populateRefSelectors({ current, ref, uniqueSelectors }: ARGS__populateRefSelectors): void {
		if (ref.rootSelector && !canIgnoreUniqueSelector(ref.rootSelector)) {
			addUniqueSelectorOrThrow({
				filePath: current.filePath,
				identifier: ref.rootSelector,
				identifierList: uniqueSelectors,
				ref
			})
			addUniqueSelectorOrThrow({
				filePath: current.filePath,
				identifier: ref.rootSelector,
				identifierList: current.isAlias ? current.slotChildSelectors : current.childSelectors,
				ref
			})
		}

		__populateRefSlotChildSelectors()

		if (ref.isWebComponent) return

		// only add ref child selectors if not webcomponent
		__populateRefChildSelectors()

		//* ---------- Helpers -----------------------------------------------

		function __populateRefSlotChildSelectors(): void {
			for (const sel of ref.slotChildSelectors) {
				if (canIgnoreUniqueSelector(sel)) continue
				addUniqueSelectorOrThrow({
					filePath: current.filePath,
					identifier: sel,
					identifierList: uniqueSelectors,
					ref
				})
				addUniqueSelectorOrThrow({
					filePath: current.filePath,
					identifier: sel,
					identifierList: current.isAlias ? current.slotChildSelectors : current.childSelectors,
					ref
				})
			}
		}

		function __populateRefChildSelectors(): void {
			for (const sel of ref.childSelectors) {
				if (canIgnoreUniqueSelector(sel)) continue
				addUniqueSelectorOrThrow({
					filePath: current.filePath,
					identifier: sel,
					identifierList: uniqueSelectors,
					ref
				})
				addUniqueSelectorOrThrow({
					filePath: current.filePath,
					identifier: sel,
					identifierList: current.isAlias ? current.slotChildSelectors : current.childSelectors,
					ref
				})
			}
		}
	}

	function _addUniqueDiag({ message, range, sourceFile }: Diagnostic): void {
		const existingDiag = globalDiagnostics.find(
			(d) =>
				sameDiagRanges(range, { start: d.range.start, end: d.range.end }) &&
				d.message === message &&
				d.sourceFile === sourceFile
		)
		if (existingDiag) return
		globalDiagnostics.push({ message, range, sourceFile })
	}

	type ARGS__traverseAstroPage = {
		astroPage: string
		filePath: string
		/* fragile tag diag  */
		invalidChildOfFragileTagOccurence: InvalidChildOfFragileTagOccurence[]
		ancestorFragileSlotAttrStack: string[]
		ancestorFragileTagStack: string[]
		/* transition directives diag  */
		ancestorTransitionPersistStack: string[]
		/* unique sel diag  */
		selectors: SelObj[]
		ancestorSelStack: string[]
		webComponentSelectors: SelObj[]
		ancestorWebComponentMap: Map<string, SelObj[]>
		appComponentSelectors: SelObj[]
		ancestorAppComponentMap: Map<string, SelObj[]>
		selectorOccurenceMap: Map<string, SelectorOccurrence[]>
		idSelectorOccs: IdSelectorOccurence[]
		diagnostics: SelDiag[]
		/* x_slot diag  */
		ancestorSlottableComponentStack: SlottableComponent[]
	}

	function _traverseAstroPage({
		astroPage,
		filePath,
		invalidChildOfFragileTagOccurence,
		ancestorFragileSlotAttrStack,
		ancestorFragileTagStack,
		ancestorTransitionPersistStack,
		selectors,
		ancestorSelStack,
		webComponentSelectors,
		ancestorWebComponentMap,
		appComponentSelectors,
		ancestorAppComponentMap,
		selectorOccurenceMap,
		idSelectorOccs,
		diagnostics,
		ancestorSlottableComponentStack
	}: ARGS__traverseAstroPage): SelDiag[] {
		/* fragile tag diag  */
		const fragileSlotAttrStack: string[] = [...ancestorFragileSlotAttrStack]
		const fragileTagStack: string[] = [...ancestorFragileTagStack]
		/* transition directives diag  */
		const transitionPersistStack = [...ancestorTransitionPersistStack]
		/* unique sel diag  */
		const selStack: string[] = [...ancestorSelStack]
		/* x_slot diag  */
		const slottableComponentStack: SlottableComponent[] = [...ancestorSlottableComponentStack]

		const ast = args.astroASTMap.get(filePath)
		if (!ast) return diagnostics

		// Start traversal from root's children
		if (hasChildren(ast)) {
			for (const child of ast.children || []) {
				__traverse(child)
			}
		} else {
			// In case root itself has no children but is a tag (rare), still traverse it
			__traverse(ast)
		}

		return diagnostics

		//* ---------- Helpers -----------------------------------------------

		function __traverse(node: Node): void {
			const isTagLikeNode = is.tag(node)

			/* fragile tag diag  */
			let fragileSlotAttrMatch: string | undefined
			let fragileTagMatch: string | undefined

			/* transition directives diag  */
			let transitionPersistMatch = false

			/* unique sel diag  */
			let match: SelObj | undefined
			let idMatch: string | undefined

			if (isTagLikeNode) {
				___handleFragileSlotAttrMatch(node)
				___handleFragileTagMatch(node)
				___handleTransitionPersistMatch(node)
				___handleSelDiagMatching(node)
				__handleSlottableComponents(node)
			}

			if (is.component(node)) __handleComponentNode(node)

			// Recurse into children of any node (tags, expressions, text, conditionals, etc.)
			if (hasChildren(node)) {
				for (const child of node.children || []) {
					__traverse(child)
				}
			}

			___handleStacks()

			if (is.component(node)) {
				__handleWebComponentLeave(node)
				__handleAppComponentLeave(node)
				__handleSlottableComponentLeave(node)
			}

			//* ---------- Traverse Helpers -----------------------------------------------

			function ___handleStacks(): void {
				// Pop the matches we pushed earlier (if any)

				if (fragileSlotAttrMatch) {
					fragileSlotAttrStack.pop()
				}

				if (fragileTagMatch) {
					fragileTagStack.pop()
				}

				if (transitionPersistMatch) {
					transitionPersistStack.pop()
				}

				if (match) {
					selStack.pop()
				}

				if (idMatch) {
					idSelectorOccs.pop()
				}
			}

			//* ---------- Fragile Tag Diag -----------------------------------------------

			function ___handleFragileSlotAttrMatch(tagLikeNode: TagLikeNode): void {
				fragileSlotAttrMatch = matchesFragileSlotAttribute(tagLikeNode)

				if (fragileSlotAttrMatch) {
					fragileSlotAttrStack.push(fragileSlotAttrMatch)
				}

				if (fragileSlotAttrStack.includes(tagLikeNode.name)) {
					invalidChildOfFragileTagOccurence.push({
						file: filePath,
						tagName: tagLikeNode.name,
						range: getPositionRange({ node: tagLikeNode })
					})
				}
			}

			function ___handleFragileTagMatch(tagLikeNode: TagLikeNode): void {
				fragileTagMatch = GLOBALS.FRAGILE_HTML_TAGS.includes(tagLikeNode.name) ? tagLikeNode.name : undefined

				const currentFragiletStack: string[] = [...fragileTagStack]

				if (fragileTagMatch) {
					fragileTagStack.push(fragileTagMatch)
				}

				if (currentFragiletStack.includes(tagLikeNode.name)) {
					invalidChildOfFragileTagOccurence.push({
						file: filePath,
						tagName: tagLikeNode.name,
						range: getPositionRange({ node: tagLikeNode })
					})
				}
			}

			//* ---------- transition:persist -----------------------------------------------

			function ___handleTransitionPersistMatch(tagLikeNode: TagLikeNode): void {
				if (is.component(tagLikeNode)) return // HAQ check diagnostics will report an error when used on components

				transitionPersistMatch = getAttributeByName(tagLikeNode, "transition:persist") !== undefined

				if (transitionPersistMatch) {
					const prevFileWithTransitionPersist = transitionPersistStack.at(-1)
					if (prevFileWithTransitionPersist) {
						_addUniqueDiag({
							message: `Do not nest "transition:persist" directives. This will likely cause unexpected behavior.\n\n    FILE: ${getRelativeFilePath(filePath)}`,
							sourceFile: getRelativeFilePath(prevFileWithTransitionPersist),
							range: getPositionRange({ node: tagLikeNode })
						})
					}
					transitionPersistStack.push(filePath)
				}
			}

			//* ---------- Unique Sel Diag -----------------------------------------------

			function ___handleSelDiagMatching(tagLikeNode: TagLikeNode): void {
				// --- Check the node itself for selector matches (even components) ---

				match = getMatchingSelectors(tagLikeNode, [...selectors, ...webComponentSelectors, ...appComponentSelectors])

				if (match) __handleSelectorMatch(match, tagLikeNode)

				idMatch = hasIdSelector(tagLikeNode)

				if (idMatch) {
					__handleIdSelectorOccs({
						kind: "ID",
						sel: idMatch,
						file: filePath,
						range: getPositionRange({ node: tagLikeNode })
					})
				}
			}
		}

		//* ---------- Component Traversing -----------------------------------------------

		function __handleComponentNode(componentNode: ComponentNode): void {
			const targetAstroFile = args.astroFileNames.find((f) => f.endsWith(`/${componentNode.name}.astro`))
			if (!targetAstroFile) return

			const componentFromMap = args.componentMap.get(componentNode.name)
			__validateAppComponentDirective(componentNode, componentFromMap)

			_traverseAstroPage({
				astroPage,
				filePath: targetAstroFile,
				invalidChildOfFragileTagOccurence,
				ancestorFragileSlotAttrStack: [...fragileSlotAttrStack],
				ancestorFragileTagStack: [...fragileTagStack],
				ancestorTransitionPersistStack: [...transitionPersistStack],
				selectors,
				ancestorSelStack: [...selStack],
				webComponentSelectors: __getWebComponentSelectors(componentNode.name, componentFromMap),
				ancestorWebComponentMap,
				appComponentSelectors: __getAppComponentSelectors(),
				ancestorAppComponentMap,
				selectorOccurenceMap,
				idSelectorOccs,
				diagnostics,
				ancestorSlottableComponentStack: [...slottableComponentStack]
			})

			slottableComponentStack.push({
				componentName: componentNode.name,
				slotNameMap: new Map(),
				hasChildTagLikeNode: false
			})
		}

		//* ---------- Slottable Components -----------------------------------------------

		function __handleSlottableComponents(tagLikeNode: TagLikeNode): void {
			__initSlotNameMap(tagLikeNode)
			__validateAllParentSlottedComponents(tagLikeNode)
		}

		function __initSlotNameMap(tagLikeNode: TagLikeNode): void {
			const prevSlottableComponent = slottableComponentStack.at(-1)
			if (!prevSlottableComponent) return

			const prevSlottableComponentSlotList = args.astroComponentsMap.get(prevSlottableComponent.componentName) ?? []

			prevSlottableComponent.hasChildTagLikeNode = true

			const slotAttribute = getAttributeByName(tagLikeNode, "slot")
			const currentSlotName = slotAttribute ? slotAttribute.value : GLOBALS.ASTRO_DEFAULT_SLOT_NAME
			const validSlot = prevSlottableComponentSlotList.find((s) => s.slotName === currentSlotName)

			if (validSlot && !prevSlottableComponent.slotNameMap.has(currentSlotName)) {
				prevSlottableComponent.slotNameMap.set(currentSlotName, { hasValidComponent: false })
			}
		}

		function __validateAllParentSlottedComponents(tagLikeNode: TagLikeNode): void {
			for (const slottableComponent of slottableComponentStack) {
				const prevSlottableComponentSlotList = args.astroComponentsMap.get(slottableComponent.componentName) ?? []
				__validateSlottedComponent(tagLikeNode, slottableComponent, prevSlottableComponentSlotList)
			}
		}

		function __validateSlottedComponent(
			tagLikeNode: TagLikeNode,
			slottableComponent: SlottableComponent,
			slotList: SlotList[]
		): void {
			for (const [slotName, _value] of slottableComponent.slotNameMap.entries()) {
				const parentSlot = slotList.find((s) => s.slotName === slotName)

				const hasComponent = parentSlot?.componentNames.includes(tagLikeNode.name)
				if (!hasComponent) continue

				slottableComponent.slotNameMap.set(slotName, { hasValidComponent: true })
			}
		}

		function __handleSlottableComponentLeave(componentNode: ComponentNode): void {
			const prevSlottableComponent = slottableComponentStack.at(-1)
			if (!prevSlottableComponent) return

			const slotList = args.astroComponentsMap.get(prevSlottableComponent.componentName) ?? []

			if (slotList.length === 0 && prevSlottableComponent.hasChildTagLikeNode) {
				___expectNoSlot()
			}

			const requiredSlots = slotList.filter((slot) => slot.required)

			__handleRequiredSlots(prevSlottableComponent)

			slottableComponentStack.pop()

			function ___expectNoSlot(): void {
				_addUniqueDiag({
					sourceFile: filePath,
					message: `"${componentNode.name}" does not accept any slot children.`,
					range: getPositionRange({
						node: componentNode,
						startOffset: 1, // we want to start after the opening tag character '<'
						endOffset: componentNode.name.length
					})
				})
			}

			function __handleRequiredSlots(slottableComponent: SlottableComponent): void {
				for (const slot of requiredSlots) {
					const foundMapRecord = slottableComponent.slotNameMap.get(slot.slotName)
					if (!foundMapRecord) {
						_addUniqueDiag({
							sourceFile: filePath,
							message: `Component "${componentNode.name}" is missing a required slot with name "${slot.slotName}".`,
							range: getPositionRange({
								node: componentNode,
								startOffset: 1, // we want to start after the opening tag character '<'
								endOffset: componentNode.name.length
							})
						})
					} else if (slot.componentNames.length > 0 && !foundMapRecord.hasValidComponent) {
						_addUniqueDiag({
							sourceFile: filePath,

							message: `"${componentNode.name}" must have at least one of the following slot children: ${slot.componentNames.map((c) => `"${c}"`).join(GLOBALS.PIPE_CHAR)}.`,
							range: getPositionRange({
								node: componentNode,
								startOffset: 1, // we want to start after the opening tag character '<'
								endOffset: componentNode.name.length
							})
						})
					}
				}
			}
		}

		//* ---------- Unique Sel Diag -----------------------------------------------

		function __validateAppComponentDirective(
			componentNode: ComponentNode,
			componentFromMap: GeneratedComponent | undefined
		): void {
			if (!(isAliasedAppComponentNode(componentNode) && is.component(componentNode))) return
			if (!componentFromMap) {
				__addDiag(componentNode)
				return
			}
			const componentSelectors = initSelectorsObj(componentFromMap)
			ancestorAppComponentMap.set(componentNode.name, [...componentSelectors])

			if (!componentSelectors.some((s) => s.kind === "ID")) __addDiag(componentNode)
		}

		function __addDiag(componentNode: ComponentNode): void {
			_addUniqueDiag({
				message: `Invalid "x_appc" directive for component: "${componentNode.name}". Make sure to add an "id" directive for the aliased component.`,
				sourceFile: getRelativeFilePath(filePath),
				range: getPositionRange({ node: componentNode })
			})
		}

		function __getWebComponentSelectors(
			nodeName: string | undefined,
			componentFromMap: GeneratedComponent | undefined
		): SelObj[] {
			if (nodeName && componentFromMap?.isWebComponent) {
				const componentSelectors = initSelectorsObj(componentFromMap)
				ancestorWebComponentMap.set(nodeName, [...componentSelectors])
			}

			const currentWebComponentSelectors: SelObj[] = []
			for (const [_componentName, sels] of ancestorWebComponentMap.entries()) {
				currentWebComponentSelectors.push(...sels)
			}

			return currentWebComponentSelectors
		}

		function __getAppComponentSelectors(): SelObj[] {
			const currentAppComponentSelectors: SelObj[] = []
			for (const [_componentName, sels] of ancestorAppComponentMap.entries()) {
				currentAppComponentSelectors.push(...sels)
			}

			return currentAppComponentSelectors
		}

		function __handleWebComponentLeave(componentNode: ComponentNode): void {
			if (!args.componentMap.get(componentNode.name)?.isWebComponent) return

			webComponentSelectors = []

			for (const [componentName, sels] of ancestorWebComponentMap.entries()) {
				// update Web Component selectors, without current one, since it is already processed
				if (componentName !== componentNode.name) webComponentSelectors.push(...sels)

				// remove matches from current component
				__removeWebComponentOccs(componentNode, sels)
			}

			ancestorWebComponentMap.delete(componentNode.name)
		}

		function __handleAppComponentLeave(componentNode: ComponentNode): void {
			if (!isAliasedAppComponentNode(componentNode)) return

			appComponentSelectors = []

			for (const [componentName, sels] of ancestorAppComponentMap.entries()) {
				// update App Component selectors, without current one, since it is already processed
				if (componentName !== componentNode.name) appComponentSelectors.push(...sels)

				// remove matches from current component
				__removeAppComponentOccs(componentNode, sels)
			}

			ancestorAppComponentMap.delete(componentNode.name)
		}

		function __handleSelectorMatch(match: SelObj, tagLikeNode: TagLikeNode): void {
			// Push the matched selector onto the stack
			selStack.push(match.sel)

			// parentPath is everything before this match (its direct ancestry)
			const parentPath = [...selStack.slice(0, -1)]

			const key = `${match.kind}:${match.sel}`
			const occs = selectorOccurenceMap.get(key) ?? []

			const parentPathsAreDifferent = occs.some((o) => {
				// same parent scope — safe
				if (arraysAreEqual(o.parentPath, parentPath)) return false

				return true
			})

			const lastOccurence = occs.at(-1)
			if (lastOccurence && parentPathsAreDifferent) {
				__addDuplicate({
					sel: match.sel,
					kind: match.kind,
					fileA: lastOccurence.file,
					rangeA: lastOccurence.range,
					fileB: filePath,
					rangeB: getPositionRange({ node: tagLikeNode }),
					parentA: lastOccurence.parentPath,
					parentB: parentPath
				})
			}

			// Track globally

			occs.push({
				kind: match.kind,
				sel: match.sel,
				parentPath,
				file: filePath,
				range: getPositionRange({ node: tagLikeNode }),
				webComponentName: __getMatchedWebComponentName(match),
				appComponentName: __getMatchedAppComponentName(match)
			})

			selectorOccurenceMap.set(key, occs)
		}

		function __getMatchedWebComponentName(match: SelObj): string | undefined {
			for (const [componentName, sels] of ancestorWebComponentMap.entries()) {
				if (sels.some((c) => c.kind === match.kind && c.sel === match.sel)) return componentName
			}
		}

		function __getMatchedAppComponentName(match: SelObj): string | undefined {
			for (const [componentName, sels] of ancestorAppComponentMap.entries()) {
				if (sels.some((c) => c.kind === match.kind && c.sel === match.sel)) return componentName
			}
		}

		function __removeWebComponentOccs(componentNode: ComponentNode, sels: SelObj[]): void {
			for (const sel of sels) {
				const key = `${sel.kind}:${sel.sel}`
				const occs = selectorOccurenceMap.get(key) ?? []
				const newOccs = occs.filter((occ) => occ.webComponentName !== componentNode.name)
				selectorOccurenceMap.set(key, newOccs)
			}
		}

		function __removeAppComponentOccs(componentNode: ComponentNode, sels: SelObj[]): void {
			for (const sel of sels) {
				const key = `${sel.kind}:${sel.sel}`
				const occs = selectorOccurenceMap.get(key) ?? []
				const newOccs = occs.filter((occ) => occ.appComponentName !== componentNode.name)
				selectorOccurenceMap.set(key, newOccs)
			}
		}

		function __addDuplicate(data: SelDiag): void {
			const exists = diagnostics.find((d) => d.sel === data.sel && d.kind === data.kind)
			if (exists) return
			diagnostics.push(data)
		}

		function __handleIdSelectorOccs({
			kind,
			...rest
		}: Pick<SelectorOccurrence, "kind" | "file" | "sel" | "range">): void {
			if (kind !== "ID") return

			idSelectorOccs.push(rest)
			if (idSelectorOccs.length > 1) {
				let messageDetails = ""
				const range: Diagnostic["range"] = {
					start: { column: 1, line: 1, offset: 0 },
					end: { column: 1, line: 1, offset: 0 }
				}

				for (const d of idSelectorOccs) {
					messageDetails += `  → Id Selector "${d.sel}" used in:\n\n    file: ${getRelativeFilePath(d.file)}:${d.range.start.line}:${d.range.start.column}\n\n`
				}
				const message = `Id Selector used ${idSelectorOccs.length} times.\n\n${messageDetails.trimEnd()}`

				globalDiagnostics.push({
					message,
					sourceFile: getRelativeFilePath(astroPage),
					range
				})
			}
		}
	}
}

function initSelectorsObj(component: GeneratedComponent, withoutRoot?: true): SelObj[] {
	const array: SelObj[] = []
	const allSelectors = [...Array.from(component.childSelectors), ...Array.from(component.slotChildSelectors)]
	if (component.rootSelector && !canIgnoreUniqueSelector(component.rootSelector) && !withoutRoot)
		allSelectors.push(component.rootSelector)

	for (const selector of allSelectors) {
		const sanitizedSelector = selector.replaceAll('"', "")
		array.push({
			sel: sanitizedSelector,
			kind: getSelectorKind(sanitizedSelector)
		})
	}
	return array
}

function getSelectorKind(sel: string): SelectorKind {
	if (isIdSel(sel)) return "ID"
	if (isAttrSel(sel)) return "HAQ_SEL_ATTR"
	return "TAG"
}

function isIdSel(sel: string): boolean {
	return sel.startsWith("#")
}

function isAttrSel(sel: string): boolean {
	return sel.startsWith("[x_sel=")
}

// --- Helper: extract matching selectors from a node ---
function getMatchingSelectors(tagLikeNode: TagLikeNode, selectors: SelObj[]): SelObj | undefined {
	for (const selObj of selectors) {
		switch (selObj.kind) {
			case "ID": {
				const matches = matchesIdSelector(tagLikeNode, selObj)
				if (matches) return selObj
				break
			}

			case "HAQ_SEL_ATTR": {
				const matches = matchesAttrSelector(tagLikeNode, selObj)
				if (matches) return selObj
				break
			}

			case "TAG": {
				const matches = matchesTagSelector(tagLikeNode, selObj)
				if (matches) return selObj
				break
			}
			case "HAQ_DYN_SEL_ATTR": {
				return
			}
			default:
				assertUnreachable(selObj.kind)
		}
	}
}

function matchesIdSelector(tagLikeNode: TagLikeNode, selObj: SelObj): boolean {
	const idAttr = getAttributeByName(tagLikeNode, "id")
	if (idAttr && idAttr.value === selObj.sel.replace("#", "")) return true
	return false
}

function hasIdSelector(tagLikeNode: TagLikeNode): string | undefined {
	const idAttributeValue = getIDAttributeValue(tagLikeNode)
	if (!idAttributeValue) return
	return `#${idAttributeValue}`
}

function matchesAttrSelector(tagLikeNode: TagLikeNode, selObj: SelObj): boolean {
	const attrVal = getXSelectorValue(tagLikeNode)
	if (attrVal && selObj.sel === `[x_sel='${attrVal}']`) return true
	return false
}

function matchesTagSelector(tagLikeNode: TagLikeNode, selObj: SelObj): boolean {
	if (tagLikeNode.name === selObj.sel) return true
	return false
}

function matchesFragileSlotAttribute(tagLikeNode: TagLikeNode): string | undefined {
	const slotAttribute = getAttributeByName(tagLikeNode, "slot")
	if (slotAttribute?.kind !== "quoted") return

	const regex = new RegExp(`(${GLOBALS.FRAGILE_HTML_TAGS.join("|")}):.*`)
	const match = slotAttribute.value.match(regex)

	if (!match) return

	return match[1]
}
