//#region -------------------------------------------------- Type Imports

import type { CommentNode, FrontmatterNode, Node, TagLikeNode } from "@astrojs/compiler/types"
import type { TypedExtract } from "@haq/utils/types"
import type { MarkupDirective } from "../../globals.js"
import type { AstroComponentsMap, Diagnostic, I_AstroAttributeNode, JSON_Lists, SlotList } from "../_shared/types.js"
import type { CustomElementsMap } from "../_shared/validation.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { parse } from "@astrojs/compiler"
import { is } from "@astrojs/compiler/utils"
import { GLOBALS } from "../../globals.js"
import {
	getAttributeByName,
	getAttributes,
	getPositionRange,
	hasChildren,
	hasHAQDirective,
	isCustomTagNode,
	isDynamicAttribute,
	isFragmentNode,
	isSlotNode
} from "../_shared/astro.js"
import { getRelativeFilePath, getRouteFromAstroPage } from "../_shared/fs.js"
import {
	generateArrayFromSpaceSeparatedList,
	generateUnionFromArray,
	getArrayFromStringifiedArray,
	getClassesFromClassListValues,
	getDuplicateArrayItem
} from "../_shared/strings.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_getAstroDiagnostics = {
	document: string
	filePath: string
	lists: JSON_Lists
	customElementsMap: CustomElementsMap
	astroComponentsMap: AstroComponentsMap
}

/*******************************************************************************
 *
 * Function that gets diagnostics for a given Astro file.
 *
 ******************************************************************************/

export async function getAstroDiagnostics({
	document,
	lists,
	filePath,
	customElementsMap,
	astroComponentsMap
}: ARGS_getAstroDiagnostics): Promise<Diagnostic[]> {
	const sourceFile = getRelativeFilePath(filePath)

	const ASTRO_PAGE_ROUTE = getRouteFromAstroPage(filePath)

	let HAS_FRONT_MATTER = false

	const globalAttributes = customElementsMap.get("abbr")?.attrs?.map((a) => a.name) || [] // we use this tag to get the HTMLAttributes that are inherited by all elements
	const diagnostics: Diagnostic[] = []

	const haqDirective: MarkupDirective = "x_haq"
	const webcDirective: MarkupDirective = "x_webc"
	const aliasDirective: MarkupDirective = "x_alias"
	const slotDirective: MarkupDirective = "x_slot"

	const ignoreDirectiveStack: { node: CommentNode; wasUsed: boolean }[] = []

	let tagVisitedCount = 0

	const parseResult = await parse(document, { position: true })
	_walkAST(parseResult.ast)

	if (!(HAS_FRONT_MATTER || ASTRO_PAGE_ROUTE)) {
		_addDiagnostic({
			message: `Missing frontmatter. Astro allows any props to be passed when no frontmatter is present. Use "type Props = Record<never, never>" if you expect no props to be passed.`,
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

	return diagnostics

	//* ---------- Helpers -----------------------------------------------

	type Matches = {
		fragileTagMatch: boolean
		componentWithSlotAttrMatch: boolean
		slotMatch: boolean
		aliasedComponentMatch: boolean
	}

	function _walkAST(root: Node): void {
		const parentFragileTagStack: string[] = []
		const parentComponentWithSlotAttrStack: string[] = []
		const parentSlotStack: boolean[] = []
		const parentAliasedComponentStack: string[] = []

		__visitNode(root)
		__checkUnusedIgnoreDirectives()

		//* ---------- Helpers -----------------------------------------------

		function __visitNode(node: Node): void {
			const matches: Matches = {
				fragileTagMatch: false,
				componentWithSlotAttrMatch: false,
				slotMatch: false,
				aliasedComponentMatch: false
			}

			switch (node.type) {
				case "comment": {
					__handleCommentNode(node)
					break
				}

				case "frontmatter": {
					_handleFrontMatter(node)
					break
				}

				default:
			}

			if (is.tag(node)) {
				tagVisitedCount++
				_handleTagNode({
					tagLikeNode: node,
					matches,
					parentAliasedComponentStack,
					parentComponentWithSlotAttrStack,
					parentFragileTagStack,
					parentSlotStack
				})
			}

			if (hasChildren(node)) {
				for (const child of node.children || []) {
					__visitNode(child)
				}
			}

			__handleFragileTagStack(matches.fragileTagMatch)
			__handleFragileFragmentStack(matches.componentWithSlotAttrMatch)
			__handleSlotStack(matches.slotMatch)
			__handleAliasedComponentStack(matches.aliasedComponentMatch)
		}

		function __handleCommentNode(componentNode: CommentNode): void {
			if (componentNode.value.trim().toLowerCase() === GLOBALS.HAQ_CHECK_IGNORE_DIRECTIVE) {
				ignoreDirectiveStack.push({ node: componentNode, wasUsed: false })
			}
		}

		function __checkUnusedIgnoreDirectives(): void {
			for (const obj of ignoreDirectiveStack) {
				if (obj.wasUsed) continue
				_addDiagnostic({
					message:
						"Suppression comment has no effect. Remove the suppression or make sure you are suppressing the correct error.",
					range: getPositionRange({ node: obj.node, endOffset: obj.node.value.length })
				})
			}
		}

		function __handleFragileTagStack(fragileTagMatch: boolean): void {
			if (fragileTagMatch) parentFragileTagStack.pop()
		}

		function __handleFragileFragmentStack(componentWithSlotAttrMatch: boolean): void {
			if (componentWithSlotAttrMatch) parentComponentWithSlotAttrStack.pop()
		}

		function __handleSlotStack(slotMatch: boolean): void {
			if (slotMatch) parentSlotStack.pop()
		}

		function __handleAliasedComponentStack(aliasedComponentMatch: boolean): void {
			if (aliasedComponentMatch) parentAliasedComponentStack.pop()
		}
	}

	//* ---------- Tag Node -----------------------------------------------

	type ARGS__handleTagNode = {
		tagLikeNode: TagLikeNode
		matches: Matches
		parentFragileTagStack: string[]
		parentComponentWithSlotAttrStack: string[]
		parentSlotStack: boolean[]
		parentAliasedComponentStack: string[]
	}
	function _handleTagNode({
		tagLikeNode,
		matches,
		parentAliasedComponentStack,
		parentComponentWithSlotAttrStack,
		parentFragileTagStack,
		parentSlotStack
	}: ARGS__handleTagNode): void {
		_handleSlotName(tagLikeNode, parentAliasedComponentStack)

		matches.slotMatch = _handleSlotMatch(tagLikeNode, parentSlotStack)
		matches.fragileTagMatch = _handleFragileTagSlot(tagLikeNode, parentFragileTagStack)
		matches.componentWithSlotAttrMatch = _handleComponentWithSlotAttrMatch(
			tagLikeNode,
			parentComponentWithSlotAttrStack
		)

		if (is.component(tagLikeNode)) {
			matches.aliasedComponentMatch = true
			parentAliasedComponentStack.push(tagLikeNode.name)
		}

		_handleSpreadAttribute(tagLikeNode)
		_handleAttributeName(tagLikeNode)
		_handleHAQDirectives(tagLikeNode)
		_handleAstroBuiltInAttributes(tagLikeNode)

		_handleClassDiagnostics({
			tagLikeNode,
			attributeName: "class",
			directiveOffset: GLOBALS.CLASS_ATTRIBUTE_OFFSET
		})
		_handleClassDiagnostics({
			tagLikeNode,
			attributeName: "x_class_list",
			directiveOffset: GLOBALS.X_CLASS_LIST_DIRECTIVE_OFFSET
		})
		_handleClassListDiagnostics(tagLikeNode)

		_handleAliasDirectiveDiagnostics(tagLikeNode)

		_handleXSlotDirectiveDiagnostics(tagLikeNode)
		_handleXAttrDirective(tagLikeNode)
		_handleXEvTypesDirective(tagLikeNode)

		_getTagNameDiagnostics(tagLikeNode)
		_handleDashedAttributeDiagnostics(tagLikeNode)
		_handleSlotNames(tagLikeNode)
	}
	//* ---------- frontmatter Diagnostics -----------------------------------------------

	function _handleFrontMatter(frontMaterNode: FrontmatterNode): void {
		HAS_FRONT_MATTER = true
		// first split frontmatter into new lines

		const lines = frontMaterNode.value.split("\n")

		let propsMatch = false

		for (const [index, line] of lines.entries()) {
			// ignore comments
			if (line.trim().startsWith("//")) continue

			__handleAstroComponentImportMatches(line, index)

			if (!propsMatch) {
				propsMatch = line.match(GLOBALS.REGEX_ASTRO_PROPS_DECLARATION) !== null
			}

			// ignore Astro files that are not inside the /pages directory

			if (!ASTRO_PAGE_ROUTE) continue

			__handleRouteDeclarationMatches(line, index)

			__handleAstroLocalsKey(line, index)
		}

		if (!(propsMatch || ASTRO_PAGE_ROUTE)) {
			_addDiagnostic({
				message: `Missing "Props" type or interface in frontmatter.`,
				range: getPositionRange({
					node: frontMaterNode
				})
			})
		}

		//* ---------- Helpers -----------------------------------------------

		function __handleAstroComponentImportMatches(line: string, lineNum: number): void {
			const matches = line.match(GLOBALS.REGEX_ASTRO_COMPONENT_IMPORT)
			if (!matches) return

			const defaultImport = matches[1]
			const fileNameWithoutExtension = matches[2]
			if (!(defaultImport && fileNameWithoutExtension)) return

			if (defaultImport === fileNameWithoutExtension) return

			_addDiagnostic({
				message: `The default import "${defaultImport}" doesn't match the imported file name "${fileNameWithoutExtension}.astro".`,
				range: {
					start: {
						line: lineNum + 1,
						column: line.indexOf(defaultImport) + 1,
						offset: 0
					},
					end: {
						line: lineNum + 1,
						column: line.indexOf(defaultImport) + defaultImport.length + 1,
						offset: 0
					}
				}
			})
		}

		function __handleRouteDeclarationMatches(line: string, lineNum: number): void {
			const haqRouteMatch = line.match(GLOBALS.REGEX_HAQ_ROUTE_DECLARATION)?.[1]

			if (!haqRouteMatch) return

			if (haqRouteMatch === ASTRO_PAGE_ROUTE) return

			_addDiagnostic({
				message: `${GLOBALS.HAQ_ROUTE_VAR_NAME} doesn't match the current file. Expected "${ASTRO_PAGE_ROUTE}".`,
				range: {
					start: {
						line: lineNum + 1,
						column: line.indexOf(haqRouteMatch),
						offset: 0
					},
					end: {
						line: lineNum + 1,
						column: line.indexOf(haqRouteMatch) + haqRouteMatch.length + 2,
						offset: 0
					}
				}
			})
		}

		function __handleAstroLocalsKey(line: string, lineNum: number): void {
			const astroLocalsMatch = line.match(GLOBALS.REGEX_ASTRO_LOCALS_DECLARATION)?.[1]

			if (!astroLocalsMatch) return

			if (
				astroLocalsMatch.replaceAll(`"`, "").replaceAll(`'`, "") === ASTRO_PAGE_ROUTE ||
				astroLocalsMatch === GLOBALS.HAQ_ROUTE_VAR_NAME
			)
				return

			_addDiagnostic({
				message: `Astro.locals route doesn't match the current file. Expected "${ASTRO_PAGE_ROUTE}".`,
				range: {
					start: {
						line: lineNum + 1,
						column: line.indexOf(astroLocalsMatch) + 1,
						offset: 0
					},
					end: {
						line: lineNum + 1,
						column: line.indexOf(astroLocalsMatch) + astroLocalsMatch.length + 1,
						offset: 0
					}
				}
			})
		}
	}

	//* ---------- Attribute Name Diagnostics -----------------------------------------------

	function _handleAttributeName(tagLikeNode: TagLikeNode): void {
		const attributes = getAttributes(tagLikeNode)
		const attributesInTag: Set<string> = new Set()

		for (const attribute of attributes) {
			if (attributesInTag.has(attribute.name)) {
				_addDiagnostic({
					message: `Duplicate attribute "${attribute.name}".`,
					range: getPositionRange({
						node: attribute
					})
				})
			}
			attributesInTag.add(attribute.name)
		}
	}

	//* ---------- HAQ Directives Diagnostics -----------------------------------------------

	function _handleHAQDirectives(tagLikeNode: TagLikeNode): void {
		// build attribute lookup
		const attrMap = new Map(getAttributes(tagLikeNode).map((a) => [a.name, a]))

		// simple helpers to reduce noise when handlers need extra args
		type HandlerArgs = {
			attribute: I_AstroAttributeNode
			directive: MarkupDirective
			endOffset: number
		}
		type DirectiveHandler = (args: HandlerArgs) => void
		const _callHandler = (name: MarkupDirective, handler: DirectiveHandler, endOffset?: number): void => {
			const attr = attrMap.get(name)
			if (attr) handler({ attribute: attr, directive: name, endOffset: endOffset ?? 0 })
		}

		_callHandler("x_haq", __handleHaq)
		_callHandler("x_webc", __handleWebc)
		_callHandler("x_appc", __handleAppc)
		_callHandler("x_alias", __handleAlias)
		_callHandler("x_slot", __handleSlot)
		_callHandler("x_sel", __handle_Sel_InputValues_Child, GLOBALS.X_SEL_DIRECTIVE_CHAR_LENGTH)
		_callHandler("x_ev_types", __handle_EvTypes_DynSel_ClassList, GLOBALS.X_EV_TYPES_DIRECTIVE_CHAR_LENGTH)
		_callHandler("x_attr_values", __handleAttrValues, GLOBALS.X_ATTR_VALUES_DIRECTIVE_CHAR_LENGTH)
		_callHandler("x_input_values", __handle_Sel_InputValues_Child, GLOBALS.X_INPUT_VALUES_DIRECTIVE_CHAR_LENGTH)
		_callHandler("x_dyn_sel", __handle_EvTypes_DynSel_ClassList, GLOBALS.X_DYN_SEL_DIRECTIVE_CHAR_LENGTH)
		_callHandler("x_class_list", __handle_EvTypes_DynSel_ClassList, GLOBALS.CLASS_ATTRIBUTE_OFFSET - 1)
		_callHandler("x_page", __handle_Xpage)

		_callHandler("x_slot", __handleNonQuotedAttribute)
		_callHandler("x_dyn_sel", __handleNonQuotedAttribute)
		_callHandler("x_class_list", __handleNonQuotedAttribute)
		_callHandler("x_attr_values", __handleNonQuotedAttribute)

		//* ---------- Helpers -----------------------------------------------

		function __handleHaq({ attribute, directive }: HandlerArgs): void {
			if (is.component(tagLikeNode) || isSlotNode(tagLikeNode)) {
				_addDiagnostic({
					message: `You can only use the "${directive}" directive with native or custom-elements.`,
					range: getPositionRange({
						node: attribute,
						endOffset: GLOBALS.X_HAQ_DIRECTIVE_CHAR_LENGTH
					})
				})
				return
			}

			if (attrMap.get("x_webc")) {
				_addDiagnostic({
					message: `You can either use the "${directive}" or "${webcDirective}" directive, not both.`,
					range: getPositionRange({
						node: attribute,
						endOffset: GLOBALS.X_HAQ_DIRECTIVE_CHAR_LENGTH
					})
				})
			}
		}

		function __handleWebc({ attribute, directive }: HandlerArgs): void {
			if (isCustomTagNode(tagLikeNode)) return

			_addDiagnostic({
				message: `You can only use the "${directive}" directive with custom-elements.`,
				range: getPositionRange({
					node: attribute,
					endOffset: GLOBALS.X_WEBC_DIRECTIVE_CHAR_LENGTH
				})
			})
		}

		function __handleAppc({ attribute, directive }: HandlerArgs): void {
			if (is.component(tagLikeNode)) return

			_addDiagnostic({
				message: `You can only use the "${directive}" directive on aliased components inside your /pages folder.`,
				range: getPositionRange({
					node: attribute,
					endOffset: GLOBALS.X_APPC_DIRECTIVE_CHAR_LENGTH
				})
			})
		}

		function __handleAlias({ attribute, directive }: HandlerArgs): void {
			if (is.component(tagLikeNode)) return

			_addDiagnostic({
				message: `You can only use the "${directive}" directive on aliased components.`,
				range: getPositionRange({
					node: attribute,
					endOffset: GLOBALS.X_ALIAS_DIRECTIVE_CHAR_LENGTH
				})
			})
		}

		function __handleSlot({ attribute, directive }: HandlerArgs): void {
			if (isSlotNode(tagLikeNode)) return

			_addDiagnostic({
				message: `You can only use the "${directive}" directive on slot elements.`,
				range: getPositionRange({
					node: attribute,
					endOffset: GLOBALS.X_SLOT_DIRECTIVE_CHAR_LENGTH
				})
			})
		}

		function __handle_Sel_InputValues_Child({ attribute, directive, endOffset }: HandlerArgs): void {
			if (isSlotNode(tagLikeNode)) {
				_addDiagnostic({
					message: `You can not use the "${directive}" directive on slot elements.`,
					range: getPositionRange({
						node: attribute,
						endOffset
					})
				})
				return
			}
			if (attrMap.get("x_input_values")) return

			if (!(attrMap.get("x_haq") || attrMap.get("x_webc") || attrMap.get("x_alias"))) {
				_addDiagnostic({
					message: `Missing one of the following directives: "${haqDirective}" | "${webcDirective}" | "${aliasDirective}"`,
					range: getPositionRange({
						node: attribute,
						endOffset
					})
				})
			}
		}

		function __handleAttrValues({ attribute, directive, endOffset }: HandlerArgs): void {
			if (isSlotNode(tagLikeNode)) {
				_addDiagnostic({
					message: `You can not use the "${directive}" directive on slot elements.`,
					range: getPositionRange({
						node: attribute,
						endOffset
					})
				})
				return
			}

			if (attrMap.get("x_webc") || (attrMap.get("id") && attrMap.get("id")?.kind === "quoted")) return

			_addDiagnostic({
				message: `Missing one of the following directives:  "${webcDirective}" | "id". Should only use on top level Web Components or App Components.`,
				range: getPositionRange({
					node: attribute,
					endOffset
				})
			})
		}

		function __handle_EvTypes_DynSel_ClassList({ attribute, directive, endOffset }: HandlerArgs): void {
			if (is.component(tagLikeNode) || isSlotNode(tagLikeNode)) {
				_addDiagnostic({
					message: `You can only use the "${directive}" directive with native or custom-elements.`,
					range: getPositionRange({
						node: attribute,
						endOffset
					})
				})
				return
			}

			if (!(attrMap.get("x_haq") || attrMap.get("x_webc"))) {
				_addDiagnostic({
					message: `Missing one of the following directives: "${haqDirective}" | "${webcDirective}"`,
					range: getPositionRange({
						node: attribute,
						endOffset
					})
				})
			}
		}

		function __handle_Xpage({ attribute, directive }: HandlerArgs): void {
			const value = attribute.value
			if (!ASTRO_PAGE_ROUTE && value) {
				_addDiagnostic({
					message: `Do not use any value for "${directive}" outisde of the pages directory. You can pass it as a prop instead.`,
					range: getPositionRange({
						node: attribute,
						endOffset: GLOBALS.X_PAGE_DIRECTIVE_CHAR_LENGTH
					})
				})

				return // ignore use of x_page directive ouside of pages folder, for example in a scaffold/layout page that includes the html tag
			}

			if (!value) return

			if (value === ASTRO_PAGE_ROUTE || value === GLOBALS.HAQ_ROUTE_VAR_NAME) return

			_addDiagnostic({
				message: `"${value}" doesn't match the current file. Expected "${ASTRO_PAGE_ROUTE}".`,
				range: getPositionRange({
					node: attribute,
					endOffset: GLOBALS.X_PAGE_DIRECTIVE_CHAR_LENGTH
				})
			})
		}

		function __handleNonQuotedAttribute({ attribute, directive, endOffset }: HandlerArgs): void {
			if (!isDynamicAttribute(attribute) || attribute.kind === "empty") return

			_addDiagnostic({
				message: `Avoid using dynamic values on "${directive}" attributes. Use quoted values instead.`,
				range: getPositionRange({
					node: attribute,
					endOffset
				})
			})
		}
	}

	//* ---------- class/class:list Diagnostics -----------------------------------------------

	type ClassDirectives = Extract<I_AstroAttributeNode["name"], "class" | "x_class_list" | "class:list">

	type ARGS__handleClassDiagnostics = {
		tagLikeNode: TagLikeNode
		attributeName: ClassDirectives
		directiveOffset: number
	}

	function _handleClassDiagnostics({
		attributeName,
		tagLikeNode,
		directiveOffset
	}: ARGS__handleClassDiagnostics): void {
		const classAttribute = getAttributeByName(tagLikeNode, attributeName)
		if (!classAttribute) return

		const match = isDynamicAttribute(classAttribute)
			? classAttribute.value?.match(GLOBALS.REGEX_ASTRO_CSS_CLASSNAMES)
			: classAttribute.raw?.match(GLOBALS.REGEX_ASTRO_CSS_CLASSNAMES)

		const rawClasses = match?.[1]

		if (!rawClasses) return

		const classesOnAttribute = generateArrayFromSpaceSeparatedList(rawClasses)

		_processClassValues({
			classAttribute,
			classesOnAttribute,
			directiveOffset,
			directive: "class"
		})
	}

	type ARGS__processClassValues = {
		classesOnAttribute: string[]
		classAttribute: I_AstroAttributeNode
		directiveOffset: number
		directive: "class" | "class:list"
	}

	function _processClassValues({
		classesOnAttribute,
		classAttribute,
		directiveOffset,
		directive
	}: ARGS__processClassValues): void {
		const invalidClasses: string[] = []
		for (const cl of classesOnAttribute) {
			if (!lists.classNames.includes(cl)) invalidClasses.push(cl)
		}
		_showClassDiagnostics({ invalidClasses, classAttribute, directive, directiveOffset })

		const duplicateValue = getDuplicateArrayItem(classesOnAttribute)
		if (!duplicateValue) return

		_showRedundantValueDiagnostic({
			attribute: classAttribute,
			directiveOffset,
			duplicateValue,
			valueType: directive
		})
	}

	type ARGS__showClassDiagnostics = {
		invalidClasses: string[]
		classAttribute: I_AstroAttributeNode
		directiveOffset: number
		directive: "class" | "class:list"
	}

	function _showClassDiagnostics({
		invalidClasses,
		classAttribute,
		directive,
		directiveOffset
	}: ARGS__showClassDiagnostics): void {
		for (const invalidClass of invalidClasses) {
			const indexOfClass = classAttribute.value.indexOf(invalidClass)
			_addDiagnostic({
				message: `Invalid class "${invalidClass}". Define "${invalidClass}" in your global css folder.`,
				range: getPositionRange({
					node: classAttribute,
					startOffset: directive === "class" ? directiveOffset + indexOfClass : 0,
					endOffset: directive === "class" ? invalidClass.length : directiveOffset
				})
			})
		}
	}

	function _handleClassListDiagnostics(tagLikeNode: TagLikeNode): void {
		const classAttribute = getAttributeByName(tagLikeNode, "class:list")
		if (!classAttribute) return

		let value = classAttribute.value

		try {
			//first replace all expressions as values with "true", since it will throw an error when parsing as json (e.g. { "no-display" : lang === 'en' } )
			const objectValueRegex = /{\s*(?:"[^"]*"|'[^']*'|\w+)\s*:\s*([^}]+)}/g
			const matches = value.matchAll(objectValueRegex)
			for (const match of matches) {
				const targetMatch = match[1]
				if (!targetMatch) continue
				value = value.replace(targetMatch, "true")
			}

			//then repair json (add double quotes, remove trailing commas,....)
			const classesOnAttribute = getClassesFromClassListValues(value)

			_processClassValues({
				classAttribute,
				classesOnAttribute,
				directiveOffset: GLOBALS.CLASS_LIST_ATTRIBUTE_CHAR_LENGTH,
				directive: "class:list"
			})
		} catch (err) {
			console.error(`An error occurred in file: ${sourceFile}:${classAttribute.position?.start}`)
			console.error(err)
		}
	}

	//* ---------- x_alias Diagnostics -----------------------------------------------

	function _handleAliasDirectiveDiagnostics(tagLikeNode: TagLikeNode): void {
		const attrMap = new Map(getAttributes(tagLikeNode).map((a) => [a.name, a]))
		const aliasAttribute = attrMap.get("x_alias")
		if (!aliasAttribute) return

		const isValidAttribute = lists.aliasableComponents.includes(tagLikeNode.name)
		if (isValidAttribute) return

		_addDiagnostic({
			message: `Invalid "${aliasDirective}" directive for component: "${tagLikeNode.name}". Make sure to add a "${haqDirective}" or "${webcDirective}" directive for the aliased component.`,
			range: getPositionRange({
				node: aliasAttribute,
				endOffset: GLOBALS.X_ALIAS_DIRECTIVE_CHAR_LENGTH
			})
		})
	}

	//* ---------- x_ev_types Diagnostics -----------------------------------------------

	function _handleXEvTypesDirective(tagLikeNode: TagLikeNode): void {
		const attribute = getAttributeByName(tagLikeNode, "x_ev_types")
		if (!attribute?.value) return
		const valuesOnAttribute = getArrayFromStringifiedArray(attribute.value, filePath)

		const duplicateValue = getDuplicateArrayItem(valuesOnAttribute)
		if (!duplicateValue) return

		_showRedundantValueDiagnostic({
			attribute,
			directiveOffset: GLOBALS.X_EV_TYPES_DIRECTIVE_OFFSET,
			duplicateValue,
			valueType: "x_ev_types"
		})
	}

	//* ---------- x_attr_values Diagnostics -----------------------------------------------

	function _handleXAttrDirective(tagLikeNode: TagLikeNode): void {
		const attribute = getAttributeByName(tagLikeNode, "x_attr_values")
		if (!attribute?.value) return

		const valuesOnAttribute = generateArrayFromSpaceSeparatedList(attribute.value)
		const duplicateValue = getDuplicateArrayItem(valuesOnAttribute)
		if (!duplicateValue) return

		_showRedundantValueDiagnostic({
			attribute,
			directiveOffset: GLOBALS.X_ATTR_VALUES_DIRECTIVE_OFFSET,
			duplicateValue,
			valueType: "x_attr_values"
		})
	}

	//* ---------- x_slot Diagnostics -----------------------------------------------

	function _handleXSlotDirectiveDiagnostics(tagLikeNode: TagLikeNode): void {
		const attribute = getAttributeByName(tagLikeNode, "x_slot")
		if (!attribute?.value) return

		const valuesOnAttribute = generateArrayFromSpaceSeparatedList(attribute.value)

		const invalidValues: string[] = []
		for (const val of valuesOnAttribute) {
			if (!lists.aliasableComponents.includes(val)) invalidValues.push(val)
		}

		for (const invalidVal of invalidValues) {
			const indexOfVal = attribute.value.indexOf(invalidVal)
			_addDiagnostic({
				message: `Invalid "${slotDirective}" value: "${invalidVal}".`,
				range: getPositionRange({
					node: attribute,
					startOffset: GLOBALS.X_SLOT_DIRECTIVE_OFFSET + indexOfVal,
					endOffset: invalidVal.length
				})
			})
		}
		const duplicateValue = getDuplicateArrayItem(valuesOnAttribute)
		if (!duplicateValue) return

		_showRedundantValueDiagnostic({
			attribute,
			directiveOffset: GLOBALS.X_SLOT_DIRECTIVE_OFFSET,
			duplicateValue,
			valueType: "x_slot"
		})
	}

	//* ---------- Tag name Diagnostics -----------------------------------------------

	function _getTagNameDiagnostics(tagLikeNode: TagLikeNode): void {
		if (is.component(tagLikeNode) || isFragmentNode(tagLikeNode)) return

		const { name } = tagLikeNode

		const isValidTagName = customElementsMap.has(name)
		if (isValidTagName) return

		_addDiagnostic({
			message: `Undefined HTML tag: "${name}". You should define it in a *.haq.json file.`,
			range: getPositionRange({
				node: tagLikeNode,
				startOffset: 1, // we want to start after the opening tag character '<'
				endOffset: name.length
			})
		})
	}

	//* ---------- Attributes Diagnostics -----------------------------------------------

	function _handleSpreadAttribute(tagLikeNode: TagLikeNode): void {
		const spreadAttribute = getAttributes(tagLikeNode).find((attr) => attr.kind === "spread")
		if (!spreadAttribute) return

		_addDiagnostic({
			message: "Avoid using spread attributes, type checking is not as precise. Use explicit attributes instead.",
			range: getPositionRange({
				node: spreadAttribute,
				endOffset: spreadAttribute.name.length
			})
		})
	}

	function _handleDashedAttributeDiagnostics(tagLikeNode: TagLikeNode): void {
		const attributesToIgnore = [
			"data-astro-reload",
			"data-astro-rerun",
			"data-astro-history",
			"data-astro-transition",
			"data-astro-prefetch",
			"transition:persist-props"
		]
		for (const attribute of getAttributes(tagLikeNode)) {
			const { name } = attribute

			if (!name.includes(GLOBALS.DASH_CHAR) || attributesToIgnore.includes(name)) continue

			if (name.startsWith(GLOBALS.DATA_ATTRIBUTE_PREFIX)) {
				__handleDataAttribute(attribute)
				continue
			}

			if (is.component(tagLikeNode)) __handleDashedAttributeOnComponent(attribute)
			else __handleDashedAttribute(attribute)
		}

		//* ---------- Helpers -----------------------------------------------

		function __handleDataAttribute(attribute: I_AstroAttributeNode): void {
			const { name } = attribute

			_addDiagnostic({
				message: `Attributes that start with "${GLOBALS.DATA_ATTRIBUTE_PREFIX}" are not allowed.`,
				range: getPositionRange({
					node: attribute,
					endOffset: name.length
				})
			})
		}

		function __handleDashedAttribute(attribute: I_AstroAttributeNode): void {
			const { name } = attribute

			const validTagName = customElementsMap.get(tagLikeNode.name)
			if (!validTagName) return //  handled by getTagNameDiagnostics()

			const validAttributes = validTagName.attrs?.map((a) => a.name)

			if (validAttributes?.includes(name) || globalAttributes.includes(name)) return

			_addDiagnostic({
				message: `Invalid attribute: "${name}". You should define it in a *.haq.json file.`,
				range: getPositionRange({
					node: attribute,
					endOffset: name.length
				})
			})
		}

		function __handleDashedAttributeOnComponent(attribute: I_AstroAttributeNode): void {
			const { name } = attribute

			_addDiagnostic({
				message: `Invalid attribute: "${name}". Attributes with "-" aren't type safe. We recommend using "_" or camelCase props in the receiving component.`,
				range: getPositionRange({
					node: attribute,
					endOffset: name.length
				})
			})
		}
	}

	//* ---------- Slot Diagnostics -----------------------------------------------

	function _handleSlotMatch(tagLikeNode: TagLikeNode, parentSlotStack: boolean[]): boolean {
		if (isSlotNode(tagLikeNode)) {
			parentSlotStack.push(getAttributeByName(tagLikeNode, "x_slot") !== undefined)
			return true
		}
		const parentSlot = parentSlotStack.at(-1)

		if (parentSlot === undefined) return false

		if (parentSlot === true) {
			_addDiagnostic({
				message: `Children of slot elements with an "${slotDirective}" directive are unreachable.`,
				range: getPositionRange({
					node: tagLikeNode,
					startOffset: 1, // we want to start after the opening tag character '<'
					endOffset: tagLikeNode.name.length
				})
			})
			return false
		}

		if (!hasHAQDirective(tagLikeNode)) return false

		_addDiagnostic({
			message: "Do not use HAQ Directives in a slot's child element. They will be ignored.",
			range: getPositionRange({
				node: tagLikeNode,
				startOffset: 1, // we want to start after the opening tag character '<'
				endOffset: tagLikeNode.name.length
			})
		})

		return false
	}

	function _handleComponentWithSlotAttrMatch(
		tagLikeNode: TagLikeNode,
		parentComponentWithSlotAttrStack: string[]
	): boolean {
		const slotAttribute = getAttributeByName(tagLikeNode, "slot")
		if (slotAttribute) {
			parentComponentWithSlotAttrStack.push(tagLikeNode.name)
			return true
		}

		if (!isSlotNode(tagLikeNode)) return false

		const parentFragment = parentComponentWithSlotAttrStack.at(-1)

		if (!parentFragment) return false

		const xSlotAttribute = getAttributeByName(tagLikeNode, "x_slot")
		if (xSlotAttribute) return false

		if (_matchesFragileSlotAttribute(tagLikeNode, "name")) return false

		_addDiagnostic({
			message:
				"Do not use slots as children of a component that will be passed into another component's slot. Place it outisde of the component.",
			range: getPositionRange({
				node: tagLikeNode,
				startOffset: 1, // we want to start after the opening tag character '<'
				endOffset: tagLikeNode.name.length
			})
		})

		return false
	}

	function _handleFragileTagSlot(tagLikeNode: TagLikeNode, parentFragileTagStack: string[]): boolean {
		if (GLOBALS.FRAGILE_HTML_TAGS.includes(tagLikeNode.name)) {
			parentFragileTagStack.push(tagLikeNode.name)
			return true
		}

		if (!isSlotNode(tagLikeNode)) return false

		const parentFragileTag = parentFragileTagStack.at(-1)

		if (!parentFragileTag) return false

		const slotAttribute = getAttributeByName(tagLikeNode, "slot")

		const matchingSlotAttribute = _matchesFragileSlotAttribute(tagLikeNode, "slot")

		const validNameAttribute = tagLikeNode.attributes.find((attr) => {
			if (matchingSlotAttribute && slotAttribute) {
				return (
					attr.name === "name" &&
					attr.value?.startsWith(`${matchingSlotAttribute}:`) &&
					attr.value !== slotAttribute.value
				)
			}
			return attr.name === "name" && attr.value?.startsWith(`${parentFragileTag}:`)
		})
		if (validNameAttribute) return false

		const tag = matchingSlotAttribute ? matchingSlotAttribute : parentFragileTag

		_addDiagnostic({
			message: `Slot name inside a <${tag}> element must start with "${tag}:" as a prefix.`,
			range: getPositionRange({
				node: tagLikeNode,
				startOffset: 1, // we want to start after the opening tag character '<'
				endOffset: tagLikeNode.name.length
			})
		})

		return false
	}

	function _handleSlotName(tagLikeNode: TagLikeNode, parentAliasedComponentStack: string[]): void {
		const slotAttribute = getAttributeByName(tagLikeNode, "slot")
		if (!slotAttribute) return

		const prevAliasedComponent = parentAliasedComponentStack.at(-1)
		const rootAliasedComponent = is.component(tagLikeNode) && tagVisitedCount === 1 ? tagLikeNode.name : undefined

		const parentAliasedComponent = prevAliasedComponent ?? rootAliasedComponent

		if (!parentAliasedComponent) {
			_addDiagnostic({
				message: `"${tagLikeNode.name}"'s parent does not take in any slots.`,
				range: getPositionRange({
					node: slotAttribute
				})
			})
			return
		}

		const currentElem = astroComponentsMap.get(parentAliasedComponent)
		if (!currentElem) return

		_expectValidSlotName(tagLikeNode, currentElem)
	}

	function _handleSlotNames(tagLikeNode: TagLikeNode): void {
		if (!is.component(tagLikeNode)) {
			return
		}

		const currentElem = astroComponentsMap.get(tagLikeNode.name)
		if (!currentElem) return

		for (const child of tagLikeNode.children) {
			_visitNode(child, currentElem)
		}

		function _visitNode(child: Node, scopedSlotList: SlotList[]): void {
			if (is.tag(child)) {
				if (scopedSlotList.length === 0) return

				_expectValidSlotName(child, scopedSlotList)
			} else if (hasChildren(child)) {
				for (const ch of child.children || []) {
					_visitNode(ch, scopedSlotList)
				}
			}
		}
	}

	function _expectValidSlotName(tagLikeNode: TagLikeNode, slotList: SlotList[]): void {
		const slotListStringUnion = generateUnionFromArray(slotList.map((s) => s.slotName))

		const slotAttribute = getAttributeByName(tagLikeNode, "slot")
		if (!slotAttribute) {
			if (slotList.some((s) => s.slotName === GLOBALS.ASTRO_DEFAULT_SLOT_NAME)) return
			_addDiagnostic({
				message: `"${tagLikeNode.name}" must take in a slot attribute with name: ${slotListStringUnion}`,
				range: getPositionRange({
					node: tagLikeNode,
					startOffset: 1, // we want to start after the opening tag character '<'
					endOffset: tagLikeNode.name.length
				})
			})
			return
		}

		if (slotList.some((s) => s.slotName === slotAttribute.value)) return

		_addDiagnostic({
			message: `"${slotAttribute.value}" is not assignable to ${slotListStringUnion}.`,
			range: getPositionRange({
				node: tagLikeNode,
				startOffset: 1, // we want to start after the opening tag character '<'
				endOffset: tagLikeNode.name.length
			})
		})
	}

	//* ---------- Astro built-in attributes Diagnostics -----------------------------------------------

	function _handleAstroBuiltInAttributes(tagLikeNode: TagLikeNode): void {
		const attrMap = new Map(getAttributes(tagLikeNode).map((a) => [a.name, a]))
		const attributesToCheck: I_AstroAttributeNode["name"][] = [
			"class:list",
			"set:html",
			"set:text",
			"is:raw",
			"transition:animate",
			"transition:name",
			"transition:persist",
			"transition:persist-props"
		]

		for (const attrToCheck of attributesToCheck) {
			__handleDirective(attrToCheck)
		}

		function __handleDirective(attrToCheck: I_AstroAttributeNode["name"]): void {
			const attr = attrMap.get(attrToCheck)
			if (!attr) return

			if (tagLikeNode.name === "slot") {
				_addDiagnostic({
					message: `Do not use "${attrToCheck}" attribute on a <slot> element. This will likely cause unexpected behavior.`,
					range: getPositionRange({
						node: attr,
						endOffset: attrToCheck.length
					})
				})
				return
			}

			if (!is.component(tagLikeNode)) return

			// should not be used on components

			_addDiagnostic({
				message: `Do not use "${attrToCheck}" attribute on an aliased component. Instead use it on the original tag element.`,
				range: getPositionRange({
					node: attr,
					endOffset: attrToCheck.length
				})
			})
		}
	}

	//* ---------- Helpers -----------------------------------------------

	function _addDiagnostic({ message, range }: Pick<Diagnostic, "message" | "range">): void {
		// handle ignoreDirectiveStack
		const hasIgnoreDirective = ignoreDirectiveStack.find(
			(d) => d.node.position && d.node.position.start.line + 1 === range.start.line
		)

		if (hasIgnoreDirective) {
			hasIgnoreDirective.wasUsed = true
			return
		}

		diagnostics.push({
			message,
			sourceFile,
			range
		})
	}

	function _matchesFragileSlotAttribute(tagLikeNode: TagLikeNode, attrName: "slot" | "name"): string | undefined {
		const slotAttribute = getAttributeByName(tagLikeNode, attrName)
		if (!slotAttribute) return

		const regex = new RegExp(`(${GLOBALS.FRAGILE_HTML_TAGS.join(GLOBALS.PIPE_CHAR)}):.*`)
		const match = slotAttribute.value.match(regex)

		if (!match) return

		return match[1]
	}

	type ARGS__showRedundantValueDiagnostic = {
		attribute: I_AstroAttributeNode
		duplicateValue: string
		valueType: TypedExtract<
			I_AstroAttributeNode["name"],
			"class" | "class:list" | "x_slot" | "x_attr_values" | "x_ev_types"
		>
		directiveOffset: number
	}

	function _showRedundantValueDiagnostic({
		attribute,
		duplicateValue,
		valueType,
		directiveOffset
	}: ARGS__showRedundantValueDiagnostic): void {
		const indexOfClass = attribute.value.indexOf(duplicateValue)
		_addDiagnostic({
			message: `Redundant ${valueType} value "${duplicateValue}".`,
			range: getPositionRange({
				node: attribute,
				startOffset: valueType === "class:list" ? 0 : directiveOffset + indexOfClass,
				endOffset: valueType === "class:list" ? directiveOffset : duplicateValue.length
			})
		})
	}
}
