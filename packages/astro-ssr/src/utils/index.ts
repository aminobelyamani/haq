/*******************************************************************************
 *
 * Compile time and runtime utilities for building @haq/astro-ssr projects.
 *
 * @module
 *
 ******************************************************************************/

//#region -------------------------------------------------- Type Imports

import type { ClientTypesShape } from "../client/types.js"

//#endregion ----------------------------------------------- Type Imports

/*******************************************************************************
 *
 * Factory that provides typed methods for handling query and dynamic params to your API routes.
 *
 * @typeParam GPA_EmailRoutes - The exposed `CLIENT` type returned from your App.
 *
 * @example
 * ```ts
 * import { makePathManipulation } from "@haq/astro-ssr/utils"
 *
 * export const PathManipulation = makePathManipulation<App["CLIENT"]>()
 * // now you you can use that anywhere in your full stack App.
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function makePathManipulation<
	GPA_ClientTypes extends ClientTypesShape
>(): RT_makePathManipulation<GPA_ClientTypes> {
	return Object.freeze({ setQueryParamsToPath, setDynamicParamToPath })

	function setQueryParamsToPath<IA_Route extends GetRouteWithQuery<GPA_ClientTypes> & string>(
		path: IA_Route,
		params: NoInfer<GET_Routes<GPA_ClientTypes>[IA_Route]["query"]>
	): IA_Route {
		if (!params) return path
		let queryString = "?"
		let index = 1
		for (const [key, value] of Object.entries(params)) {
			const ampersand = Object.keys(params).length === index ? "" : "&"
			if (Array.isArray(value)) {
				_handleArrayValue(key, value, ampersand)
				index++
				continue
			}
			queryString += `${key}=${value}${ampersand}`
			index++
		}
		return `${path}${queryString}` as IA_Route

		//* ---------- Helpers -----------------------------------------------

		function _handleArrayValue(key: string, value: unknown[], ampersand: string): void {
			for (const [i, val] of value.entries()) {
				const arrayAmpersand = i === value.length - 1 ? ampersand : "&"
				queryString += `${key}=${val}${arrayAmpersand}`
			}
		}
	}

	function setDynamicParamToPath<IA_Route extends GetRouteWitParam<GPA_ClientTypes>>(
		path: IA_Route,
		param: string
	): IA_Route {
		const pathWithoutParam = path.split(":")[0]
		if (!pathWithoutParam) return path
		return `${pathWithoutParam}${param}` as IA_Route
	}
}

type GET_Routes<ClientTypes extends ClientTypesShape> = ClientTypes["GET"] & ClientTypes["PAGE"]

type GetRouteWithQuery<ClientTypes extends ClientTypesShape> = {
	[K in keyof GET_Routes<ClientTypes>]: undefined extends GET_Routes<ClientTypes>[K]["query"] ? never : K
}[keyof GET_Routes<ClientTypes>]

type GetRouteWitParam<ClientTypes extends ClientTypesShape> = {
	[K in keyof GET_Routes<ClientTypes>]: K extends `${string}/:${string}` ? K : never
}[keyof GET_Routes<ClientTypes>]

interface RT_makePathManipulation<GPA_ClientTypes extends ClientTypesShape> {
	/*******************************************************************************
	 *
	 * Typed helper for setting query params to a PAGE or GET route.
	 *
	 * @param path The url of the GET route.
	 * @param params The query params in object format
	 *
	 * @returns The modified route correctly typed.
	 *
	 ******************************************************************************/

	readonly setQueryParamsToPath: <Route extends GetRouteWithQuery<GPA_ClientTypes> & string>(
		path: Route,
		params: NoInfer<GET_Routes<GPA_ClientTypes>[Route]["query"]>
	) => Route

	/*******************************************************************************
	 *
	 * Typed helper for setting a dynamic param to a PAGE or GET route.
	 *
	 * @param path The url of the GET  route.
	 * @param param The dynamic param in this format "/:param"
	 *
	 * @returns The modified route correctly typed.
	 *
	 ******************************************************************************/

	readonly setDynamicParamToPath: <Route extends GetRouteWitParam<GPA_ClientTypes>>(path: Route, param: string) => Route
}

//------------------------------------------------------------------------------
//
// Exposed Type Utils
//
//------------------------------------------------------------------------------

export type { BroadenDynamicParamRoutes as HAQ_BroadenDynamicParamRoutes } from "./types.js"
