//#region -------------------------------------------------- Type Imports

import type { NextFunction, Request, Response } from "express"
import type { GeneralAfterware } from "../../types/internal.js"
import type { I_Request } from "../../types/request-context.js"
import type { I_Response } from "../../types/response-context.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { makeHttpError } from "../../../errors/http-error.js"

//#endregion ----------------------------------------------- Module Imports

export function makeAfterwareCb(controller: GeneralAfterware, isDevMode: boolean) {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const reqContext = (req as unknown as I_Request).context
			const resContext = (res as unknown as I_Response).context
			const afterSendData = resContext.getAfterwareData()
			await controller(reqContext, afterSendData)
			next()
		} catch (e) {
			const context = (req as unknown as I_Request).context
			makeHttpError({ error: e, method: context.getMethod(), route: context.getPaths().expressPath, isDevMode })
			next()
		}
	}
}
