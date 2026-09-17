//#region -------------------------------------------------- Type Imports

import type { MarkupDirective } from "../globals.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { isAstroFile } from "../cli/_shared/fs.js"

//#endregion ----------------------------------------------- Module Imports

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

function matchFileExtension(fileName: string): boolean {
	return isAstroFile(fileName)
}

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
