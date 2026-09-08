//#region -------------------------------------------------- Type Imports

import type { NextFunction, Request, Response } from "express"
import type { GenericConfig } from "../../types/dynamic.js"
import type { I_GET_RouteObj, I_POST_RouteObj } from "../../types/internal.js"
import type { I_Request } from "../../types/request-context.js"
import type { I_Response } from "../../types/response-context.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { hasProperty } from "@haq/utils"
import { HTTP_STATUS_CODE } from "../../../errors/index.js"
import { validateRequest } from "../body-validator.js"
import { Errors } from "../errors.js"
import { devHandler } from "./dev-handler.js"

//#endregion ----------------------------------------------- Module Imports

export function makePartialCb(
	appConfig: GenericConfig,
	appRoute: I_POST_RouteObj | I_GET_RouteObj,
	isDevMode: boolean
) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const context = (req as unknown as I_Request).context
		validateRequest(appRoute, context)
		const controllerResponse = await appRoute.controllerArgs.controller(context)
		const { afterwareData: _, ...httpResponse } = controllerResponse

		res.status(HTTP_STATUS_CODE.OK)

		if (!appRoute.fullPartialPath) {
			throw new Errors.CustomError("INTERNAL_SERVER_ERROR", {
				message: "No fullPartialPath found."
			})
		}

		req.url = appRoute.fullPartialPath

		const locals = {
			[appRoute.fullPartialPath]: httpResponse
		}

		if (isDevMode) {
			req.method = "GET" // For Vite SSR HMR, the proxymiddleware can't forward the request when its method is POST
			devHandler(req, res, next, locals)
		} else await appConfig.ASTRO_CONFIG.SSR_HANDLER(req, res, next, locals)

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
