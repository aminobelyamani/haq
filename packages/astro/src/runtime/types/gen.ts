//#region -------------------------------------------------- Type Imports

import type { HTMLAttributes, HTMLTag } from "astro/types"
import type { MarkupDirective } from "../../globals.js"
import type { I_ComponentShape } from "./static.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// Exposed helper types for generated HAQ_ComponentShape
//
//------------------------------------------------------------------------------

/*******************************************************************************
 *
 * Type helper that handles aliased Components.
 *
 ******************************************************************************/

export type MarkupAlias<Component extends I_ComponentShape> = Component extends { HAQ_isWebComponent: true }
	? Omit<Component, "HAQ_children" | "HAQ_eventListenerType" | "HAQ_elType"> &
			(Component["HAQ_tag"] extends keyof HAQ.WebComponentTagNameMap
				? {
						HAQ_elType: HAQ.WebComponentTagNameMap[Component["HAQ_tag"]]["el"] & HTMLElement
						HAQ_customEvents: HAQ.WebComponentTagNameMap[Component["HAQ_tag"]]["customEvents"]
					}
				: never)
	: Component

/*******************************************************************************
 *
 * Type helper that returns attributes by tag name.
 *
 ******************************************************************************/

export type AttributesByTag<Tag extends HTMLTag> = Omit<HTMLAttributes<Tag>, IgnorableDirectives>

type IgnorableDirectives =
	| MarkupDirective
	| `data-${string}`
	| "slot"
	| "inlist"
	| "class:list"
	| `on${string}`
	| "id"
	| "children"

type AttributeLiteral<Attrs, Tag extends HTMLTag> = {
	[K in keyof Attrs]: K extends string
		? Attrs[K] extends boolean | undefined | null
			? `${Tag}[${K}]`
			: Attrs[K] extends (infer S extends string) | undefined
				? `${Tag}[${K}='${S}']`
				: never
		: never
}[keyof Attrs]

/*******************************************************************************
 *
 * Type helper that returns all matching selectors as string literal union for a given tag name.
 *
 ******************************************************************************/

export type MatchingSelectorsByTag<Tag extends HTMLTag> = `${AttributeLiteral<Required<AttributesByTag<Tag>>, Tag>}`

/*******************************************************************************
 *
 * Type helper that returns custom style properties for a given tag name.
 *
 ******************************************************************************/

export type StylePropertiesByTag<Tag extends HTMLTag> = Tag extends keyof HAQ.CustomElementCustomProperties
	? HAQ.CustomElementCustomProperties[Tag]
	: never

/*******************************************************************************
 *
 * Type helper that returns custom events that are defined by the user for a given tag name.
 *
 ******************************************************************************/

export type CustomEventsByTag<Tag extends HTMLTag> = Tag extends keyof HAQ.WebComponentTagNameMap
	? HAQ.WebComponentTagNameMap[Tag]["customEvents"]
	: undefined

/*******************************************************************************
 *
 * Type helper that returns the AppComponent class for a given AppComponent name
 *
 ******************************************************************************/

export type AppComponentByName<ComponentName extends string> = ComponentName extends keyof HAQ.AppComponentMap
	? HAQ.AppComponentMap[ComponentName]
	: never
