//#region -------------------------------------------------- Type Imports

import type { NextFunction, Request, Response } from "express"
import type { I_GET_RouteObj } from "../../types/internal.js"
import type { I_Request } from "../../types/request-context.js"
import type { I_Response } from "../../types/response-context.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { hasProperty } from "@haq/utils"
import { HTTP_STATUS_CODE } from "../../../errors/index.js"
import { Errors } from "../errors.js"

//#endregion ----------------------------------------------- Module Imports

export function makeGETCb(appRoute: I_GET_RouteObj) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const context = (req as unknown as I_Request).context
		const controllerResponse = await appRoute.controllerArgs.controller(context)

		// redirect

		if (controllerResponse.redirectTo) {
			const expressPath = context.getPaths().expressPath
			if (expressPath === controllerResponse.redirectTo) {
				// avoid infinite redirects
				throw new Errors.CustomError("NOT_FOUND", {
					message: "Encountered an infinite redirect.",
					forClient: "Page not found",
					logInProd: true
				})
			}
			res.redirect(controllerResponse.redirectTo)
			return _handleAfterSend()
		}

		// response

		const headers = { "Content-Type": "application/json" }
		controllerResponse.success = true

		const { afterwareData: _, ...httpResponse } = controllerResponse
		res.set(headers).status(HTTP_STATUS_CODE.OK).send(httpResponse)
		_handleAfterSend()

		//* ---------- Helpers -----------------------------------------------

		function _handleAfterSend(): void {
			if (hasProperty(controllerResponse, "afterwareData")) {
				;(res as unknown as I_Response).context.setAfterwareData(controllerResponse.afterwareData)
				next()
			}
		}
	}
}
