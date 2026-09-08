//#region -------------------------------------------------- Type Imports

import type { Sealed, UnknownObj } from "@haq/utils/types"
import type {
	AfterwareResponse,
	ConcatenatedRoute,
	ControllerResponse,
	ExpressRolesObj,
	InferRoleFromExpressUser,
	MiddlewareObj,
	PAGE_Route,
	PAGE_SubRoute,
	Roles,
	SealedPromiseOrNot,
	SuggestedBaseURL
} from "./dynamic.js"
import type { RouteControllerArgs } from "./internal.js"
import type { I_GET_Context } from "./request-context.js"
import type { Router_InternalPartialAndEmailRoutes, Router_PartialAndEmailRoutes } from "./router.js"
import type { ExpressUserBase, GET_QueryType, PartialMarkupShape, SubRoutePrefix } from "./static.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// makeServer().defineRoute().definePAGEContext() return
//
//------------------------------------------------------------------------------

export type RT_definePageContext<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false,
	IA_BaseURL extends SuggestedBaseURL<GPA_RenderedRoutes>,
	IA_PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>,
	PA_Response extends UnknownObj = UnknownObj,
	PA_AfterwareData extends UnknownObj = UnknownObj
> = <
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
) => I_PageRouteContext<
	GPA_RenderedRoutes,
	GPA_PartialMarkup,
	GPA_ExpressUser,
	IA_BaseURL,
	IA_PartialAndEmailRoutes,
	IA_CurrentRoute,
	IA_ExpRoles,
	IA_QT,
	IA_RedirectFrom,
	PA_Response,
	PA_AfterwareData
>

interface I_PageRouteContext<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false,
	IA_BaseURL extends SuggestedBaseURL<GPA_RenderedRoutes>,
	IA_PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>,
	IA_CurrentRoute extends PAGE_SubRoute<IA_BaseURL, PAGE_Route<GPA_RenderedRoutes>>,
	IA_ExpRoles extends Roles<InferRoleFromExpressUser<GPA_ExpressUser>>,
	IA_QT extends GET_QueryType,
	IA_RedirectFrom extends SubRoutePrefix,
	PA_Response extends UnknownObj = UnknownObj,
	PA_AfterwareData extends UnknownObj = UnknownObj
> {
	/*******************************************************************************
	 *
	 * PAGE controller.
	 *
	 * @param pageArgs Object to provide for controller, middleware, and afterware.
	 *
	 ******************************************************************************/

	readonly PAGE: (
		pageArgs: PAGE_Args<
			GPA_RenderedRoutes,
			GPA_ExpressUser,
			IA_BaseURL,
			PA_Response,
			PA_AfterwareData,
			IA_CurrentRoute,
			IA_ExpRoles,
			IA_QT
		>
	) => void

	/*******************************************************************************
	 *
	 * The response type the controller must return.
	 *
	 ******************************************************************************/

	readonly T_response: PAGE_ControllerResponse<PA_Response, PA_AfterwareData>

	/*******************************************************************************
	 *
	 * For internal use only.
	 *
	 * NOTE: DO NOT ACCESS ANY OF IT AT RUNTIME
	 *
	 ******************************************************************************/

	readonly __internal__: {
		baseURL: IA_BaseURL
		kind: "PAGE"
		route: IA_CurrentRoute
		roles: IA_ExpRoles
		query: IA_QT
		redirectFrom: IA_RedirectFrom
		getControllerArgs: () => RouteControllerArgs
	} & Router_InternalPartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL, IA_PartialAndEmailRoutes>
}

//------------------------------------------------------------------------------
//
// PAGE Context Args
//
//------------------------------------------------------------------------------

export type PAGE_ContextArgs<
	RenderedRoutes extends string,
	ExpressUser extends ExpressUserBase | false,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	CurrentRoute extends PAGE_SubRoute<BaseURL, PAGE_Route<RenderedRoutes>>,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	QT extends GET_QueryType,
	RedirectFrom extends SubRoutePrefix
> = {
	route: CurrentRoute
	query?: QT
	redirectFrom?: ConcatenatedRoute<BaseURL, CurrentRoute> extends RedirectFrom
		? never
		: RedirectFrom extends PAGE_Route<RenderedRoutes>
			? never
			: RedirectFrom
} & ExpressRolesObj<ExpressUser, ExpRoles>

//------------------------------------------------------------------------------
//
// PAGE Args
//
//------------------------------------------------------------------------------

export type PAGE_Args<
	RenderedRoutes extends string,
	ExpressUser extends ExpressUserBase | false,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	Response extends UnknownObj,
	AfterwareData extends UnknownObj,
	CurrentRoute extends PAGE_SubRoute<BaseURL, PAGE_Route<RenderedRoutes>>,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	QT extends GET_QueryType
> = {
	controller: (
		context: I_GET_Context<ExpressUser, ExpRoles, ConcatenatedRoute<BaseURL, CurrentRoute>, QT>
	) => SealedPromiseOrNot<PAGE_ControllerResponse<Response, AfterwareData>>
} & (string extends keyof AfterwareData
	? { afterware?: never }
	: {
			afterware: (
				context: I_GET_Context<ExpressUser, ExpRoles, ConcatenatedRoute<BaseURL, CurrentRoute>, QT>,
				data: AfterwareData
			) => void | Promise<void>
		}) &
	MiddlewareObj<RenderedRoutes, ExpressUser, ExpRoles, CurrentRoute>

//------------------------------------------------------------------------------
//
// PAGE Controller Response
//
//------------------------------------------------------------------------------

export type PAGE_ControllerResponse<Response extends UnknownObj, AfterwareData extends UnknownObj> = Sealed<
	ControllerResponse<Response> & AfterwareResponse<AfterwareData>
>
