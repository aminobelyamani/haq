/*******************************************************************************
 *
 * Server side module for building a type safe express app.
 *
 * @module
 *
 ******************************************************************************/

//#region -------------------------------------------------- Type Imports

import type { Sealed, UnknownObj } from "@haq/utils/types"
import type { App_Routers, RT_App } from "./types/app.js"
import type {
	AppConfig,
	DeepExact,
	DeepNoExtraKeys,
	GetOrPostControllerResponse,
	GetOrPostControllerResponseWithPartial,
	InferRoleFromExpressUser,
	PAGE_Route,
	PAGE_SubRoute,
	PARTIAL_Route,
	PartialRoutesWithoutPrefix,
	Roles,
	SuggestedBaseURL
} from "./types/dynamic.js"
import type { ErrorPAGE_Args, RT_createErrorContext } from "./types/error-page.js"
import type {
	GET_Args,
	GET_ArgsWithPartial,
	GET_ContextArgs,
	GET_ContextArgsWithPartial,
	RT_defineGETContext,
	RT_defineGETContextWithPartial
} from "./types/get.js"
import type {
	AppRoutes,
	GeneralAfterware,
	I_GET_RouteObj,
	I_GET_RouteReturn,
	I_GET_RouteReturnInternal,
	I_PAGE_RouteReturn,
	I_PAGE_RouteReturnInternal,
	I_POST_RouteObj,
	I_POST_RouteReturn,
	I_POST_RouteReturnInternal,
	InternalMiddleware,
	InternalRouteController,
	RouteControllerArgs
} from "./types/internal.js"
import type { PAGE_Args, PAGE_ContextArgs, PAGE_ControllerResponse, RT_definePageContext } from "./types/page.js"
import type {
	POST_Args,
	POST_ArgsWithPartial,
	POST_ContextArgs,
	POST_ContextArgsWithPartial,
	RT_definePOSTContext,
	RT_definePOSTContextWithPartial
} from "./types/post.js"
import type {
	Router_InternalPartialAndEmailRoutes,
	Router_Middleware,
	Router_PartialAndEmailRoutes,
	RT_createRouter
} from "./types/router.js"
import type { RT_makeServer } from "./types/server.js"
import type {
	AstroSSRHandlerType,
	EmailRoutePrefix,
	ErrorRoutes,
	ExpressUserBase,
	GET_QueryType,
	InternalRouteLiteral,
	PartialMarkupShape,
	POST_BodyType,
	SubRoutePrefix
} from "./types/static.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { _T, assertUnreachable } from "@haq/utils"
import { GLOBALS } from "../globals.js"
import { initExpressApp } from "./core/app.js"
import { MockRequest } from "./core/mock/mock-request.js"
import { MockResponse } from "./core/mock/mock-response.js"

//#endregion ----------------------------------------------- Module Imports

/*******************************************************************************
 *
 * Main entry point factory function for the server.
 *
 * @typeParam GPA_RenderedRoutes - The generated `HAQ_RenderedRoute` type.
 * @typeParam GPA_PartialMarkup - The generated `HAQ_PartialMarkup_X` type.
 * @typeParam GPA_ExpressUser - Your express user type (optional).
 *
 * @example
 *
 * ```ts
 * // In a SSR app with Auth
 *
 * type ExpressUser = {
 *   email: string;
 *   password: string;
 *   role: "ADMIN" | "CLIENT";
 * }
 *
 * const Server = makeServer<HAQ_RenderedRoute, HAQ_PartialMarkup_1, ExpressUser>()
 *
 * export type T_Server = typeof Server
 * // now you can use this type for defining your routers and error pages
 * ```
 *
 * @example
 *
 *```ts
 * // In a simple SSR app without Auth
 *
 * const Server = makeServer<HAQ_RenderedRoute, HAQ_PartialMarkup_1>()
 *
 * export type T_Server = typeof Server
 * // now you can use this type for defining your routers and error pages
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function makeServer<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false = false
>(): RT_makeServer<GPA_RenderedRoutes, GPA_PartialMarkup, GPA_ExpressUser> {
	//@ts-expect-error - The _T_partialAndEmailRoutes argument in defineRouter is exactly the same but some funky array mapping is going on
	return Object.freeze({
		App,
		defineRouter,
		defineErrorContext
	})

	//------------------------------------------------------------------------------
	//
	// App
	//
	//------------------------------------------------------------------------------

	function App<
		IA_Config extends AppConfig<PAGE_Route<GPA_RenderedRoutes>, GPA_ExpressUser>,
		IA_BaseURL extends string,
		IA_Routers extends App_Routers<IA_BaseURL>
	>(
		appConfig: IA_Config & DeepExact<IA_Config, AppConfig<PAGE_Route<GPA_RenderedRoutes>, GPA_ExpressUser>>,
		routers: IA_Routers
	): RT_App<GPA_RenderedRoutes, GPA_PartialMarkup, GPA_ExpressUser, IA_Config, IA_BaseURL, typeof routers> {
		_populateAllRoutes()

		return _T<RT_App<GPA_RenderedRoutes, GPA_PartialMarkup, GPA_ExpressUser, IA_Config, IA_BaseURL, typeof routers>>()

		function _populateAllRoutes(): void {
			const RESERVED_ROUTES = ["/@id", "/Users", "/@vite", "/@fs", "/node_modules", "/_astro", "/src"] as const

			const appRoutes: AppRoutes = []
			const getRouteSet: Set<string> = new Set()
			const postRouteSet: Set<string> = new Set()

			for (const router of routers) {
				_populateRouter(router)
			}

			initExpressApp({
				appConfig,
				appRoutes
			})

			//* ---------- Helpers -----------------------------------------------

			function _populateRouter(router: IA_Routers[number]): void {
				for (const route of router) {
					const { __internal__ } = route
					const sanitizedBaseUrl = _sanitizeBaseUrl(__internal__.baseURL)
					const validRoute = _validateRoute(__internal__.route, __internal__.baseURL)
					const fullPath = _removeTrailingSlash(`${sanitizedBaseUrl}${validRoute}`)

					switch (__internal__.kind) {
						case "PAGE":
						case "GET": {
							appRoutes.push(_constuctGETRouteObj(fullPath, __internal__))

							break
						}

						case "POST": {
							appRoutes.push(_constuctPOSTRouteObj(fullPath, __internal__))

							break
						}

						default:
							assertUnreachable(__internal__)
					}
				}
			}

			function _constuctGETRouteObj(
				fullPath: string,
				route: I_PAGE_RouteReturnInternal<IA_BaseURL> | I_GET_RouteReturnInternal<IA_BaseURL>
			): I_GET_RouteObj {
				if (getRouteSet.has(fullPath)) {
					throw new Error(`Duplicate GET route "${fullPath}"`)
				}

				getRouteSet.add(fullPath)

				const baseReturn = {
					kind: route.kind,
					fullPath,
					roles: route.roles === undefined ? undefined : route.roles,
					controllerArgs: route.getControllerArgs(),
					zodData: route.query as GET_QueryType,
					redirectFrom: route.redirectFrom,
					isErrorRoute: route.isErrorRoute
				}

				if (route.kind === "PAGE") return baseReturn

				return {
					...baseReturn,
					fullPartialPath: _constructFullPartialPath(route.baseURL, route.partialSubRoute)
				}
			}

			function _constuctPOSTRouteObj(fullPath: string, route: I_POST_RouteReturnInternal<IA_BaseURL>): I_POST_RouteObj {
				if (postRouteSet.has(fullPath)) {
					throw new Error(`Duplicate POST route "${fullPath}"`)
				}
				postRouteSet.add(fullPath)

				return {
					kind: route.kind,
					fullPath,
					roles: route.roles === undefined ? undefined : route.roles,
					controllerArgs: route.getControllerArgs(),
					zodData: route.body as POST_BodyType,
					fileInputName: route.fileInputName,
					fullPartialPath: _constructFullPartialPath(route.baseURL, route.partialSubRoute)
				}
			}

			function _sanitizeBaseUrl(baseURL: string): string {
				return baseURL === "/" ? "" : _validateBaseURL(baseURL)
			}

			function _validateBaseURL(baseURL: string): string {
				if (_isReservedRoute(baseURL)) {
					throw new Error(
						`Invalid base URL: ${baseURL}\n ${baseURL} is a reserved route used internally. Please choose another base URl.`
					)
				}
				if (!baseURL.match(GLOBALS.REGEX_EXPRESS_ROUTER_BASE_PATH)) {
					throw new Error(`Invalid base URL: ${baseURL}\nPlease only use numbers, letters, hyphens, and underscores.`)
				}
				return baseURL
			}

			function _validateRoute(route: string, baseURL: string): string {
				if (_isReservedRoute(route)) {
					throw new Error(
						`Invalid route: ${route}\n ${route} is a reserved route used internally. Please choose another route.`
					)
				}
				if (!route.match(GLOBALS.REGEX_EXPRESS_ROUTE_PATH)) {
					throw new Error(
						`Invalid path ${route} used in ${baseURL}\nA path may start with a colon but must be followed by only numbers, letters, hyphens, and underscores.`
					)
				}
				return route
			}

			function _isReservedRoute(route: string): boolean {
				return RESERVED_ROUTES.some((r) => route.startsWith(r))
			}

			function _constructFullPartialPath(baseURL: string, partialSubRoute: string | unknown): string | undefined {
				return partialSubRoute
					? _removeTrailingSlash(`/@partial${_sanitizeBaseUrl(baseURL)}${partialSubRoute}`)
					: undefined
			}

			function _removeTrailingSlash(route: string): string {
				const hasTrailingSlash = route.length > 1 && route.slice(-1) === "/"
				const lastIndexOfSlash = route.lastIndexOf("/")
				return hasTrailingSlash ? route.slice(0, lastIndexOfSlash) : route
			}
		}
	}

	//------------------------------------------------------------------------------
	//
	// Router
	//
	//------------------------------------------------------------------------------

	function defineRouter<
		IA_BaseURL extends SuggestedBaseURL<GPA_RenderedRoutes>,
		IA_PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>
	>(
		baseURL: IA_BaseURL extends `${InternalRouteLiteral}${string}` ? never : IA_BaseURL,
		..._T_partialAndEmailRoutes: Router_PartialAndEmailRoutes<
			GPA_RenderedRoutes,
			GPA_PartialMarkup,
			IA_BaseURL
		> extends never
			? []
			: [
					IA_PartialAndEmailRoutes &
						DeepNoExtraKeys<
							IA_PartialAndEmailRoutes,
							Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>
						>
				]
	): RT_createRouter<GPA_RenderedRoutes, GPA_PartialMarkup, GPA_ExpressUser, IA_BaseURL, IA_PartialAndEmailRoutes> {
		let __routerMiddleware: InternalMiddleware | undefined

		//* ---------- Exposed Methods -----------------------------------------------

		return Object.freeze({
			definePAGEContext,
			defineGETContext,
			definePOSTContext,
			middleware
		})

		//* ---------- Helpers -----------------------------------------------

		function _partialAndEmailRouteTypes(): Router_InternalPartialAndEmailRoutes<
			GPA_RenderedRoutes,
			GPA_PartialMarkup,
			IA_BaseURL,
			IA_PartialAndEmailRoutes
		> {
			return _T<
				Router_InternalPartialAndEmailRoutes<
					GPA_RenderedRoutes,
					GPA_PartialMarkup,
					IA_BaseURL,
					IA_PartialAndEmailRoutes
				>
			>()
		}

		//------------------------------------------------------------------------------
		//
		// PAGE
		//
		//------------------------------------------------------------------------------

		function definePAGEContext<
			PA_Response extends UnknownObj = UnknownObj,
			PA_AfterwareData extends UnknownObj = UnknownObj
		>(): RT_definePageContext<
			GPA_RenderedRoutes,
			GPA_PartialMarkup,
			GPA_ExpressUser,
			IA_BaseURL,
			IA_PartialAndEmailRoutes,
			PA_Response,
			PA_AfterwareData
		> {
			return (<
				IA_CurrentRoute extends PAGE_SubRoute<IA_BaseURL, PAGE_Route<GPA_RenderedRoutes>>,
				IA_ExpRoles extends Roles<InferRoleFromExpressUser<GPA_ExpressUser>>,
				IA_QT extends GET_QueryType,
				IA_RedirectFrom extends SubRoutePrefix
			>(
				args: PAGE_ContextArgs<
					GPA_RenderedRoutes,
					GPA_ExpressUser,
					IA_BaseURL,
					IA_CurrentRoute,
					IA_ExpRoles,
					IA_QT,
					IA_RedirectFrom
				>
			) => {
				type __ResponseType = PAGE_ControllerResponse<PA_Response, PA_AfterwareData>

				type __ControllerArgs = PAGE_Args<
					GPA_RenderedRoutes,
					GPA_ExpressUser,
					IA_BaseURL,
					PA_Response,
					PA_AfterwareData,
					IA_CurrentRoute,
					IA_ExpRoles,
					IA_QT
				>
				let __controllerArgs: RouteControllerArgs

				return {
					PAGE,
					T_response: _T<Sealed<__ResponseType>>(),
					__internal__: {
						baseURL,
						kind: "PAGE",
						route: args.route,
						roles: "roles" in args ? args.roles : undefined,
						query: args.query,
						redirectFrom: args.redirectFrom,
						getControllerArgs: _getControllerArgs,
						..._partialAndEmailRouteTypes()
					}
				} satisfies I_PAGE_RouteReturn<IA_BaseURL>

				function PAGE(controllerArgs: __ControllerArgs): void {
					__controllerArgs = {
						controller: controllerArgs.controller as unknown as InternalRouteController,
						middleware: [],
						afterware: controllerArgs.afterware as unknown as GeneralAfterware
					}

					if (__routerMiddleware) {
						__controllerArgs.middleware.push(__routerMiddleware)
					}

					if (controllerArgs.middleware) {
						__controllerArgs.middleware.push(
							controllerArgs.middleware as unknown as NonNullable<RouteControllerArgs["middleware"]>[number]
						)
					}
				}

				function _getControllerArgs(): RouteControllerArgs {
					return __controllerArgs
				}
			}) as RT_definePageContext<
				GPA_RenderedRoutes,
				GPA_PartialMarkup,
				GPA_ExpressUser,
				IA_BaseURL,
				IA_PartialAndEmailRoutes,
				PA_Response,
				PA_AfterwareData
			>
		}

		//------------------------------------------------------------------------------
		//
		// GET
		//
		//------------------------------------------------------------------------------

		function defineGETContext<
			PA_Response extends UnknownObj = UnknownObj,
			PA_AfterwareData extends UnknownObj = UnknownObj
		>(): RT_defineGETContext<
			GPA_RenderedRoutes,
			GPA_PartialMarkup,
			GPA_ExpressUser,
			IA_BaseURL,
			IA_PartialAndEmailRoutes,
			PA_Response,
			PA_AfterwareData
		>
		function defineGETContext<PA_AfterwareData extends UnknownObj = UnknownObj>(
			isPartial: true
		): RT_defineGETContextWithPartial<
			GPA_RenderedRoutes,
			GPA_PartialMarkup,
			GPA_ExpressUser,
			IA_BaseURL,
			IA_PartialAndEmailRoutes,
			PA_AfterwareData
		>

		function defineGETContext<
			PA_Response extends UnknownObj = UnknownObj,
			PA_AfterwareData extends UnknownObj = UnknownObj
		>(
			isPartial?: true
		):
			| RT_defineGETContext<
					GPA_RenderedRoutes,
					GPA_PartialMarkup,
					GPA_ExpressUser,
					IA_BaseURL,
					IA_PartialAndEmailRoutes,
					PA_Response,
					PA_AfterwareData
			  >
			| RT_defineGETContextWithPartial<
					GPA_RenderedRoutes,
					GPA_PartialMarkup,
					GPA_ExpressUser,
					IA_BaseURL,
					IA_PartialAndEmailRoutes,
					PA_AfterwareData
			  > {
			return (<
				IA_CurrentRoute extends SubRoutePrefix,
				IA_ExpRoles extends Roles<InferRoleFromExpressUser<GPA_ExpressUser>>,
				IA_QT extends GET_QueryType,
				IA_PartialRoute extends PartialRoutesWithoutPrefix<PARTIAL_Route<GPA_PartialMarkup>, IA_BaseURL>,
				IA_RedirectFrom extends SubRoutePrefix
			>(
				args:
					| GET_ContextArgs<
							GPA_RenderedRoutes,
							GPA_ExpressUser,
							IA_BaseURL,
							IA_CurrentRoute,
							IA_ExpRoles,
							IA_QT,
							IA_RedirectFrom
					  >
					| GET_ContextArgsWithPartial<
							GPA_RenderedRoutes,
							GPA_PartialMarkup,
							GPA_ExpressUser,
							IA_BaseURL,
							IA_CurrentRoute,
							IA_ExpRoles,
							IA_QT,
							IA_PartialRoute,
							IA_RedirectFrom
					  >
			) => {
				if (isPartial) return _handlePartialContext()
				return _handleGetContext()

				//* ---------- Helpers -----------------------------------------------

				function _handlePartialContext(): I_GET_RouteReturn<IA_BaseURL> {
					type __ResponseType = GetOrPostControllerResponseWithPartial<
						GPA_RenderedRoutes,
						GPA_PartialMarkup,
						IA_BaseURL,
						IA_PartialAndEmailRoutes,
						IA_PartialRoute,
						PA_AfterwareData
					>

					let __controllerArgs: RouteControllerArgs

					return {
						GET,
						T_response: _T<Sealed<__ResponseType>>(),
						__internal__: {
							baseURL,
							kind: "GET",
							route: args.route,
							roles: "roles" in args ? args.roles : undefined,
							query: args.query,
							partialSubRoute: "partialRoute" in args ? args.partialRoute : undefined,
							redirectFrom: args.redirectFrom,
							getControllerArgs: _getControllerArgs,
							..._partialAndEmailRouteTypes()
						}
					} satisfies I_GET_RouteReturn<IA_BaseURL>

					function GET(
						controllerArgs: GET_ArgsWithPartial<
							GPA_RenderedRoutes,
							GPA_PartialMarkup,
							GPA_ExpressUser,
							IA_BaseURL,
							IA_PartialAndEmailRoutes,
							PA_AfterwareData,
							IA_CurrentRoute,
							IA_ExpRoles,
							IA_QT,
							IA_PartialRoute,
							IA_RedirectFrom
						>
					): void {
						__controllerArgs = {
							controller: controllerArgs.controller as unknown as InternalRouteController,
							middleware: [],
							afterware: controllerArgs.afterware as unknown as GeneralAfterware
						}

						if (__routerMiddleware) {
							__controllerArgs.middleware.push(__routerMiddleware)
						}

						if (controllerArgs.middleware) {
							__controllerArgs.middleware.push(
								controllerArgs.middleware as unknown as NonNullable<RouteControllerArgs["middleware"]>[number]
							)
						}
					}

					function _getControllerArgs(): RouteControllerArgs {
						return __controllerArgs
					}
				}

				function _handleGetContext(): I_GET_RouteReturn<IA_BaseURL> {
					type __ResponseType = GetOrPostControllerResponse<GPA_RenderedRoutes, PA_Response, PA_AfterwareData>

					let __controllerArgs: RouteControllerArgs

					return {
						GET,
						T_response: _T<Sealed<__ResponseType>>(),
						__internal__: {
							baseURL,
							kind: "GET",
							route: args.route,
							roles: "roles" in args ? args.roles : undefined,
							query: args.query,
							redirectFrom: args.redirectFrom,
							getControllerArgs: _getControllerArgs,
							..._partialAndEmailRouteTypes()
						}
					} satisfies I_GET_RouteReturn<IA_BaseURL>

					function GET(
						controllerArgs: GET_Args<
							GPA_RenderedRoutes,
							GPA_ExpressUser,
							IA_BaseURL,
							PA_Response,
							PA_AfterwareData,
							IA_CurrentRoute,
							IA_ExpRoles,
							IA_QT,
							IA_RedirectFrom
						>
					): void {
						__controllerArgs = {
							controller: controllerArgs.controller as unknown as InternalRouteController,
							middleware: [],
							afterware: controllerArgs.afterware as unknown as GeneralAfterware
						}

						if (__routerMiddleware) {
							__controllerArgs.middleware.push(__routerMiddleware)
						}

						if (controllerArgs.middleware) {
							__controllerArgs.middleware.push(
								controllerArgs.middleware as unknown as NonNullable<RouteControllerArgs["middleware"]>[number]
							)
						}
					}

					function _getControllerArgs(): RouteControllerArgs {
						return __controllerArgs
					}
				}
			}) as
				| RT_defineGETContext<
						GPA_RenderedRoutes,
						GPA_PartialMarkup,
						GPA_ExpressUser,
						IA_BaseURL,
						IA_PartialAndEmailRoutes,
						PA_Response,
						PA_AfterwareData
				  >
				| RT_defineGETContextWithPartial<
						GPA_RenderedRoutes,
						GPA_PartialMarkup,
						GPA_ExpressUser,
						IA_BaseURL,
						IA_PartialAndEmailRoutes,
						PA_AfterwareData
				  >
		}

		//------------------------------------------------------------------------------
		//
		// POST
		//
		//------------------------------------------------------------------------------

		function definePOSTContext<
			PA_Response extends UnknownObj = UnknownObj,
			PA_AfterwareData extends UnknownObj = UnknownObj
		>(): RT_definePOSTContext<
			GPA_RenderedRoutes,
			GPA_PartialMarkup,
			GPA_ExpressUser,
			IA_BaseURL,
			IA_PartialAndEmailRoutes,
			PA_Response,
			PA_AfterwareData
		>
		function definePOSTContext<PA_AfterwareData extends UnknownObj = UnknownObj>(
			isPartial: true
		): RT_definePOSTContextWithPartial<
			GPA_RenderedRoutes,
			GPA_PartialMarkup,
			GPA_ExpressUser,
			IA_BaseURL,
			IA_PartialAndEmailRoutes,
			PA_AfterwareData
		>

		function definePOSTContext<
			PA_Response extends UnknownObj = UnknownObj,
			PA_AfterwareData extends UnknownObj = UnknownObj
		>(
			isPartial?: true
		):
			| RT_definePOSTContext<
					GPA_RenderedRoutes,
					GPA_PartialMarkup,
					GPA_ExpressUser,
					IA_BaseURL,
					IA_PartialAndEmailRoutes,
					PA_Response,
					PA_AfterwareData
			  >
			| RT_definePOSTContextWithPartial<
					GPA_RenderedRoutes,
					GPA_PartialMarkup,
					GPA_ExpressUser,
					IA_BaseURL,
					IA_PartialAndEmailRoutes,
					PA_AfterwareData
			  > {
			return (<
				IA_CurrentRoute extends SubRoutePrefix,
				IA_ExpRoles extends Roles<InferRoleFromExpressUser<GPA_ExpressUser>>,
				IA_QT extends POST_BodyType,
				IA_PartialRoute extends PartialRoutesWithoutPrefix<PARTIAL_Route<GPA_PartialMarkup>, IA_BaseURL>,
				IA_FileInputName extends string
			>(
				args:
					| POST_ContextArgs<GPA_ExpressUser, IA_CurrentRoute, IA_ExpRoles, IA_QT, IA_FileInputName>
					| POST_ContextArgsWithPartial<
							GPA_RenderedRoutes,
							GPA_PartialMarkup,
							GPA_ExpressUser,
							IA_BaseURL,
							IA_CurrentRoute,
							IA_ExpRoles,
							IA_QT,
							IA_FileInputName,
							IA_PartialRoute
					  >
			) => {
				if (isPartial) return _handlePartialContext()
				return _handlePostContext()

				//* ---------- Helpers -----------------------------------------------

				function _handlePartialContext(): I_POST_RouteReturn<IA_BaseURL> {
					type __ResponseType = GetOrPostControllerResponseWithPartial<
						GPA_RenderedRoutes,
						GPA_PartialMarkup,
						IA_BaseURL,
						IA_PartialAndEmailRoutes,
						IA_PartialRoute,
						PA_AfterwareData
					>

					let __controllerArgs: RouteControllerArgs
					return {
						POST,
						T_response: _T<__ResponseType>(),
						__internal__: {
							baseURL,
							kind: "POST",
							route: args.route,
							roles: "roles" in args ? args.roles : undefined,
							body: args.body,
							partialSubRoute: "partialRoute" in args ? args.partialRoute : undefined,
							fileInputName: args.fileInputName as IA_FileInputName,
							getControllerArgs: _getControllerArgs,
							..._partialAndEmailRouteTypes()
						}
					} satisfies I_POST_RouteReturn<IA_BaseURL>

					function POST(
						controllerArgs: POST_ArgsWithPartial<
							GPA_RenderedRoutes,
							GPA_PartialMarkup,
							GPA_ExpressUser,
							IA_BaseURL,
							IA_PartialAndEmailRoutes,
							PA_AfterwareData,
							IA_CurrentRoute,
							IA_ExpRoles,
							IA_QT,
							IA_FileInputName,
							IA_PartialRoute
						>
					): void {
						__controllerArgs = {
							controller: controllerArgs.controller as unknown as InternalRouteController,
							middleware: [],
							afterware: controllerArgs.afterware as unknown as GeneralAfterware
						}

						if (__routerMiddleware) {
							__controllerArgs.middleware.push(__routerMiddleware)
						}

						if (controllerArgs.middleware) {
							__controllerArgs.middleware.push(
								controllerArgs.middleware as unknown as NonNullable<RouteControllerArgs["middleware"]>[number]
							)
						}
					}

					function _getControllerArgs(): RouteControllerArgs {
						return __controllerArgs
					}
				}

				function _handlePostContext(): I_POST_RouteReturn<IA_BaseURL> {
					type __ResponseType = GetOrPostControllerResponse<GPA_RenderedRoutes, PA_Response, PA_AfterwareData>

					let __controllerArgs: RouteControllerArgs

					return {
						POST,
						T_response: _T<__ResponseType>(),
						__internal__: {
							baseURL,
							kind: "POST",
							route: args.route,
							roles: "roles" in args ? args.roles : undefined,
							body: args.body,
							fileInputName: args.fileInputName as IA_FileInputName,
							getControllerArgs: _getControllerArgs,
							..._partialAndEmailRouteTypes()
						}
					} satisfies I_POST_RouteReturn<IA_BaseURL>

					function POST(
						controllerArgs: POST_Args<
							GPA_RenderedRoutes,
							GPA_ExpressUser,
							PA_Response,
							PA_AfterwareData,
							IA_CurrentRoute,
							IA_ExpRoles,
							IA_QT,
							IA_FileInputName
						>
					): void {
						__controllerArgs = {
							controller: controllerArgs.controller as unknown as InternalRouteController,
							middleware: [],
							afterware: controllerArgs.afterware as unknown as GeneralAfterware
						}

						if (__routerMiddleware) {
							__controllerArgs.middleware.push(__routerMiddleware)
						}

						if (controllerArgs.middleware) {
							__controllerArgs.middleware.push(
								controllerArgs.middleware as unknown as NonNullable<RouteControllerArgs["middleware"]>[number]
							)
						}
					}

					function _getControllerArgs(): RouteControllerArgs {
						return __controllerArgs
					}
				}
			}) as
				| RT_definePOSTContext<
						GPA_RenderedRoutes,
						GPA_PartialMarkup,
						GPA_ExpressUser,
						IA_BaseURL,
						IA_PartialAndEmailRoutes,
						PA_Response,
						PA_AfterwareData
				  >
				| RT_definePOSTContextWithPartial<
						GPA_RenderedRoutes,
						GPA_PartialMarkup,
						GPA_ExpressUser,
						IA_BaseURL,
						IA_PartialAndEmailRoutes,
						PA_AfterwareData
				  >
		}

		//------------------------------------------------------------------------------
		//
		// Middleware
		//
		//------------------------------------------------------------------------------

		function middleware(mw: Router_Middleware<GPA_RenderedRoutes, GPA_ExpressUser>): void {
			__routerMiddleware = mw as unknown as InternalMiddleware
		}
	}

	//------------------------------------------------------------------------------
	//
	// Error context
	//
	//------------------------------------------------------------------------------

	function defineErrorContext<PA_Response extends UnknownObj = UnknownObj>(): RT_createErrorContext<
		GPA_RenderedRoutes,
		PA_Response
	> {
		return <IA_ErrorRoute extends ErrorRoutes>(
			route: IA_ErrorRoute extends GPA_RenderedRoutes ? IA_ErrorRoute : never
		) => {
			let __controllerArgs: RouteControllerArgs

			return {
				PAGE,
				T_response: _T<Sealed<PA_Response>>(),
				__internal__: {
					isErrorRoute: true,
					kind: "PAGE",
					baseURL: "/",
					route: route as IA_ErrorRoute,
					getControllerArgs: _getControllerArgs,
					roles: undefined,
					query: undefined,
					redirectFrom: undefined,
					__T_partialRoutes: _T<never>(),
					__T_emailRoutes: _T<never>()
				}
			} satisfies I_PAGE_RouteReturn<"/">

			function PAGE(controllerArgs: ErrorPAGE_Args<PA_Response>): void {
				__controllerArgs = controllerArgs as unknown as RouteControllerArgs
			}

			function _getControllerArgs(): RouteControllerArgs {
				return __controllerArgs
			}
		}
	}
}

/*******************************************************************************
 *
 * Factory function that returns a function to render Astro `/@email` pages.
 *
 * @typeParam GPA_EmailRoutes - The exposed `EMAIL_ROUTES` type returned from your App.
 *
 * @param ssrHandler The SSR handler provided by Astro's build.
 *
 * NOTE: Does not work with Vite's HMT dev mode. Must build to visualize any changes/
 *
 * @example
 * ```ts
 * import { defineEmailRenderer } from "@haq/astro-ssr"
 *
 * export const renderEmail = defineEmailRenderer<App["EMAIL_ROUTES"]>(ssrHandler)
 * // now you you can use that anywhere in your back end to send emails.
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function defineEmailRenderer<GPA_EmailRoutes extends EmailRoutesShape>(
	ssrHandler: AstroSSRHandlerType
): RT_defineEmailRenderer<GPA_EmailRoutes> {
	return <IA_EmailRoute extends keyof GPA_EmailRoutes & string>(
		path: IA_EmailRoute,
		data: NoInfer<GPA_EmailRoutes[IA_EmailRoute]>
	) => {
		const locals = {
			[path]: data
		}
		// biome-ignore lint/suspicious/noEmptyBlockStatements: we just need to pass an empty callback to represent the next function
		const next = (): void => {}
		ssrHandler(new MockRequest({ url: path }), new MockResponse(), next, locals)
	}
}

type RT_defineEmailRenderer<GPA_EmailRoutes extends EmailRoutesShape> = <
	IA_EmailRoute extends keyof GPA_EmailRoutes & string
>(
	path: IA_EmailRoute,
	data: NoInfer<GPA_EmailRoutes[IA_EmailRoute]>
) => void

type EmailRoutesShape = {
	[route: EmailRoutePrefix]: unknown
}
