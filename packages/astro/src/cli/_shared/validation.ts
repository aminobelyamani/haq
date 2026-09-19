//#region -------------------------------------------------- Module Imports

import { stringArray } from "@haq/utils"
import { z } from "zod"
import { GLOBALS } from "../../globals.js"
import { HAQError } from "./errors.js"
import { filePathExistsOrThrow, loadJsonFile } from "./fs.js"
import type { __TagName__ } from "./types.js"

//#endregion ----------------------------------------------- Module Imports

//------------------------------------------------------------------------------
//
// HAQ Config Schema
//
//------------------------------------------------------------------------------

// NOTE: Sync zod config schema with json schema
// LINK packages/astro/_static/haq_config_schema.json

const configSchema = z.object({
	projectDir: z.string().nonempty(),
	outDir: z.string().nonempty(),
	globalCssDir: z.string().nonempty(),
	astroDirs: z.string().nonempty().array().min(1)
})

export type ConfigSchema = z.infer<typeof configSchema>

export function getProjectConfig(currentDir: string): ConfigSchema {
	const configFile = `${currentDir}/${GLOBALS.HAQ_CONFIG_JSON_FILE_NAME}`

	// config file must exist

	filePathExistsOrThrow({
		filePath: configFile,
		kind: "config file",
		description: `Make sure to include a configured "${GLOBALS.HAQ_CONFIG_JSON_FILE_NAME}" file in the root of your project.\nYou can run "haq init" to add a config file.`
	})

	// load config json content

	const configContent = loadJsonFile(configFile)

	// validate

	if (!isConfigValid(configContent)) {
		throw new HAQError({
			message: "Invalid Config.",
			description: `Run "haq init" to setup a correct config for your project.`,
			sourceFiles: [configFile]
		})
	}

	return configContent
}

function isConfigValid(json: unknown): json is ConfigSchema {
	return configSchema.safeParse(json).success
}

//------------------------------------------------------------------------------
//
// HAQ Custom/Native Elements Schema
//
//------------------------------------------------------------------------------

type AttributeValueLiteral = "string" | "number"

type AttributeSchema = {
	name: string
	value?: AttributeValueLiteral | string[] | undefined
	required?: boolean | undefined
}

const VALUE_LITERAL = stringArray<AttributeValueLiteral>()(["number", "string"])

const attributeSchema: z.ZodType<AttributeSchema> = z.object({
	name: z.string().nonempty(),
	value: z.literal(VALUE_LITERAL, { message: "Invalid attribute value" }).or(z.string().array()).optional(),
	required: z.boolean().optional()
})

type BaseElementSchema = {
	tag: string
	attrs?: AttributeSchema[] | undefined
}

type ElementSchema = BaseElementSchema & {
	cssStaticVars?: string[] | undefined
	cssDynamicVars?: string[] | undefined
}

const elementSchema: z.ZodType<ElementSchema> = z.object({
	tag: z.string().nonempty(),
	attrs: attributeSchema.array().optional(),
	cssStaticVars: z.string().array().optional(),
	cssDynamicVars: z.string().array().optional()
})

export type JSON_Schema = {
	"native-elements"?: BaseElementSchema[] | undefined
	"custom-elements"?: ElementSchema[] | undefined
}

const JSONSchema: z.ZodType<JSON_Schema> = z.object({
	//@ts-expect-error - omit does exist as a method on elementSchema at runtime
	"native-elements": elementSchema.omit({ cssStaticVars: true, cssDynamicVars: true }).array().optional(),
	"custom-elements": elementSchema.array().optional()
})

export type JSON_CustomElement = NonNullable<JSON_Schema["custom-elements"]>[number]
export type JSON_NativeElement = NonNullable<JSON_Schema["native-elements"]>[number]
export type JSON_Attribute = NonNullable<JSON_CustomElement["attrs"]>[number]

export function loadNativeElementsJson(outDir: string): JSON_CustomElement[] {
	const nativeElmentsJsonFilePath = `${outDir}/${GLOBALS.NATIVE_ELEMENTS_JSON_FILE_NAME}`

	filePathExistsOrThrow({
		filePath: nativeElmentsJsonFilePath,
		kind: "generated native elements json file",
		description: "Please run the `compile` command to generate this file."
	})

	return loadJsonFile(nativeElmentsJsonFilePath) as JSON_CustomElement[]
}

/*******************************************************************************
 *
 * Map of generated custom elements by tag.
 *
 ******************************************************************************/

export type CustomElementsMap = Map<__TagName__, Pick<JSON_CustomElement, "attrs" | "cssDynamicVars" | "cssStaticVars">>

export function isJSONSchemaValid(json: unknown): json is JSON_Schema {
	return JSONSchema.safeParse(json).success
}

//------------------------------------------------------------------------------
//
// Unique Sets
//
//------------------------------------------------------------------------------

type UniqueIdentifierType =
	| "component"
	| "selector"
	| "alias"
	| "custom element"
	| "native element"
	| "attribute"
	| "slot name"
	| "markup id"
	| "id selector"

type UniqueSetArgs = {
	type: UniqueIdentifierType
	identifierList: Set<string>
	identifier: string
	filePath: string
}

export function addUniqueSetValueOrThrow({ filePath, identifier, identifierList, type }: UniqueSetArgs): void {
	if (identifierList.has(identifier)) {
		throw new HAQError({
			message: `Duplicate ${type} identifier.`,
			description: `${type}: ${identifier}`,
			sourceFiles: [filePath]
		})
	}
	identifierList.add(identifier)
}
