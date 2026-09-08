//#region -------------------------------------------------- Type Imports

import type { NextFunction, Request, Response } from "express"
import type { AppRoute, InternalMiddleware } from "../../types/internal.js"
import type { I_Request } from "../../types/request-context.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

//#endregion ----------------------------------------------- Module Imports

export function makeMiddlewareCb(appRoute: AppRoute, controller: InternalMiddleware) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const context = (req as unknown as I_Request).context
		const controllerResponse = await controller(context, appRoute)
		if (controllerResponse.redirect) {
			const expressPath = context.getPaths().expressPath
			if (expressPath === controllerResponse.redirect) {
				// avoid infinite redirects
				return next()
			}
			return res.redirect(controllerResponse.redirect)
		}
		return next()
	}
}
