import type { EmptyObject, IsUnion, Sealed, UnknownObj } from "@haq/utils/types"
import type { I_ExposedAuthenticatedReqContext, I_RouteReqContext } from "./request-context.js"
import type { Router_AllPartialRoutes, Router_PartialAndEmailRoutes } from "./router.js"
import type {
	AstroSSRHandlerType,
	EmailRouteLiteral,
	EmailRoutePrefix,
	ErrorRoute,
	ExpressUserBase,
	NestedRoutePrefix,
	PartialMarkupShape,
	PartialRouteLiteral,
	PartialRoutePrefix,
	SubRoutePrefix
} from "./static.js"

//------------------------------------------------------------------------------
//
// App Config
//
//------------------------------------------------------------------------------

export type AppConfig<PageRoute extends string, ExpressUser extends ExpressUserBase | false> = {
	/*******************************************************************************
	 *
	 * Server Port number the server will listen to.
	 *
	 ******************************************************************************/

	readonly PORT: number

	/*******************************************************************************
	 *
	 * Boolean condition to check if you are running in dev mode.
	 *
	 * When true, it allows for using Vite's HMT dev mode while running a server from node.
	 *
	 ******************************************************************************/

	readonly IS_DEV_MODE: boolean

	/*******************************************************************************
	 *
	 * IP Address the server should listen to. (optional)
	 *
	 * Defaults to "0.0.0.0"
	 *
	 ******************************************************************************/

	readonly IP_ADDRESS?: `${number}.${number}.${number}.${number}`

	/*******************************************************************************
	 *
	 * Astro SSR Config
	 *
	 ******************************************************************************/

	readonly ASTRO_CONFIG: {
		/*******************************************************************************
		 *
		 * The Astro built client outDir.
		 *
		 * Usually is `dist/@astro/client`
		 *
		 ******************************************************************************/

		readonly CLIENT_DIR: string

		/*******************************************************************************
		 *
		 * The SSR handler provided by Astro's build.
		 *
		 * NOTE: Must at least build once before running hMR in dev mode
		 *
		 ******************************************************************************/

		readonly SSR_HANDLER: AstroSSRHandlerType
	}
} & ([ExpressUser] extends [ExpressUserBase] ? AuthConfig<PageRoute, ExpressUser> : EmptyObject)

export type GenericConfigWithAuth = AppConfig<string, ExpressUserBase>
export type GenericConfig = AppConfig<string, false> | GenericConfigWithAuth

//------------------------------------------------------------------------------
//
// Auth Config
//
//------------------------------------------------------------------------------

export type InferRoleFromExpressUser<ExpressUser extends ExpressUserBase | false> = ExpressUser extends {
	role: infer Role
}
	? Role
	: never
export type Roles<Role extends string> = Role[] | null | "public"

export type AuthConfig<PageRoute extends string, ExpressUser extends ExpressUserBase> = {
	/*******************************************************************************
	 *
	 * Auth Config (optional).
	 *
	 * Only required if provided an User type as a third type argument to `makeServer`.
	 *
	 ******************************************************************************/

	readonly AUTH_CONFIG: {
		/*******************************************************************************
		 *
		 * The session secret that will be used to authenticate your users.
		 *
		 * Usually will be from your environment variables.
		 *
		 ******************************************************************************/

		readonly SESSION_SECRET: string

		/*******************************************************************************
		 *
		 * The Astro login page route.
		 *
		 * Will be used for redirecting an unauthenticated user, or a failed log in attempt.
		 *
		 * Will provide an express flash response in your Astro page
		 *
		 ******************************************************************************/

		readonly LOGIN_PAGE_ROUTE: PageRoute

		/*******************************************************************************
		 *
		 * The callback to provide for redirecting an authenticated user.
		 *
		 * This will be called on a successful login, on a route where the user should not be authenticated, or on a route where the user is authenticated but unauthorized.
		 *
		 ******************************************************************************/

		readonly GET_AUTHENTICATED_REDIRECT_ROUTE: (role: InferRoleFromExpressUser<ExpressUser>) => PageRoute

		/*******************************************************************************
		 *
		 * The callback function to provide when looking up a user by their email and role.
		 *
		 * Usually calls your database and fetches the user.
		 *
		 ******************************************************************************/

		readonly GET_USER_BY_EMAIL_AND_ROLE: (
			email: string,
			role: InferRoleFromExpressUser<ExpressUser>
		) => Promise<ExpressUser | undefined>

		/*******************************************************************************
		 *
		 * The `name` attribute value used in your login `<form>` for the username input.
		 *
		 * Defaults to "email".
		 *
		 * (Optional)
		 *
		 ******************************************************************************/

		readonly USERNAME_FIELD?: string // defaults to "email"

		/*******************************************************************************
		 *
		 * The `name` attribute value used in your login `<form>` for the password input.
		 *
		 * Defaults to "password".
		 *
		 * (Optional)
		 *
		 ******************************************************************************/

		readonly PASSWORD_FIELD?: string // defaults to "password"

		/*******************************************************************************
		 *
		 * The afterware callback function to provide after a successful login.
		 *
		 * Useful if you want to send an email to the user, or do some behind the scenes work.
		 *
		 * (Optional)
		 *
		 ******************************************************************************/

		readonly LOGIN_SUCCESS_AFTERWARE?: AuthAfterware<ExpressUser>

		/*******************************************************************************
		 *
		 * The afterware callback function to provide after a successful logout.
		 *
		 * Useful if you want to send an email to the user, or do some behind the scenes work.
		 *
		 * (Optional)
		 *
		 ******************************************************************************/

		readonly LOGOUT_SUCCESS_AFTERWARE?: AuthAfterware<ExpressUser>
	}
}

type AuthAfterware<ExpressUser extends ExpressUserBase> = (
	context: I_ExposedAuthenticatedReqContext<ExpressUser>
) => void | Promise<void>

//------------------------------------------------------------------------------
//
// Route context arguments
//
//------------------------------------------------------------------------------

export type ExpressRolesObj<
	ExpressUser extends ExpressUserBase | false,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>
> = [ExpressUser] extends [ExpressUserBase] ? { roles: ExpRoles } : EmptyObject

//------------------------------------------------------------------------------
//
// Route middleware
//
//------------------------------------------------------------------------------

export type MiddlewareObj<
	RenderedRoutes extends string,
	ExpressUser extends ExpressUserBase | false,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	R extends string
> = {
	middleware?: (
		context: I_RouteReqContext<ExpressUser, ExpRoles, R>
	) => SealedPromiseOrNot<MiddlewareResponse<PAGE_Route<RenderedRoutes>>>
}

//------------------------------------------------------------------------------
//
// Route controller responses
//
//------------------------------------------------------------------------------

export type AfterwareResponse<Data extends UnknownObj> = string extends keyof Data
	? EmptyObject
	: { afterwareData: Sealed<Data> }

export type ControllerResponse<Data extends UnknownObj> = string extends keyof Data ? EmptyObject : Sealed<Data>

export type GetOrPostControllerResponse<
	RenderedRoutes extends string,
	Response extends UnknownObj,
	AfterwareData extends UnknownObj
> = Sealed<
	ControllerResponse<Response> &
		AfterwareResponse<AfterwareData> &
		(string extends keyof Response
			? {
					redirectTo?: PAGE_Route<RenderedRoutes>
				}
			: EmptyObject)
>

export type GetOrPostControllerResponseWithPartial<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<RenderedRoutes, PartialMarkup, BaseURL>,
	PartialRoute extends PartialRoutesWithoutPrefix<PARTIAL_Route<PartialMarkup>, BaseURL>,
	AfterwareData extends UnknownObj
> = Sealed<PartialResponse<RenderedRoutes, PartialMarkup, BaseURL, PartialAndEmailRoutes, PartialRoute>> &
	AfterwareResponse<AfterwareData>

type PartialResponse<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<RenderedRoutes, PartialMarkup, BaseURL>,
	PartialRoute extends PartialRoutesWithoutPrefix<PARTIAL_Route<PartialMarkup>, BaseURL>
> = PartialRoute extends keyof Router_AllPartialRoutes<RenderedRoutes, PartialMarkup, BaseURL, PartialAndEmailRoutes>
	? Router_AllPartialRoutes<RenderedRoutes, PartialMarkup, BaseURL, PartialAndEmailRoutes>[PartialRoute]
	: EmptyObject

//------------------------------------------------------------------------------
//
// Middleware response
//
//------------------------------------------------------------------------------

export type MiddlewareResponse<PageRoute extends string> =
	| {
			redirect?: never
			success: true
	  }
	| {
			success?: never
			redirect: PageRoute
	  }

//------------------------------------------------------------------------------
//
// Route string helpers
//
//------------------------------------------------------------------------------

export type NoSlash<R extends string> = R extends "/" ? "" : R

export type OnlyChildRoute<R extends string> = R extends NestedRoutePrefix ? never : R

export type ConcatenatedRoute<BaseURL extends string, R extends string> = `${BaseURL}${R extends "/" ? "" : R}`

export type ConcatenatedPartialRoute<BaseURL extends string, R extends string> = BaseURL extends "/"
	? R extends "/"
		? PartialRouteLiteral
		: `${PartialRouteLiteral}${R}`
	: `${PartialRouteLiteral}${BaseURL}${NoSlash<R>}`

//------------------------------------------------------------------------------
//
// Allowed Rendered Routes within a Router Context
//
//------------------------------------------------------------------------------

type StripLeadingSlash<S extends string> = S extends `/${infer R}` ? R : S

type RootRoutes<Routes extends string> = {
	[R in Routes]: StripLeadingSlash<R> extends `${string}/${string}` ? never : R
}[Routes]

type DirectLeafRootRoutes<Routes extends string, Roots extends string = RootRoutes<Routes>> = {
	[R in Roots]: R extends "/" ? "/" : Extract<Routes, `${R}/${string}`> extends never ? R : never
}[Roots]

type StrippedChildOnlyRoutes<Literal extends string, Route extends string, BaseURL extends string> = {
	[R in Route]: BaseURL extends "/"
		? R extends Literal
			? "/" // e.g /@partial/index.astro
			: R extends `${Literal}${BaseURL}${infer INF_R}`
				? `${BaseURL}${INF_R}` // e.g /@partial/some-route.astro
				: never
		: R extends `${Literal}${BaseURL}${infer INF_R extends "" | SubRoutePrefix}`
			? INF_R extends ""
				? "/" // e.g /@partial/sub-path/index.astro
				: INF_R // e.g /@partial/sub-path/some-route.astro
			: never
}[Route]

export type PartialRoutesWithoutPrefix<PartialRoute extends string, BaseURL extends string> = BaseURL extends "/"
	? DirectLeafRootRoutes<StrippedChildOnlyRoutes<PartialRouteLiteral, PartialRoute, BaseURL>>
	: DirectLeafRootRoutes<StrippedChildOnlyRoutes<PartialRouteLiteral, PartialRoute, BaseURL>> extends "/"
		? never
		: DirectLeafRootRoutes<StrippedChildOnlyRoutes<PartialRouteLiteral, PartialRoute, BaseURL>>

export type EmailRoutesWithoutPrefix<EmailRoute extends string, BaseURL extends string> = BaseURL extends "/"
	? DirectLeafRootRoutes<StrippedChildOnlyRoutes<EmailRouteLiteral, EmailRoute, BaseURL>>
	: DirectLeafRootRoutes<StrippedChildOnlyRoutes<EmailRouteLiteral, EmailRoute, BaseURL>> extends "/"
		? never
		: DirectLeafRootRoutes<StrippedChildOnlyRoutes<EmailRouteLiteral, EmailRoute, BaseURL>>

export type PAGE_SubRoute<BaseURL extends string, PageRoute extends string> = BaseURL extends "/"
	? DirectLeafRootRoutes<StrippedChildOnlyRoutes<"", PageRoute, BaseURL>>
	: DirectLeafRootRoutes<StrippedChildOnlyRoutes<"", PageRoute, BaseURL>> extends "/"
		? never
		: DirectLeafRootRoutes<StrippedChildOnlyRoutes<"", PageRoute, BaseURL>>

export type PAGE_Route<RenderedRoutes extends string> = {
	[R in RenderedRoutes]: R extends PartialRoutePrefix
		? never
		: R extends EmailRoutePrefix
			? never
			: R extends ErrorRoute
				? never
				: R
}[RenderedRoutes]

export type PARTIAL_Route<PartialMarkup extends PartialMarkupShape> = {
	[R in keyof PartialMarkup]: R extends PartialRoutePrefix ? R : never
}[keyof PartialMarkup]

export type EMAIL_Route<RenderedRoutes extends string> = {
	[R in RenderedRoutes]: R extends EmailRoutePrefix ? R : never
}[RenderedRoutes]

// for router base URL auto completion
export type SuggestedBaseURL<RenderedRoutes extends string> = PAGE_Route<RenderedRoutes> | ({} & SubRoutePrefix)

//------------------------------------------------------------------------------
//
// Utility Types
//
//------------------------------------------------------------------------------

export type SealedPromiseOrNot<T> = Sealed<T> | Promise<Sealed<T>>

export type IsDiscriminatedUnion<T, K extends keyof T> = IsUnion<T[K]>

export type ExcludeGenericRecord<T> =
	T extends Record<string, unknown>
		? string extends keyof T
			? never // It has a string index signature (generic Record)
			: T // It's a specific object
		: T

export type Exact<T, Shape> = T extends Shape ? (Exclude<keyof T, keyof Shape> extends never ? T : never) : never

type Primitive = string | number | boolean | bigint | symbol | null | undefined

export type DeepNoExtraKeys<T, Shape> = Shape extends Primitive
	? unknown
	: Shape extends readonly (infer ShapeItem)[]
		? T extends readonly (infer TItem)[]
			? DeepNoExtraKeys<TItem, ShapeItem>
			: never
		: Shape extends object
			? T extends object
				? {
						[K in Exclude<keyof T, keyof Shape>]: never
					} & {
						[K in keyof Shape]: K extends keyof T ? DeepNoExtraKeys<T[K], Shape[K]> : unknown
					}
				: never
			: unknown

export type DeepExact<T, Shape> =
	// Primitive values
	Shape extends Primitive
		? T extends Shape
			? T
			: never
		: // Arrays
			Shape extends readonly (infer ShapeItem)[]
			? T extends readonly (infer TItem)[]
				? readonly DeepExact<TItem, ShapeItem>[]
				: never
			: // Objects
				Shape extends object
				? T extends object
					? Exclude<keyof T, keyof Shape> extends never
						? {
								[K in keyof Shape]: K extends keyof T ? DeepExact<T[K], Shape[K]> : never
							}
						: never
					: never
				: never
