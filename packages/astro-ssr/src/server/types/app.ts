//#region -------------------------------------------------- Type Imports

import type { EmptyObject, UnionToIntersection } from "@haq/utils/types"
import type { z } from "zod"
import type { HTTP_StatusCode } from "../../errors/types.js"
import type {
	AppConfig,
	AuthConfig,
	EMAIL_Route,
	ExcludeGenericRecord,
	MiddlewareResponse,
	NoSlash,
	PAGE_Route
} from "./dynamic.js"
import type { I_BaseRouteReturn, I_GET_RouteReturn, I_PAGE_RouteReturn, I_POST_RouteReturn } from "./internal.js"
import type { FileUploadData, I_RouterReqContext } from "./request-context.js"
import type {
	EmailRoutePrefix,
	ErrorRoute,
	ErrorRoutes,
	ExpressFlashResponse,
	ExpressUserBase,
	PartialMarkupShape,
	PartialRoutePrefix,
	RouteKind
} from "./static.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// makeServer.App return
//
//------------------------------------------------------------------------------

export type RT_App<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false,
	IA_Config extends AppConfig<PAGE_Route<GPA_RenderedRoutes>, GPA_ExpressUser>,
	IA_BaseURL extends string,
	IA_Routers extends App_Routers<IA_BaseURL>
> = {
	/*******************************************************************************
	 *
	 * The type to pass to Astro locals.
	 *
	 * @example
	 *
	 * ```ts
	 * // global.ts
	 *
	 * import type { AppTypes } from "./server.js"
	 *
	 * declare global {
	 *   namespace App {
	 *     interface Locals extends AppTypes["ASTRO_LOCALS"] {}
	 *   }
	 * }
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	ASTRO_LOCALS: {
		[R in keyof App_PAGE<IA_BaseURL, IA_Routers>]: "response" extends keyof App_PAGE<IA_BaseURL, IA_Routers>[R]
			? App_PAGE<IA_BaseURL, IA_Routers>[R]["response"] &
					([GPA_ExpressUser] extends [ExpressUserBase]
						? IA_Config extends AuthConfig<PAGE_Route<GPA_RenderedRoutes>, GPA_ExpressUser>
							? R extends IA_Config["AUTH_CONFIG"]["LOGIN_PAGE_ROUTE"]
								? ExpressFlashResponse
								: EmptyObject
							: EmptyObject
						: EmptyObject)
			: never
	} & UnionToIntersection<ExcludeGenericRecord<App_ExtractAllPartialTypes<IA_BaseURL, IA_Routers>>> &
		App_EmailRoutes<GPA_RenderedRoutes, IA_BaseURL, IA_Routers> &
		App_AstroErrorRoutes<IA_BaseURL, IA_Routers>

	/*******************************************************************************
	 *
	 * The type to pass to `makeFetch()` factory function.
	 *
	 ******************************************************************************/

	//NOTE: Reflect any changes here
	//LINK  packages/astro-ssr/src/client/types.ts:116

	CLIENT: {
		PAGE: App_PAGE<IA_BaseURL, IA_Routers>
		GET: App_GET<GPA_PartialMarkup, IA_BaseURL, IA_Routers>
		POST: App_POST<GPA_PartialMarkup, IA_BaseURL, IA_Routers>
	}

	/*******************************************************************************
	 *
	 * The type to pass to `defineEmailRenderer()` factory function.
	 *
	 ******************************************************************************/

	EMAIL_ROUTES: App_EmailRoutes<GPA_RenderedRoutes, IA_BaseURL, IA_Routers>

	/*******************************************************************************
	 *
	 * Type helpers to use when separating your middleware callbacks into separate files to avoid inlining.
	 *
	 ******************************************************************************/

	HELPERS: {
		ROUTER_CONTEXT: I_RouterReqContext<GPA_ExpressUser>
		MIDDLEWARE_RESPONSE: MiddlewareResponse<keyof App_PAGE<IA_BaseURL, IA_Routers>>
	}
}

//------------------------------------------------------------------------------
//
// App Routers
//
//------------------------------------------------------------------------------

export type App_Routers<BaseURL extends string> = {
	[B in BaseURL]: (I_PAGE_RouteReturn<B> | I_GET_RouteReturn<B> | I_POST_RouteReturn<B>)[]
}[BaseURL][]

//------------------------------------------------------------------------------
//
// Helper types
//
//------------------------------------------------------------------------------

type App_ExtractAllTypes<BaseURL extends string, Routers extends App_Routers<BaseURL>> = {
	[Router in Routers[number] as Routers[number][number]["__internal__"]["baseURL"]]: {
		[Route in Router[number] as Route["__internal__"]["route"]]: Route
	}
}

type App_ExtractByBase<BaseURL extends string, Routers extends App_Routers<BaseURL>> = {
	[B in keyof App_ExtractAllTypes<BaseURL, Routers>]: {
		[R in keyof App_ExtractAllTypes<BaseURL, Routers>[B]]: Extract<
			App_ExtractAllTypes<BaseURL, Routers>[B][R],
			{ __internal__: { baseURL: B } }
		>
	}
}

type App_NoNeverRoutes<BaseURL extends string, Routers extends App_Routers<BaseURL>> = {
	[B in keyof App_ExtractByBase<BaseURL, Routers> as App_ExtractByBase<BaseURL, Routers>[B] extends never
		? never
		: B]: {
		[R in keyof App_ExtractByBase<BaseURL, Routers>[B] as App_ExtractByBase<BaseURL, Routers>[B][R] extends never
			? never
			: R]: App_ExtractByBase<BaseURL, Routers>[B][R]
	}
}

type App_AllTypes<BaseURL extends string, Routers extends App_Routers<BaseURL>> = {
	[Kind in RouteKind]: {
		[B in keyof App_NoNeverRoutes<BaseURL, Routers>]: {
			[R in keyof App_NoNeverRoutes<BaseURL, Routers>[B]]: Extract<
				App_NoNeverRoutes<BaseURL, Routers>[B][R],
				{ __internal__: { kind: Kind } }
			>
		}
	}
}

type App_AllRoutesByKind<BaseURL extends string, Routers extends App_Routers<BaseURL>> = {
	[Kind in RouteKind]: UnionToIntersection<
		{
			[B in keyof App_AllTypes<BaseURL, Routers>[Kind]]: B extends string
				? {
						[R in keyof App_AllTypes<BaseURL, Routers>[Kind][B] as App_AllTypes<
							BaseURL,
							Routers
						>[Kind][B][R] extends never
							? never
							: R extends string
								? B extends "/"
									? R
									: `${B}${NoSlash<R>}`
								: never]: App_AllTypes<BaseURL, Routers>[Kind][B][R]
					}
				: never
		}[keyof App_AllTypes<BaseURL, Routers>[Kind]]
	>
}

type App_ExtractAllPartialTypes<BaseURL extends string, Routers extends App_Routers<BaseURL>> = {
	[B in keyof App_NoNeverRoutes<BaseURL, Routers>]: {
		[R in keyof App_NoNeverRoutes<BaseURL, Routers>[B]]: App_NoNeverRoutes<
			BaseURL,
			Routers
		>[B][R] extends I_BaseRouteReturn<B>
			? keyof App_NoNeverRoutes<BaseURL, Routers>[B][R]["__internal__"]["__T_partialRoutes"] extends PartialRoutePrefix
				? App_NoNeverRoutes<BaseURL, Routers>[B][R]["__internal__"]["__T_partialRoutes"]
				: never
			: never
	}[keyof App_NoNeverRoutes<BaseURL, Routers>[B]]
}[keyof App_NoNeverRoutes<BaseURL, Routers>]

type App_ExtractAllEmailTypes<BaseURL extends string, Routers extends App_Routers<BaseURL>> = {
	[B in keyof App_NoNeverRoutes<BaseURL, Routers>]: {
		[R in keyof App_NoNeverRoutes<BaseURL, Routers>[B]]: App_NoNeverRoutes<
			BaseURL,
			Routers
		>[B][R] extends I_BaseRouteReturn<B>
			? keyof App_NoNeverRoutes<BaseURL, Routers>[B][R]["__internal__"]["__T_emailRoutes"] extends EmailRoutePrefix
				? App_NoNeverRoutes<BaseURL, Routers>[B][R]["__internal__"]["__T_emailRoutes"]
				: never
			: never
	}[keyof App_NoNeverRoutes<BaseURL, Routers>[B]]
}[keyof App_NoNeverRoutes<BaseURL, Routers>]

//* ---------- ERROR -----------------------------------------------

type App_AstroErrorRoutes<BaseURL extends string, Routers extends App_Routers<BaseURL>> = {
	[R in keyof App_AllRoutesByKind<BaseURL, Routers>["PAGE"] as R extends ErrorRoute ? R : never]: App_AllRoutesByKind<
		BaseURL,
		Routers
	>["PAGE"][R] extends I_PAGE_RouteReturn<BaseURL>
		? App_AllRoutesByKind<BaseURL, Routers>["PAGE"][R]["T_response"] & {
				statusCode: HTTP_StatusCode[keyof HTTP_StatusCode]
			}
		: EmptyObject
}

//* ---------- PAGE  -----------------------------------------------

type App_PAGE<BaseURL extends string, Routers extends App_Routers<BaseURL>> = {
	[R in keyof App_AllRoutesByKind<BaseURL, Routers>["PAGE"] as R extends ErrorRoutes ? never : R]: App_AllRoutesByKind<
		BaseURL,
		Routers
	>["PAGE"][R] extends I_PAGE_RouteReturn<BaseURL>
		? {
				query: unknown extends z.infer<
					NonNullable<App_AllRoutesByKind<BaseURL, Routers>["PAGE"][R]["__internal__"]["query"]>
				>
					? undefined
					: z.infer<NonNullable<App_AllRoutesByKind<BaseURL, Routers>["PAGE"][R]["__internal__"]["query"]>>

				response: App_CleanClientResponse<App_AllRoutesByKind<BaseURL, Routers>["PAGE"][R]["T_response"]>
			}
		: EmptyObject
}

//* ---------- GET  -----------------------------------------------

type App_GET<PartialMarkup extends PartialMarkupShape, BaseURL extends string, Routers extends App_Routers<BaseURL>> = {
	[R in keyof App_AllRoutesByKind<BaseURL, Routers>["GET"]]: App_AllRoutesByKind<
		BaseURL,
		Routers
	>["GET"][R] extends I_GET_RouteReturn<BaseURL>
		? {
				query: unknown extends z.infer<
					NonNullable<App_AllRoutesByKind<BaseURL, Routers>["GET"][R]["__internal__"]["query"]>
				>
					? undefined
					: z.infer<NonNullable<App_AllRoutesByKind<BaseURL, Routers>["GET"][R]["__internal__"]["query"]>>
			} & App_GET_ResponseForClient<PartialMarkup, BaseURL, App_AllRoutesByKind<BaseURL, Routers>["GET"][R]>
		: EmptyObject
}

type App_GET_ResponseForClient<
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends string,
	R extends I_GET_RouteReturn<BaseURL>
> = {
	partialRoute: unknown extends R["__internal__"]["__T_fullPartialRoute"]
		? never
		: R["__internal__"]["__T_fullPartialRoute"]

	response: { success: true } & (R["__internal__"]["__T_fullPartialRoute"] extends keyof PartialMarkup
		? {
				body: PartialMarkup[R["__internal__"]["__T_fullPartialRoute"]]
			}
		: App_CleanClientResponse<R["T_response"]>)
}

//* ---------- POST -----------------------------------------------

type App_POST<
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends string,
	Routers extends App_Routers<BaseURL>
> = {
	[R in keyof App_AllRoutesByKind<BaseURL, Routers>["POST"]]: App_AllRoutesByKind<
		BaseURL,
		Routers
	>["POST"][R] extends I_POST_RouteReturn<BaseURL>
		? {
				body: unknown extends z.infer<
					NonNullable<App_AllRoutesByKind<BaseURL, Routers>["POST"][R]["__internal__"]["body"]>
				>
					? undefined
					: z.infer<NonNullable<App_AllRoutesByKind<BaseURL, Routers>["POST"][R]["__internal__"]["body"]>>
			} & App_POST_ResponseForClient<PartialMarkup, BaseURL, App_AllRoutesByKind<BaseURL, Routers>["POST"][R]>
		: EmptyObject
}

type App_POST_ResponseForClient<
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends string,
	R extends I_POST_RouteReturn<BaseURL>
> = {
	fileInputName: string extends R["__internal__"]["fileInputName"] ? never : R["__internal__"]["fileInputName"]
	partialRoute: unknown extends R["__internal__"]["__T_fullPartialRoute"]
		? never
		: R["__internal__"]["__T_fullPartialRoute"]

	response: { success: true } & (R["__internal__"]["__T_fullPartialRoute"] extends keyof PartialMarkup
		? {
				body: PartialMarkup[R["__internal__"]["__T_fullPartialRoute"]]
			}
		: App_CleanClientResponse<R["T_response"]>)

	fileUploadData: string extends NonNullable<R["__internal__"]["fileInputName"]>
		? never
		: FileUploadData<NonNullable<R["__internal__"]["fileInputName"]>, "client">
}

type App_CleanClientResponse<ClientResponse> = ClientResponse extends unknown
	? Omit<ClientResponse, "afterwareData" | "redirectTo">
	: never

//* ---------- EMAIL -----------------------------------------------

type App_AllEmailRoutes<BaseURL extends string, Routers extends App_Routers<BaseURL>> = UnionToIntersection<
	ExcludeGenericRecord<App_ExtractAllEmailTypes<BaseURL, Routers>>
>

type App_EmailRoutes<RenderedRoutes extends string, BaseURL extends string, Routers extends App_Routers<BaseURL>> = {
	[R in keyof App_AllEmailRoutes<BaseURL, Routers> as R extends EMAIL_Route<RenderedRoutes>
		? R
		: never]: App_AllEmailRoutes<BaseURL, Routers>[R]
}
