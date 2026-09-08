//#region -------------------------------------------------- Type Imports

import type { JSON_Attribute, JSON_CustomElement, JSON_NativeElement } from "../_shared/validation.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import path from "node:path"
import { GLOBALS } from "../../globals.js"
import { HAQError } from "../_shared/errors.js"
import { loadJSONFile } from "../_shared/fs.js"
import { generateUnionFromArray, kebab2Pascal } from "../_shared/strings.js"
import { addUniqueSetValueOrThrow, isJSONSchemaValid } from "../_shared/validation.js"

//#endregion ----------------------------------------------- Module Imports

const ACCEPTABLE_NATIVE_ELEMENTS_MAP = {
	"*": "HTMLAttributes",
	a: "AnchorHTMLAttributes",
	area: "AreaHTMLAttributes",
	audio: "AudioHTMLAttributes",
	base: "BaseHTMLAttributes",
	blockquote: "BlockquoteHTMLAttributes",
	button: "ButtonHTMLAttributes",
	canvas: "CanvasHTMLAttributes",
	col: "ColHTMLAttributes",
	colgroup: "ColgroupHTMLAttributes",
	data: "DataHTMLAttributes",
	del: "DelHTMLAttributes",
	details: "DetailsHTMLAttributes",
	dialog: "DialogHTMLAttributes",
	embed: "EmbedHTMLAttributes",
	fieldset: "FieldsetHTMLAttributes",
	form: "FormHTMLAttributes",
	html: "HtmlHTMLAttributes",
	iframe: "IframeHTMLAttributes",
	img: "ImgHTMLAttributes",
	input: "InputHTMLAttributes",
	ins: "InsHTMLAttributes",
	keygen: "KeygenHTMLAttributes",
	label: "LabelHTMLAttributes",
	li: "LiHTMLAttributes",
	link: "LinkHTMLAttributes",
	map: "MapHTMLAttributes",
	menu: "MenuHTMLAttributes",
	meta: "MetaHTMLAttributes",
	meter: "MeterHTMLAttributes",
	object: "ObjectHTMLAttributes",
	ol: "OlHTMLAttributes",
	optgroup: "OptgroupHTMLAttributes",
	option: "OptionHTMLAttributes",
	output: "OutputHTMLAttributes",
	param: "ParamHTMLAttributes",
	progress: "ProgressHTMLAttributes",
	q: "QuoteHTMLAttributes",
	select: "SelectHTMLAttributes",
	source: "SourceHTMLAttributes",
	table: "TableHTMLAttributes",
	td: "TdHTMLAttributes",
	textarea: "TextareaHTMLAttributes",
	th: "ThHTMLAttributes",
	time: "TimeHTMLAttributes",
	track: "TrackHTMLAttributes",
	video: "VideoHTMLAttributes"
} as const

type ARGS_getAttributeTypes = {
	projectDir: string
	jsonFiles: string[]
	rootCustomProperties: string[]
}

type RT_getAttributeTypes = {
	generatedTypes: string
	cssPropertyTypes: string
	json: (JSON_CustomElement | JSON_NativeElement)[]
}
export function getAttributeTypes({
	jsonFiles,
	projectDir,
	rootCustomProperties
}: ARGS_getAttributeTypes): RT_getAttributeTypes {
	const allGeneratedAttributeTypes: string[] = []
	const allDefinedIntrinsicElementsTypes: string[] = []
	const allCSSDynamicVarsTypes: string[] = []
	const globalTypes: string[] = []
	const tagNames: Set<string> = new Set()
	const allElements: (JSON_CustomElement | JSON_NativeElement)[] = []

	for (const fileName of jsonFiles) {
		const jsonContent = loadJSONFile(fileName)

		if (!isJSONSchemaValid(jsonContent))
			throw new HAQError({
				message: "Invalid schema.",
				sourceFiles: [fileName]
			})

		const filePath = path.relative(projectDir, fileName)

		const nativeElementsJSON = jsonContent["native-elements"]
		const customElementJSON = jsonContent["custom-elements"]

		if (customElementJSON) {
			const { definedIntrinsicElementsTypes, fileTypes, cssDynVarTypes } = processCustomElementsData({
				data: customElementJSON,
				filePath,
				tagNames
			})

			allGeneratedAttributeTypes.push(fileTypes.join(""))
			allDefinedIntrinsicElementsTypes.push(`${definedIntrinsicElementsTypes.join("\n")}\n`)
			allCSSDynamicVarsTypes.push(`${cssDynVarTypes.join("\n")}\n`)

			for (const customElem of customElementJSON) {
				allElements.push(customElem)
			}
		}

		if (nativeElementsJSON) {
			const fileTypes = processNativeElementsData({
				data: nativeElementsJSON,
				filePath,
				tagNames
			})

			allGeneratedAttributeTypes.push(fileTypes.fileTypes.join(""))
			globalTypes.push(fileTypes.globalTypes.join(""))

			for (const customElem of nativeElementsJSON) {
				allElements.push(customElem)
			}
		}
	}

	if (rootCustomProperties.length > 0)
		allCSSDynamicVarsTypes.push(`html: ${generateUnionFromArray(rootCustomProperties)}\n`)

	return {
		generatedTypes: injectTypeInNamespace(
			injectGlobalAttributesInInterface(globalTypes.join("")) +
				allGeneratedAttributeTypes.join("") +
				injectTypeInDefinedIntrinsicElementsInterface(allDefinedIntrinsicElementsTypes.join(""))
		),
		cssPropertyTypes: injectTypeInCustomPropertiesInterface(allCSSDynamicVarsTypes.join("")),
		json: allElements
	}
}

/* Type Generation
-----------------------------------------------*/

type ARGS_processCustomElementsData = {
	filePath: string
	data: JSON_CustomElement[]
	tagNames: Set<string>
}

type RT_processCustomElementsData = {
	fileTypes: string[]
	definedIntrinsicElementsTypes: string[]
	cssDynVarTypes: string[]
}

function processCustomElementsData({
	filePath,
	data,
	tagNames
}: ARGS_processCustomElementsData): RT_processCustomElementsData {
	const fileTypes: string[] = []
	const definedIntrinsicElementsTypes: string[] = []
	const cssDynVarTypes: string[] = []
	for (const customElement of data) {
		const { attrs, tag, cssDynamicVars, cssStaticVars } = customElement
		addUniqueSetValueOrThrow({
			filePath,
			identifier: tag,
			identifierList: tagNames,
			type: "custom element"
		})

		const tagNameRegex = GLOBALS.REGEX_HTML_CUSTOM_ELEMENT
		if (!tag.match(tagNameRegex))
			throw new HAQError({
				message: `Invalid custom element tag name: ${tag}. Must contain dashes and only lower case letters.`,
				sourceFiles: [filePath]
			})

		const attributeTypes: string[] = []
		const attributeNames: Set<string> = new Set()
		if (attrs) {
			for (const attribute of attrs) {
				validateAttributeName({ attributeName: attribute.name, filePath })
				addUniqueSetValueOrThrow({
					filePath,
					identifier: attribute.name,
					identifierList: attributeNames,
					type: "attribute"
				})

				attributeTypes.push(generateAttributeType(attribute))
			}
		}

		const interfaceName = kebab2Pascal(tag)
		definedIntrinsicElementsTypes.push(`"${tag}": ${interfaceName}Attributes`)
		fileTypes.push(injectCustomElementTypeInAttributeInterface({ tagName: tag, types: attributeTypes.join("\n") }))

		if (cssStaticVars) customElement.cssStaticVars = addPrefixToCSSStaticVars(cssStaticVars)
		if (cssDynamicVars) {
			cssDynVarTypes.push(generateCSSCustomPropertyType({ cssVars: cssDynamicVars, tagName: tag }))
			customElement.cssDynamicVars = addPrefixToCSSDynamicVars(cssDynamicVars)
		}
	}
	return { fileTypes, definedIntrinsicElementsTypes, cssDynVarTypes }
}

type ARGS_processNativeElementsData = {
	filePath: string
	data: JSON_NativeElement[]
	tagNames: Set<string>
}

type RT_processNativeElementsData = { fileTypes: string[]; globalTypes: string[] }

function processNativeElementsData({
	filePath,
	data,
	tagNames
}: ARGS_processNativeElementsData): RT_processNativeElementsData {
	const fileTypes: string[] = []
	const globalTypes: string[] = []

	for (const nativeElement of data) {
		const { attrs, tag } = nativeElement
		addUniqueSetValueOrThrow({
			filePath,
			identifier: tag,
			identifierList: tagNames,
			type: "native element"
		})

		if (!isValidNativeElementTag(tag))
			throw new HAQError({
				message: `Invalid native element name: ${tag}\nFile: ${filePath}\n`,
				sourceFiles: [filePath]
			})

		const attributeTypes: string[] = []
		const attributeNames: Set<string> = new Set()
		if (attrs) {
			for (const attribute of attrs) {
				validateAttributeName({ attributeName: attribute.name, filePath })
				addUniqueSetValueOrThrow({
					filePath,
					identifier: attribute.name,
					identifierList: attributeNames,
					type: "attribute"
				})

				attributeTypes.push(generateAttributeType(attribute))
			}
		}

		if (tag === "*") {
			globalTypes.push(attributeTypes.join("\n"))
			continue
		}

		fileTypes.push(injectNativeElementTypeInAttributeInterface({ tagName: tag, types: attributeTypes.join("\n") }))
	}
	return { fileTypes, globalTypes }
}

function generateAttributeType(attribute: JSON_Attribute): string {
	const { name, value, required } = attribute
	if (!value) {
		return required ? `"${name}": boolean` : `"${name}"?: boolean | undefined`
	}

	if (typeof value === "string") {
		if (value === "string") {
			return required ? `"${name}": string` : `"${name}"?: string | undefined`
		}
		if (value === "number") {
			return required ? `"${name}": \`\${number}\`` : `"${name}"?: \`\${number}\` | undefined`
		}
	}

	return required
		? `"${name}": ${generateUnionFromArray(value)}`
		: `"${name}"?: ${generateUnionFromArray(value)} | undefined`
}

function generateCSSCustomPropertyType({ cssVars, tagName }: { cssVars: string[]; tagName: string }): string {
	const prefixedVars = addPrefixToCSSDynamicVars(cssVars)

	return `"${tagName}": ${generateUnionFromArray(prefixedVars)}`
}

function addPrefixToCSSStaticVars(cssVars: string[]): string[] {
	return cssVars.map((cssVar) => `${GLOBALS.CSS_STATIC_VARIABLE_PREFIX}${cssVar}`)
}

function addPrefixToCSSDynamicVars(cssVars: string[]): string[] {
	return cssVars.map((cssVar) => `${GLOBALS.CSS_DYNAMIC_VARIABLE_PREFIX}${cssVar}`)
}

function validateAttributeName({ attributeName, filePath }: { attributeName: string; filePath: string }): void {
	if (!(attributeName.startsWith(GLOBALS.HAQ_DATA_ATTRIBUTE_PREFIX) && attributeName.match(GLOBALS.REGEX_NO_SPACES)))
		throw new HAQError({
			message: `Invalid attribute name: "${attributeName}".\nMust start with "${GLOBALS.HAQ_DATA_ATTRIBUTE_PREFIX}" and contain no spaces.`,
			sourceFiles: [filePath]
		})
}

function isValidNativeElementTag(tagName: string): tagName is keyof typeof ACCEPTABLE_NATIVE_ELEMENTS_MAP {
	return Object.keys(ACCEPTABLE_NATIVE_ELEMENTS_MAP).includes(tagName)
}

/* String Injection/Composition
-----------------------------------------------*/

type ARGS_injectNativeElementTypeInAttributeInterface = {
	tagName: keyof typeof ACCEPTABLE_NATIVE_ELEMENTS_MAP
	types: string
}
function injectNativeElementTypeInAttributeInterface({
	tagName,
	types
}: ARGS_injectNativeElementTypeInAttributeInterface): string {
	return `
        /* ${tagName} */

        interface ${ACCEPTABLE_NATIVE_ELEMENTS_MAP[tagName]} {
		    ${types}
		}\n`
}

type ARGS_injectCustomElementTypeInAttributeInterface = {
	tagName: string
	types: string
}

function injectCustomElementTypeInAttributeInterface({
	tagName,
	types
}: ARGS_injectCustomElementTypeInAttributeInterface): string {
	const interfaceName = kebab2Pascal(tagName)

	return `
        /* ${tagName} */

        interface ${interfaceName}Attributes extends HTMLAttributes {
		    ${types}
		}\n`
}

function injectGlobalAttributesInInterface(types: string): string {
	return `
		interface HAQ_GlobalAttributes {\n\n
            ${types}
        }\n\n`
}

function injectTypeInNamespace(customTypes: string): string {
	return `
        namespace astroHTML.JSX {\n\n
        \n\n//* ---------- Custom Generated Attributes -----------------------------------------------\n\n
                ${customTypes}
        }\n\n`
}

function injectTypeInDefinedIntrinsicElementsInterface(types: string): string {
	return `\n/* Custom Intrinsic Elements
        -----------------------------------------------*/\n\ninterface DefinedIntrinsicElements {
            ${types}
        }\n\n`
}

function injectTypeInCustomPropertiesInterface(types: string): string {
	return `\nnamespace HAQ {
        interface CustomElementCustomProperties {
            ${types}
        }\n\n
    }\n\n`
}
