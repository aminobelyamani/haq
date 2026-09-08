//#region -------------------------------------------------- Type Imports

import type { UnknownObj } from "@haq/utils/types"
import type {
	ConcatenatedPartialRoute,
	ExpressRolesObj,
	GetOrPostControllerResponse,
	GetOrPostControllerResponseWithPartial,
	InferRoleFromExpressUser,
	MiddlewareObj,
	OnlyChildRoute,
	PARTIAL_Route,
	PartialRoutesWithoutPrefix,
	Roles,
	SealedPromiseOrNot,
	SuggestedBaseURL
} from "./dynamic.js"
import type { RouteControllerArgs } from "./internal.js"
import type { I_POST_Context } from "./request-context.js"
import type { Router_InternalPartialAndEmailRoutes, Router_PartialAndEmailRoutes } from "./router.js"
import type { ExpressUserBase, NestedRoutePrefix, PartialMarkupShape, POST_BodyType, SubRoutePrefix } from "./static.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// makeServer().defineRouter().definePOSTContext() return
//
//------------------------------------------------------------------------------

export type RT_definePOSTContext<
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
	IA_QT extends POST_BodyType,
	IA_FileInputName extends string
>(
	args: POST_ContextArgs<GPA_ExpressUser, IA_CurrentRoute, IA_ExpRoles, IA_QT, IA_FileInputName>
) => I_PostRouteContext<
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
	IA_FileInputName
>

interface I_PostRouteContext<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false,
	IA_BaseURL extends SuggestedBaseURL<GPA_RenderedRoutes>,
	IA_PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>,
	PA_Response extends UnknownObj,
	PA_AfterwareData extends UnknownObj,
	IA_CurrentRoute extends SubRoutePrefix,
	IA_ExpRoles extends Roles<InferRoleFromExpressUser<GPA_ExpressUser>>,
	IA_QT extends POST_BodyType,
	IA_FileInputName extends string
> {
	/*******************************************************************************
	 *
	 * POST controller.
	 *
	 * @param postArgs Object to provide for controller, middleware, and afterware.
	 *
	 ******************************************************************************/

	readonly POST: (
		postArgs: POST_Args<
			GPA_RenderedRoutes,
			GPA_ExpressUser,
			PA_Response,
			PA_AfterwareData,
			IA_CurrentRoute,
			IA_ExpRoles,
			IA_QT,
			IA_FileInputName
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

	readonly __internal__: {
		baseURL: IA_BaseURL
		kind: "POST"
		route: IA_CurrentRoute
		roles: IA_ExpRoles
		body: IA_QT
		getControllerArgs: () => RouteControllerArgs
		fileInputName: IA_FileInputName
	} & Router_InternalPartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL, IA_PartialAndEmailRoutes>
}

//------------------------------------------------------------------------------
//
// makeServer().defineRouter().definePOSTContext(true) return
//
//------------------------------------------------------------------------------

export type RT_definePOSTContextWithPartial<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false,
	IA_BaseURL extends SuggestedBaseURL<GPA_RenderedRoutes>,
	IA_PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>,
	PA_AfterwareData extends UnknownObj
> = <
	IA_CurrentRoute extends SubRoutePrefix,
	IA_QT extends POST_BodyType,
	IA_ExpRoles extends Roles<InferRoleFromExpressUser<GPA_ExpressUser>>,
	IA_FileInputName extends string,
	IA_PartialRoute extends PartialRoutesWithoutPrefix<PARTIAL_Route<GPA_PartialMarkup>, IA_BaseURL>
>(
	args: POST_ContextArgsWithPartial<
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
) => I_PostRouteContextWithPartial<
	GPA_RenderedRoutes,
	GPA_PartialMarkup,
	GPA_ExpressUser,
	IA_BaseURL,
	IA_PartialAndEmailRoutes,
	PA_AfterwareData,
	IA_CurrentRoute,
	IA_QT,
	IA_ExpRoles,
	IA_FileInputName,
	IA_PartialRoute
>

interface I_PostRouteContextWithPartial<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false,
	IA_BaseURL extends SuggestedBaseURL<GPA_RenderedRoutes>,
	IA_PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>,
	PA_AfterwareData extends UnknownObj,
	IA_CurrentRoute extends SubRoutePrefix,
	IA_QT extends POST_BodyType,
	IA_ExpRoles extends Roles<InferRoleFromExpressUser<GPA_ExpressUser>>,
	IA_FileInputName extends string,
	IA_PartialRoute extends PartialRoutesWithoutPrefix<PARTIAL_Route<GPA_PartialMarkup>, IA_BaseURL>
> {
	/*******************************************************************************
	 *
	 * POST controller.
	 *
	 * @param postArgs Object to provide for controller, middleware, and afterware.
	 *
	 ******************************************************************************/

	readonly POST: (
		postArgs: POST_ArgsWithPartial<
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
		kind: "POST"
		route: IA_CurrentRoute
		roles: IA_ExpRoles
		body: IA_QT
		getControllerArgs: () => RouteControllerArgs
		fileInputName: IA_FileInputName
		partialSubRoute: IA_PartialRoute
		__T_fullPartialRoute: ConcatenatedPartialRoute<IA_BaseURL, IA_PartialRoute>
	} & Router_InternalPartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL, IA_PartialAndEmailRoutes>
}

//------------------------------------------------------------------------------
//
// POST Context Args
//
//------------------------------------------------------------------------------

export type POST_ContextArgs<
	ExpressUser extends ExpressUserBase | false,
	CurrentRoute extends SubRoutePrefix,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	QT extends POST_BodyType,
	FileInputName extends string
> = {
	route: CurrentRoute extends NestedRoutePrefix ? never : OnlyChildRoute<CurrentRoute>
	body?: QT
	fileInputName?: FileInputName
} & ExpressRolesObj<ExpressUser, ExpRoles>

//------------------------------------------------------------------------------
//
// POST Context Args with Partial
//
//------------------------------------------------------------------------------

export type POST_ContextArgsWithPartial<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	ExpressUser extends ExpressUserBase | false,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	CurrentRoute extends SubRoutePrefix,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	QT extends POST_BodyType,
	FileInputName extends string,
	PartialRoute extends PartialRoutesWithoutPrefix<PARTIAL_Route<PartialMarkup>, BaseURL>
> = POST_ContextArgs<ExpressUser, CurrentRoute, ExpRoles, QT, FileInputName> & {
	partialRoute: PartialRoute
}

//------------------------------------------------------------------------------
//
// POST Args
//
//------------------------------------------------------------------------------

export type POST_Args<
	RenderedRoutes extends string,
	ExpressUser extends ExpressUserBase | false,
	Response extends UnknownObj,
	AfterwareData extends UnknownObj,
	CurrentRoute extends SubRoutePrefix,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	QT extends POST_BodyType,
	FileInputName extends string
> = {
	controller: (
		context: I_POST_Context<ExpressUser, ExpRoles, CurrentRoute, QT, FileInputName>
	) => SealedPromiseOrNot<GetOrPostControllerResponse<RenderedRoutes, Response, AfterwareData>>
} & (string extends keyof AfterwareData
	? { afterware?: never }
	: {
			afterware: (
				context: I_POST_Context<ExpressUser, ExpRoles, CurrentRoute, QT, FileInputName>,
				data: AfterwareData
			) => void | Promise<void>
		}) &
	MiddlewareObj<RenderedRoutes, ExpressUser, ExpRoles, CurrentRoute>

//------------------------------------------------------------------------------
//
// POST Args with Partial
//
//------------------------------------------------------------------------------

export type POST_ArgsWithPartial<
	RenderedRoutes extends string,
	PartialMarkup extends PartialMarkupShape,
	ExpressUser extends ExpressUserBase | false,
	BaseURL extends SuggestedBaseURL<RenderedRoutes>,
	PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<RenderedRoutes, PartialMarkup, BaseURL>,
	AfterwareData extends UnknownObj,
	CurrentRoute extends SubRoutePrefix,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	QT extends POST_BodyType,
	FileInputName extends string,
	PartialRoute extends PartialRoutesWithoutPrefix<PARTIAL_Route<PartialMarkup>, BaseURL>
> = {
	controller: (
		context: I_POST_Context<ExpressUser, ExpRoles, CurrentRoute, QT, FileInputName>
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
				context: I_POST_Context<ExpressUser, ExpRoles, CurrentRoute, QT, FileInputName>,
				data: AfterwareData
			) => void | Promise<void>
		}) &
	MiddlewareObj<RenderedRoutes, ExpressUser, ExpRoles, CurrentRoute>
