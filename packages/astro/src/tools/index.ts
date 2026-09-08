/*******************************************************************************
 *
 * Extra tools.
 *
 * @module
 *
 ******************************************************************************/

//#region -------------------------------------------------- Type Imports

import type { z } from "zod"
import type { MarkupDirective } from "../globals.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { GLOBALS } from "../globals.js"

//#endregion ----------------------------------------------- Module Imports

//------------------------------------------------------------------------------
//
// Vite Plugin to remove attributes in Astro components
//
//------------------------------------------------------------------------------

type TransformReturn = {
	code: string
	map: null
}
type VitePlugin = {
	readonly name: "remove-astro-attributes"
	readonly enforce: "pre"
	readonly transform: (src: string, id: string) => TransformReturn
}

/*******************************************************************************
 *
 * Vite Plugin to remove attributes in Astro components
 *
 * @param attrs A string array of attributes to remove (optional).
 * @returns Vite plugin
 *
 * @example
 *
 *
 * ```ts
 * // astro.config.ts
 *
 * import { removeAstroAttributes } from "@haq/astro/tools"
 *
 * export default defineConfig({
 *   // ... your config
 *  vite: {
 *    plugins: [removeAstroAttributes()],
 *  })
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function removeAstroAttributes(attrs?: string[]): VitePlugin {
	const haqAttributes: MarkupDirective[] = [
		"x_haq",
		"x_webc",
		"x_alias",
		"x_appc",
		"x_slot",
		"x_ev_types",
		"x_class_list",
		"x_attr_values"
	]
	let customAttributes: string[] = []
	if (Array.isArray(attrs)) customAttributes = attrs
	return removeAttributesPlugin([...haqAttributes, ...customAttributes])
}

//! Omitting 'x_sel' from attribute list because it is used at runtime
//! Omitting 'x_dyn_sel' from attribute list because it is used at runtime
//! Omitting 'x_input_values' from attribute list because it is passed around Astro Components as props

function removeAttributesPlugin(attributes: string[]): VitePlugin {
	return {
		name: "remove-astro-attributes",
		enforce: "pre",
		transform(src: string, id: string): TransformReturn {
			return {
				code: matchFileExtension(id) ? removeAttributes(src, attributes) : src,
				map: null
			}
		}
	}
}

/* regexr.com testing string

{ x_haq x_haq:true, x_haq:"true", "x_haq":true, "x_haq":"true", "x_haq":"no-display no-pointers", x_haq=true x_haq="true" "x_haq"="true" "x_haq"=true "x_haq"="no-display no-pointer" x_haq=["click"], x_haq=["click", "submit"],  }

method="POST"${$$addAttribute(["submit"], "x_ev_types")} x_haq>
method="POST"${$$addAttribute(["submit"], "some-prop")} x_haq>

*/

function removeAttributes(src: string, attributes: string[]): string {
	let result = src
	for (const attribute of attributes) {
		const s = new RegExp(
			`("?${attribute}"?)(?:\\s*(:|=)\\s*("[^"]*"|true|false)?(\\s*\\[\\s*"[^\\[\\]]*\\])?[,]?)?`,
			"gi"
		)
		const evTypesRegex = /(\$\{\$\$addAttribute)([^}]*, "x_ev_types"\))\}/gi // because its value type is an array, vite sometimes uses $$addAttribute to inject attributes
		result = result.replace(s, "")
		result = result.replace(evTypesRegex, "")
	}
	return result
}

function matchFileExtension(id: string): boolean {
	return new RegExp(GLOBALS.REGEX_ASTRO_EXTENSION, "i").test(id)
}

/*******************************************************************************
 *
 * Helper to validate and provide type safety and intellisense for your environment variables.
 *
 * @typeParam Env - The generated env types from `env-types.ts`.
 *
 * @param {unknown} env The env object from `process.env`.
 * @param {z.ZodType} zodSchema The generated zod schema from `env-schema.ts`.
 *
 * @returns {Readonly<Env>} The fully typed env.
 * @throws {Error} If the passed environment does not match the schema.
 *
 * @example
 * ```ts
 * import type { HAQ_ENV } from "./env-types.js"
 *
 * import { envSchema } from "./env-schema.js"
 * import { validateEnv } from "@haq/astro/tools"
 *
 * export const ENV = validateEnv<HAQ_ENV>(process.env, envSchema)
 * // now you can use it safely anywhere in your project
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function validateEnv<Env extends Record<string, string>>(env: unknown, zodSchema: z.ZodType): Readonly<Env> {
	const ENV = zodSchema.safeParse(env)
	if (ENV.error) throw new Error(ENV.error.message)

	return Object.freeze(ENV.data) as Readonly<Env>
}

//------------------------------------------------------------------------------
//
// Exposed tools for extensions
//
//------------------------------------------------------------------------------

// biome-ignore lint/performance/noBarrelFile: These exposed functions are almost always used together so no significant tree shaking effect.
export { getAstroDiagnostics } from "../cli/check/astro-diagnostics.js"
export { getCSSDiagnostics } from "../cli/check/css-diagnostics.js"
export { getGeneratedData } from "../cli/check/load.js"
export { GLOBALS } from "../globals.js"
export { getAstroCompletions } from "./astro-completions.js"
export { getCSSCompletions } from "./css-completions.js"
