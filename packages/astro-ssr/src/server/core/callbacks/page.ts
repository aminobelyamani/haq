//#region -------------------------------------------------- Type Imports

import type { NextFunction, Request, Response } from "express"
import type { ErrorStatusCodes } from "../../../errors/types.js"
import type { GenericConfig } from "../../types/dynamic.js"
import type { I_GET_RouteObj } from "../../types/internal.js"
import type { I_Request } from "../../types/request-context.js"
import type { I_Response } from "../../types/response-context.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { hasProperty } from "@haq/utils"
import { HTTP_STATUS_CODE } from "../../../errors/index.js"
import { Errors } from "../errors.js"
import { devHandler } from "./dev-handler.js"

//#endregion ----------------------------------------------- Module Imports

export function makePageCb(
	appConfig: GenericConfig,
	appRoute: I_GET_RouteObj,
	isDevMode: boolean,
	statusCode?: ErrorStatusCodes
) {
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

		const { afterwareData: _, ...httpResponse } = controllerResponse

		if ("AUTH_CONFIG" in appConfig) _handleAuthContext()

		res.status(statusCode || HTTP_STATUS_CODE.OK)

		if (statusCode) {
			httpResponse.statusCode = statusCode
		}

		// astro rendering

		const astroRouting = context.getPaths()
		req.url = astroRouting.astroPath

		const locals = {
			[astroRouting.expressPath]: httpResponse
		}

		if (isDevMode) {
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

		function _handleAuthContext(): void {
			httpResponse.expressFlash = req.flash()

			const authCacheControl =
				appRoute.roles === "public"
					? undefined
					: "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"

			res.set("Cache-Control", authCacheControl)
		}
	}
}
