//#region -------------------------------------------------- Type Imports

import type { UnknownObj } from "@haq/utils/types"
import type {
	ConcatenatedPartialRoute,
	ConcatenatedRoute,
	ExpressRolesObj,
	GetOrPostControllerResponse,
	GetOrPostControllerResponseWithPartial,
	InferRoleFromExpressUser,
	MiddlewareObj,
	NoSlash,
	OnlyChildRoute,
	PAGE_Route,
	PARTIAL_Route,
	PartialRoutesWithoutPrefix,
	Roles,
	SealedPromiseOrNot,
	SuggestedBaseURL
} from "./dynamic.js"
import type { RouteControllerArgs } from "./internal.js"
import type { I_GET_Context } from "./request-context.js"
import type { Router_InternalPartialAndEmailRoutes, Router_PartialAndEmailRoutes } from "./router.js"
import type { ExpressUserBase, GET_QueryType, NestedRoutePrefix, PartialMarkupShape, SubRoutePrefix } from "./static.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// makeServer().defineRouter().defineGETContext() return
//
//------------------------------------------------------------------------------

export type RT_defineGETContext<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false,
	IA_BaseURL extends SuggestedBaseURL<GPA_RenderedRoutes>,
	IA_PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>,
	PA_Response extends UnknownObj,
	PA_AfterwareData extends UnknownObj
> = <
	IA_CurrentRoute extends SubRoutePrefix,
	IA_ExpRoles extends Roles<InferRoleFromExpressUser<GPA_ExpressUser>>,
	IA_QT extends GET_QueryType,
	IA_RedirectFrom extends SubRoutePrefix
>(
	args: GET_ContextArgs<
		GPA_RenderedRoutes,
		GPA_ExpressUser,
		IA_BaseURL,
		IA_CurrentRoute,
		IA_ExpRoles,
		IA_QT,
		IA_RedirectFrom
	>
) => I_GetRouteContext<
	GPA_RenderedRoutes,
	GPA_PartialMarkup,
	GPA_ExpressUser,
	IA_BaseURL,
	IA_PartialAndEmailRoutes,
	PA_Response,
	PA_AfterwareData,
	IA_CurrentRoute,
	IA_ExpRoles,
	IA_QT,
	IA_RedirectFrom
>

interface I_GetRouteContext<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false,
	IA_BaseURL extends SuggestedBaseURL<GPA_RenderedRoutes>,
	IA_PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>,
	PA_Response extends UnknownObj,
	PA_AfterwareData extends UnknownObj,
	IA_CurrentRoute extends SubRoutePrefix,
	IA_ExpRoles extends Roles<InferRoleFromExpressUser<GPA_ExpressUser>>,
	IA_QT extends GET_QueryType,
	IA_RedirectFrom extends SubRoutePrefix
> {
	/*******************************************************************************
	 *
	 * GET controller.
	 *
	 * @param getArgs Object to provide for controller, middleware, and afterware.
	 *
	 ******************************************************************************/

	readonly GET: (
		getArgs: GET_Args<
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
	) => void

	/*******************************************************************************
	 *
	 * The response type the controller must return.
	 *
	 ******************************************************************************/

	readonly T_response: GetOrPostControllerResponse<GPA_RenderedRoutes, PA_Response, PA_AfterwareData>

	/*******************************************************************************
	 *
	 * For internal use only.
	 *
	 * NOTE: DO NOT ACCESS ANY OF IT AT RUNTIME
	 *
	 ******************************************************************************/

	__internal__: {
		baseURL: IA_BaseURL
		kind: "GET"
		route: IA_CurrentRoute
		roles: IA_ExpRoles
		query: IA_QT
		redirectFrom: IA_RedirectFrom
		getControllerArgs: () => RouteControllerArgs
	} & Router_InternalPartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL, IA_PartialAndEmailRoutes>
}
//------------------------------------------------------------------------------
//
// makeServer().defineRouter().defineGETContent(true) return
//
//------------------------------------------------------------------------------

export type RT_defineGETContextWithPartial<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false,
	IA_BaseURL extends SuggestedBaseURL<GPA_RenderedRoutes>,
	IA_PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>,
	PA_AfterwareData extends UnknownObj
> = <
	IA_CurrentRoute extends SubRoutePrefix,
	IA_ExpRoles extends Roles<InferRoleFromExpressUser<GPA_ExpressUser>>,
	IA_QT extends GET_QueryType,
	IA_PartialRoute extends PartialRoutesWithoutPrefix<PARTIAL_Route<GPA_PartialMarkup>, IA_BaseURL>,
	IA_RedirectFrom extends SubRoutePrefix
>(
	args: GET_ContextArgsWithPartial<
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
) => I_GetRouteContextWithPartial<
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

interface I_GetRouteContextWithPartial<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false,
	IA_BaseURL extends SuggestedBaseURL<GPA_RenderedRoutes>,
	IA_PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>,
	PA_AfterwareData extends UnknownObj,
	IA_CurrentRoute extends SubRoutePrefix,
	IA_ExpRoles extends Roles<InferRoleFromExpressUser<GPA_ExpressUser>>,
	IA_QT extends GET_QueryType,
	IA_PartialRoute extends PartialRoutesWithoutPrefix<PARTIAL_Route<GPA_PartialMarkup>, IA_BaseURL>,
	IA_RedirectFrom extends SubRoutePrefix
> {
	/*******************************************************************************
	 *
	 * GET controller.
	 *
	 * @param getArgs Object to provide for controller, middleware, and afterware.
	 *
	 ******************************************************************************/

	readonly GET: (
		getArgs: GET_ArgsWithPartial<
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
	) => void

	/*******************************************************************************
	 *
	 * The response type the controller must return.
	 *
	 ******************************************************************************/

	readonly T_response: GetOrPostControllerResponseWithPartial<
		GPA_RenderedRoutes,
		GPA_PartialMarkup,
		IA_BaseURL,
		IA_PartialAndEmailRoutes,
		IA_PartialRoute,
		PA_AfterwareData
	>

	/*******************************************************************************
	 *
	 * For internal use only.
	 *
	 * NOTE: DO NOT ACCESS ANY OF IT AT RUNTIME
	 *
	 ******************************************************************************/

	readonly __internal__: {
		baseURL: IA_BaseURL
		kind: "GET"
		route: IA_CurrentRoute
		roles: IA_ExpRoles
		query: IA_QT
		redirectFrom: IA_RedirectFrom
		getControllerArgs: () => RouteControllerArgs
		partialSubRoute: IA_PartialRoute
		__T_fullPartialRoute: ConcatenatedPartialRoute<IA_BaseURL, IA_PartialRoute>
	} & Router_InternalPartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL, IA_PartialAndEmailRoutes>
}

//------------------------------------------------------------------------------
//
// GET Context Args
//
//------------------------------------------------------------------------------

export type GET_ContextArgs<
	RenderedRoutes extends string,
	ExpressUser extends ExpressUserBase | false,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	CurrentRoute extends SubRoutePrefix,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	QT extends GET_QueryType,
	RedirectFrom extends SubRoutePrefix
> = {
	route: `${BaseURL}${NoSlash<CurrentRoute>}` extends PAGE_Route<RenderedRoutes>
		? never
		: CurrentRoute extends NestedRoutePrefix
			? never
			: OnlyChildRoute<CurrentRoute>
	query?: QT
	redirectFrom?: ConcatenatedRoute<BaseURL, CurrentRoute> extends RedirectFrom
		? never
		: RedirectFrom extends PAGE_Route<RenderedRoutes>
			? never
			: RedirectFrom
} & ExpressRolesObj<ExpressUser, ExpRoles>

//------------------------------------------------------------------------------
//
// GET Context Args with Partial
//
//------------------------------------------------------------------------------

export type GET_ContextArgsWithPartial<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	ExpressUser extends ExpressUserBase | false,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	CurrentRoute extends SubRoutePrefix,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	QT extends GET_QueryType,
	PartialRoute extends PartialRoutesWithoutPrefix<PARTIAL_Route<PartialMarkup>, BaseURL>,
	RedirectFrom extends SubRoutePrefix
> = GET_ContextArgs<RenderedRoutes, ExpressUser, BaseURL, CurrentRoute, ExpRoles, QT, RedirectFrom> & {
	partialRoute: PartialRoute
}

//------------------------------------------------------------------------------
//
// GET Args
//
//------------------------------------------------------------------------------

export type GET_Args<
	RenderedRoutes extends string,
	ExpressUser extends ExpressUserBase | false,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	Response extends UnknownObj,
	AfterwareData extends UnknownObj,
	CurrentRoute extends SubRoutePrefix,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	QT extends GET_QueryType,
	RedirectFrom extends SubRoutePrefix
> = {
	controller: (
		context: I_GET_Context<ExpressUser, ExpRoles, ConcatenatedRoute<BaseURL, CurrentRoute>, QT>
	) => SealedPromiseOrNot<GetOrPostControllerResponse<RenderedRoutes, Response, AfterwareData>>
} & (string extends keyof AfterwareData
	? { afterware?: never }
	: {
			afterware: (
				context: GET_ContextArgs<RenderedRoutes, ExpressUser, BaseURL, CurrentRoute, ExpRoles, QT, RedirectFrom>,
				data: AfterwareData
			) => void | Promise<void>
		}) &
	MiddlewareObj<RenderedRoutes, ExpressUser, ExpRoles, CurrentRoute>

//------------------------------------------------------------------------------
//
// GET Args with Partial
//
//------------------------------------------------------------------------------

export type GET_ArgsWithPartial<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	ExpressUser extends ExpressUserBase | false,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<RenderedRoutes, PartialMarkup, BaseURL>,
	AfterwareData extends UnknownObj,
	CurrentRoute extends SubRoutePrefix,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	QT extends GET_QueryType,
	PartialRoute extends PartialRoutesWithoutPrefix<PARTIAL_Route<PartialMarkup>, BaseURL>,
	RedirectFrom extends SubRoutePrefix
> = {
	controller: (
		context: I_GET_Context<ExpressUser, ExpRoles, ConcatenatedRoute<BaseURL, CurrentRoute>, QT>
	) => SealedPromiseOrNot<
		GetOrPostControllerResponseWithPartial<
			RenderedRoutes,
			PartialMarkup,
			BaseURL,
			PartialAndEmailRoutes,
			PartialRoute,
			AfterwareData
		>
	>
} & (string extends keyof AfterwareData
	? { afterware?: never }
	: {
			afterware: (
				context: GET_ContextArgs<RenderedRoutes, ExpressUser, BaseURL, CurrentRoute, ExpRoles, QT, RedirectFrom>,
				data: AfterwareData
			) => void | Promise<void>
		}) &
	MiddlewareObj<RenderedRoutes, ExpressUser, ExpRoles, CurrentRoute>
