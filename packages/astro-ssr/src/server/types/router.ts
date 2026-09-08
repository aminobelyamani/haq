//#region -------------------------------------------------- Type Imports

import type { UnknownObj } from "@haq/utils/types"
import type {
	EMAIL_Route,
	EmailRoutesWithoutPrefix,
	MiddlewareResponse,
	NoSlash,
	PAGE_Route,
	PARTIAL_Route,
	PartialRoutesWithoutPrefix,
	SuggestedBaseURL
} from "./dynamic.js"
import type { RT_defineGETContext, RT_defineGETContextWithPartial } from "./get.js"
import type { RT_definePageContext } from "./page.js"
import type { RT_definePOSTContext, RT_definePOSTContextWithPartial } from "./post.js"
import type { I_RouterReqContext } from "./request-context.js"
import type { EmailRouteLiteral, ExpressUserBase, PartialMarkupShape, PartialRouteLiteral } from "./static.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// makeServer().defineRouter return
//
//------------------------------------------------------------------------------

export interface RT_createRouter<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false,
	IA_BaseURL extends SuggestedBaseURL<GPA_RenderedRoutes>,
	IA_PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>
> {
	/*******************************************************************************
	 *
	 * Factory that defines the PAGE context.
	 *
	 * @typeParam PA_Response - The type the Astro error page will receive as data (optional).
	 * @typeParam PA_AfterwareData - The type to pass to your afterware controller (optional).
	 *
	 * @example
	 * ```ts
	 * // main/index-page.ts
	 *
	 * import type { T_Router } from "./index.js"
	 *
	 * export function indexPage(Router: T_Router){
	 *   type AstroProps =  {title: string }
	 *
	 *   const route = Router.definePAGEContext<AstroProps>()({
	 *     route: "/",
	 *   })
	 *
	 *   type RT = typeof route.T_response // we use this to explicitly assign a return type to our controller to prevent any excess properties to be sent.
	 *
	 *   route.PAGE({
	 *     controller: (context): RT => {
	 *       // do stuff
	 *       return {
	 *         title: "Hello, World!",
	 *       }
	 *     }
	 *   })
	 *
	 *   return route
	 * }
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	readonly definePAGEContext: <
		PA_Response extends UnknownObj = UnknownObj,
		PA_AfterwareData extends UnknownObj = UnknownObj
	>() => RT_definePageContext<
		GPA_RenderedRoutes,
		GPA_PartialMarkup,
		GPA_ExpressUser,
		IA_BaseURL,
		IA_PartialAndEmailRoutes,
		PA_Response,
		PA_AfterwareData
	>

	/*******************************************************************************
	 *
	 * Factory that defines the GET context.
	 *
	 * @param isPartial Whether or not this route will return an Astro page partial (optional).
	 *
	 * @typeParam PA_Response - The type the server will send to client (optional).
	 * @typeParam PA_AfterwareData - The type to pass to your afterware controller (optional).
	 *
	 * @example
	 * ```ts
	 * // GET route that requires a query param and returns a json object.
	 * // main/som-get-route.ts
	 *
	 * import type { T_Router } from "./index.js"
	 *
	 * export function someGetRoute(Router: T_Router){
	 *   type Response =  {title: string }
	 *
	 *   const route = Router.defineGETContext<AstroProps>()({
	 *     route: "/",
	 *     query: z.object({
	 *       someProp: z.string()
	 *     })
	 *   })
	 *
	 *   type RT = typeof route.T_response // we use this to explicitly assign a return type to our controller to prevent any excess properties to be sent.
	 *
	 *   route.GET({
	 *     controller: (context): RT => {
	 *       const { someProp } = context.getQuery() // someProp will be defined and of type string
	 *
	 *       // do stuff
	 *       return {
	 *         title: "Hello, World!",
	 *       }
	 *     }
	 *   })
	 *
	 *   return route
	 * }
	 * ```
	 *
	 * @example
	 * ```ts
	 * // GET route that has an optional query param and returns an Astro partial page.
	 * // main/som-get-route.ts
	 *
	 * import type { T_Router } from "./index.js"
	 *
	 * export function someGetRoute(Router: T_Router){
	 *
	 *   const route = Router.defineGETContext(true)({
	 *     route: "/",
	 *     query: z.object({
	 *       someProp: z.string().optional()
	 *     }),
	 *     partialRoute: "/some-partial-route" // was defined in defineRouter()
	 *   })
	 *
	 *   type RT = typeof route.T_response // we use this to explicitly assign a return type to our controller to prevent any excess properties to be sent.
	 *
	 *   route.GET({
	 *     controller: (context): RT => {
	 *       const { someProp } = context.getQuery() // someProp will be string or undefined
	 *
	 *       // do stuff
	 *       return {
	 *         someProp: "Hello, World!", // this is the type defined in defineRouter()
	 *       }
	 *     }
	 *   })
	 *
	 *   return route
	 * }
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	// biome-ignore lint/style/useConsistentMethodSignatures: We need to use method style for proper function overloading
	defineGETContext<
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

	// biome-ignore lint/style/useConsistentMethodSignatures: We need to use method style for proper function overloading
	defineGETContext<PA_AfterwareData extends UnknownObj = UnknownObj>(
		isPartial: true
	): RT_defineGETContextWithPartial<
		GPA_RenderedRoutes,
		GPA_PartialMarkup,
		GPA_ExpressUser,
		IA_BaseURL,
		IA_PartialAndEmailRoutes,
		PA_AfterwareData
	>

	/*******************************************************************************
	 *
	 * Factory that defines the POST context.
	 *
	 * @param isPartial Whether or not this route will return an Astro page partial (optional).
	 *
	 * @typeParam PA_Response - The type the server will send to client (optional).
	 * @typeParam PA_AfterwareData - The type to pass to your afterware controller (optional).
	 *
	 * @example
	 * ```ts
	 * // POST route that requires a body and returns a json object.
	 * // main/som-post-route.ts
	 *
	 * import type { T_Router } from "./index.js"
	 *
	 * export function somePostRoute(Router: T_Router){
	 *   type Response =  {title: string }
	 *
	 *   const route = Router.definePOSTContext<AstroProps>()({
	 *     route: "/",
	 *     body: z.object({
	 *       someProp: z.string()
	 *     })
	 *   })
	 *
	 *   type RT = typeof route.T_response // we use this to explicitly assign a return type to our controller to prevent any excess properties to be sent.
	 *
	 *   route.POST({
	 *     controller: (context): RT => {
	 *       const { someProp } = context.getBody() // someProp will be defined and of type string
	 *
	 *       // do stuff
	 *       return {
	 *         title: "Hello, World!",
	 *       }
	 *     }
	 *   })
	 *
	 *   return route
	 * }
	 * ```
	 *
	 * @example
	 * ```ts
	 * // POST route that has an optional body prop and returns an Astro partial page.
	 * // main/som-get-route.ts
	 *
	 * import type { T_Router } from "./index.js"
	 *
	 * export function somePostRoute(Router: T_Router){
	 *
	 *   const route = Router.definePOSTContext(true)({
	 *     route: "/",
	 *     body: z.object({
	 *       someProp: z.string().optional()
	 *     }),
	 *     partialRoute: "/some-partial-route" // was defined in defineRouter()
	 *   })
	 *
	 *   type RT = typeof route.T_response // we use this to explicitly assign a return type to our controller to prevent any excess properties to be sent.
	 *
	 *   route.POST({
	 *     controller: (context): RT => {
	 *       const { someProp } = context.getBody() // someProp will be string or undefined
	 *
	 *       // do stuff
	 *       return {
	 *         someProp: "Hello, World!", // this is the type defined in defineRouter()
	 *       }
	 *     }
	 *   })
	 *
	 *   return route
	 * }
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	// biome-ignore lint/style/useConsistentMethodSignatures: We need to use method style for proper function overloading
	definePOSTContext<
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

	// biome-ignore lint/style/useConsistentMethodSignatures: We need to use method style for proper function overloading
	definePOSTContext<PA_AfterwareData extends UnknownObj = UnknownObj>(
		isPartial: true
	): RT_definePOSTContextWithPartial<
		GPA_RenderedRoutes,
		GPA_PartialMarkup,
		GPA_ExpressUser,
		IA_BaseURL,
		IA_PartialAndEmailRoutes,
		PA_AfterwareData
	>

	/*******************************************************************************
	 *
	 * Router middleware callback to provide.
	 *
	 * This will be called before any route specific middlware.
	 *
	 * @param context The router request context.
	 *
	 * NOTE: Must be defined before defining your routes.
	 *
	 * @example
	 * ```ts
	 * // main/index.ts
	 *
	 * import type { T_Server } from "./server.js" // your exported type from typeof makeServer()
	 *
	 * function makeRouter(Server: T_Server) {
	 *   const Router = Server.defineRouter("/")
	 *   Router.middleware((context) => {
	 *     // do stuff
	 *   })
	 *
	 *   return Router
	 * }
	 *
	 * export type T_Router = ReturnType<typeof makeRouter>
	 *
	 * export function main(Server: G_Server) {
	 *   const Router = makeRouter(Server)
	 *
	 *   return [indexPage(Router)]
	 * }
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	readonly middleware: (mw: Router_Middleware<GPA_RenderedRoutes, GPA_ExpressUser>) => void
}

//------------------------------------------------------------------------------
//
// Router second inferred argument: _T_partialAndEmailRoutes
//
//------------------------------------------------------------------------------

export type Router_PartialAndEmailRoutes<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>
> = ARG_PartialAndEmailRoutes<RenderedRoutes, PartialMarkup, BaseURL> extends [infer T] ? T : never

type ARG_PartialAndEmailRoutes<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>
> =
	PartialRoutesWithoutPrefix<PARTIAL_Route<PartialMarkup>, BaseURL> extends never
		? EmailRoutesWithoutPrefix<EMAIL_Route<RenderedRoutes>, BaseURL> extends never
			? never[]
			: [
					_T_partialAndEmailRoutes: Router_DefinedEmaillRoutes<RenderedRoutes, BaseURL> & {
						PARTIAL?: never
					}
				]
		: EmailRoutesWithoutPrefix<EMAIL_Route<RenderedRoutes>, BaseURL> extends never
			? [
					_T_partialAndEmailRoutes: Router_DefinedPartialRoutes<RenderedRoutes, PartialMarkup, BaseURL> & {
						EMAIL?: never
					}
				]
			: [
					_T_partialAndEmailRoutes: Router_DefinedEmaillRoutes<RenderedRoutes, BaseURL> &
						Router_DefinedPartialRoutes<RenderedRoutes, PartialMarkup, BaseURL>
				]

type Router_DefinedPartialRoutes<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>
> = {
	PARTIAL: {
		[K in PartialRoutesWithoutPrefix<PARTIAL_Route<PartialMarkup>, BaseURL>]: unknown
	}
}

type Router_DefinedEmaillRoutes<RenderedRoutes extends string, BaseURL extends SuggestedBaseURL<RenderedRoutes>> = {
	EMAIL: {
		[K in EmailRoutesWithoutPrefix<EMAIL_Route<RenderedRoutes>, BaseURL>]: unknown
	}
}

//------------------------------------------------------------------------------
//
// Router Middleware
//
//------------------------------------------------------------------------------

export type Router_Middleware<RenderedRoutes extends string, ExpressUser extends ExpressUserBase | false> = (
	context: I_RouterReqContext<ExpressUser>
) => MiddlewareResponse<PAGE_Route<RenderedRoutes>>

//------------------------------------------------------------------------------
//
// Internal Router Partial and Email Routes
//
//------------------------------------------------------------------------------

export type Router_InternalPartialAndEmailRoutes<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<RenderedRoutes, PartialMarkup, BaseURL>
> = {
	__T_partialRoutes: Router_PartialRoutes<RenderedRoutes, PartialMarkup, BaseURL, PartialAndEmailRoutes>
	__T_emailRoutes: Router_EmailRoutes<RenderedRoutes, PartialMarkup, BaseURL, PartialAndEmailRoutes>
}

export type Router_AllPartialRoutes<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<RenderedRoutes, PartialMarkup, BaseURL>
> = "PARTIAL" extends keyof [PartialAndEmailRoutes]["0"] ? [PartialAndEmailRoutes]["0"]["PARTIAL"] : never

type Router_PartialRoutes<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<RenderedRoutes, PartialMarkup, BaseURL>
> = {
	[R in keyof Router_AllPartialRoutes<RenderedRoutes, PartialMarkup, BaseURL, PartialAndEmailRoutes> as R extends string
		? BaseURL extends "/"
			? R extends "/"
				? PartialRouteLiteral
				: `${PartialRouteLiteral}${R}`
			: `${PartialRouteLiteral}${BaseURL}${NoSlash<R>}`
		: never]: Router_AllPartialRoutes<RenderedRoutes, PartialMarkup, BaseURL, PartialAndEmailRoutes>[R]
}

type Router_AllEmailRoutes<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<RenderedRoutes, PartialMarkup, BaseURL>
> = "EMAIL" extends keyof [PartialAndEmailRoutes]["0"] ? [PartialAndEmailRoutes]["0"]["EMAIL"] : never

type Router_EmailRoutes<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<RenderedRoutes, PartialMarkup, BaseURL>
> = {
	[R in keyof Router_AllEmailRoutes<RenderedRoutes, PartialMarkup, BaseURL, PartialAndEmailRoutes> as R extends string
		? BaseURL extends "/"
			? R extends "/"
				? EmailRouteLiteral
				: `${EmailRouteLiteral}${R}`
			: `${EmailRouteLiteral}${BaseURL}${NoSlash<R>}`
		: never]: Router_AllEmailRoutes<RenderedRoutes, PartialMarkup, BaseURL, PartialAndEmailRoutes>[R]
}
