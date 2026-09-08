//#region -------------------------------------------------- Type Imports

import type { Sealed, UnknownObj } from "@haq/utils/types"
import type { SealedPromiseOrNot } from "./dynamic.js"
import type { RouteControllerArgs } from "./internal.js"
import type { I_InternalReqContext } from "./request-context.js"
import type { ErrorRoutes } from "./static.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// makeServer().RT_createErrorContext() return
//
//------------------------------------------------------------------------------

export type RT_createErrorContext<GPA_RenderedRoutes extends string, PA_Response extends UnknownObj> = <
	IA_ErrorRoute extends ErrorRoutes
>(
	route: IA_ErrorRoute extends GPA_RenderedRoutes ? IA_ErrorRoute : never
) => I_ErrorRouteContext<PA_Response, IA_ErrorRoute>

interface I_ErrorRouteContext<PA_Response extends UnknownObj, IA_ErrorRoute extends ErrorRoutes> {
	/*******************************************************************************
	 *
	 * PAGE controller.
	 *
	 * @param pageArgs Object to provide for controller.
	 *
	 ******************************************************************************/

	readonly PAGE: (pageArgs: ErrorPAGE_Args<PA_Response>) => void

	/*******************************************************************************
	 *
	 * The response type the controller must return.
	 *
	 ******************************************************************************/

	readonly T_response: Sealed<PA_Response>

	/*******************************************************************************
	 *
	 * For internal use only.
	 *
	 * NOTE: DO NOT ACCESS ANY OF IT AT RUNTIME
	 *
	 ******************************************************************************/

	__internal__: {
		isErrorRoute: true
		kind: "PAGE"
		baseURL: "/"
		route: IA_ErrorRoute
		getControllerArgs: () => RouteControllerArgs
		roles: undefined
		query: undefined
		redirectFrom: undefined
		__T_partialRoutes: never
		__T_emailRoutes: never
	}
}

export interface ErrorPAGE_Args<PA_Response extends UnknownObj> {
	/*******************************************************************************
	 *
	 * Error page controller.
	 *
	 * @param context The request context providing the error message.
	 *
	 ******************************************************************************/

	readonly controller: (context: Pick<I_InternalReqContext, "getErrorMessage">) => SealedPromiseOrNot<PA_Response>
}
