//#region -------------------------------------------------- Type Imports

import type { NextFunction, Request, Response } from "express"
import type { I_GET_RouteObj } from "../../types/internal.js"
import type { I_Request } from "../../types/request-context.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { validateRequest } from "../body-validator.js"

//#endregion ----------------------------------------------- Module Imports

export function makeQueryValidator(appRoute: I_GET_RouteObj) {
	return (req: Request, _res: Response, next: NextFunction): void => {
		const context = (req as unknown as I_Request).context
		validateRequest(appRoute, context)
		next()
	}
}
