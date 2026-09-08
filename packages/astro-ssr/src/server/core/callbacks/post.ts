//#region -------------------------------------------------- Type Imports

import type { NextFunction, Request, Response } from "express"
import type { I_POST_RouteObj } from "../../types/internal.js"
import type { I_Request } from "../../types/request-context.js"
import type { I_Response } from "../../types/response-context.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { hasProperty } from "@haq/utils"
import { HTTP_STATUS_CODE } from "../../../errors/index.js"
import { validateRequest } from "../body-validator.js"

//#endregion ----------------------------------------------- Module Imports

export function makePOSTCb(appRoute: I_POST_RouteObj) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const context = (req as unknown as I_Request).context
		validateRequest(appRoute, context)
		const controllerResponse = await appRoute.controllerArgs.controller(context)

		// redirect

		if (controllerResponse.redirectTo) {
			res.redirect(HTTP_STATUS_CODE.SEE_OTHER, controllerResponse.redirectTo)
			return _handleAfterSend()
		}

		// response

		const headers = { "Content-Type": "application/json" }
		controllerResponse.success = true
		const { afterwareData: _, ...httpResponse } = controllerResponse
		res.set(headers).status(HTTP_STATUS_CODE.CREATED).send(httpResponse)
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
