//#region -------------------------------------------------- Type Imports

import type { MiddlewareResponse, Roles } from "./dynamic.js"
import type { I_InternalReqContext } from "./request-context.js"
import type { ExpressFlash, ExpressUserBase, GET_QueryType, POST_BodyType, RouteKind } from "./static.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// Internal Route returned types
//
//------------------------------------------------------------------------------

export interface I_BaseRouteReturn<BaseURL extends string> {
	T_response: unknown
	__internal__: I_BaseRouteReturnInternal<BaseURL>
}

interface I_BaseRouteReturnInternal<BaseURL extends string> {
	kind: RouteKind
	baseURL: BaseURL
	route: string
	roles: Roles<string> | undefined
	__T_partialRoutes: Record<string, unknown>
	__T_emailRoutes: Record<string, unknown>
	getControllerArgs: () => RouteControllerArgs
}

export interface I_PAGE_RouteReturn<BaseURL extends string> extends I_BaseRouteReturn<BaseURL> {
	PAGE: unknown
	__internal__: I_PAGE_RouteReturnInternal<BaseURL>
}

export interface I_PAGE_RouteReturnInternal<BaseURL extends string> extends I_BaseRouteReturnInternal<BaseURL> {
	kind: "PAGE"
	query: unknown
	redirectFrom: string | undefined
	isErrorRoute?: true
}

export interface I_GET_RouteReturn<BaseURL extends string> extends I_BaseRouteReturn<BaseURL> {
	GET: unknown
	__internal__: I_GET_RouteReturnInternal<BaseURL>
}

export interface I_GET_RouteReturnInternal<BaseURL extends string> extends I_BaseRouteReturnInternal<BaseURL> {
	kind: "GET"
	query: unknown
	partialSubRoute?: unknown
	__T_fullPartialRoute?: unknown
	redirectFrom: string | undefined
	isErrorRoute?: true
}

export interface I_POST_RouteReturn<BaseURL extends string> extends I_BaseRouteReturn<BaseURL> {
	POST: unknown
	__internal__: I_POST_RouteReturnInternal<BaseURL>
}

export interface I_POST_RouteReturnInternal<BaseURL extends string> extends I_BaseRouteReturnInternal<BaseURL> {
	kind: "POST"
	body: unknown
	fileInputName: string | undefined
	partialSubRoute?: unknown
	__T_fullPartialRoute?: unknown
}

//------------------------------------------------------------------------------
//
// Internal constructed route objects
//
//------------------------------------------------------------------------------

interface I_BaseRouteObj {
	kind: RouteKind
	fullPath: string
	roles?: Roles<string> | undefined
	controllerArgs: RouteControllerArgs
}

export interface I_GET_RouteObj extends I_BaseRouteObj {
	kind: "GET" | "PAGE"
	zodData?: GET_QueryType | undefined
	redirectFrom?: string | undefined
	isErrorRoute?: true | undefined
	fullPartialPath?: string | undefined
}

export interface I_POST_RouteObj extends I_BaseRouteObj {
	kind: "POST"
	zodData?: POST_BodyType | undefined
	fileInputName?: string | undefined
	fullPartialPath?: string | undefined
}

export type AppRoute = I_GET_RouteObj | I_POST_RouteObj
export type AppRoutes = AppRoute[]

//------------------------------------------------------------------------------
//
// Internal controllers
//
//------------------------------------------------------------------------------

export type InternalAfterware = (context: I_InternalReqContext<ExpressUserBase>) => void | Promise<void>

export type InternalRouteControllerResponse = {
	afterwareData?: unknown
	redirectTo?: string
	success?: true // injected internally
	expressFlash?: ExpressFlash // injected internally
	statusCode?: number // injected internally
}
export type InternalRouteController = (
	context: I_InternalReqContext<ExpressUserBase>
) => InternalRouteControllerResponse | Promise<InternalRouteControllerResponse>

export type InternalMiddleware = (
	context: I_InternalReqContext<ExpressUserBase>,
	route: AppRoute
) => MiddlewareResponse<string> | Promise<MiddlewareResponse<string>>

export type GeneralAfterware = (context: I_InternalReqContext<ExpressUserBase>, data: unknown) => void | Promise<void>

export type RouteControllerArgs = {
	controller: InternalRouteController
	middleware: InternalMiddleware[]
	afterware?: GeneralAfterware | undefined
}
