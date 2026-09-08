/*******************************************************************************
 *
 * Broaden dynamic routes with a param. Converts `/route/:param` to `/route/string` .
 *
 * @typeParam T - The string union type of routes.
 * @returns The type with the broadened types for dynamic routes.
 ******************************************************************************/

export type BroadenDynamicParamRoutes<T extends string> = {
	[K in T]: BroadenHelpers<T>
}[T]

type BroadenHelpers<T extends string> = T extends `/${infer R}/:${string}` ? `/${R}/${string}` : T
