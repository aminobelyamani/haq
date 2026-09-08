//#region -------------------------------------------------- Type Imports

import type { AppRoute, I_GET_RouteObj, I_POST_RouteObj } from "../types/internal.js"
import type { I_InternalReqContext } from "../types/request-context.js"
import type { ExpressUserBase } from "../types/static.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import z from "zod"
import { Errors } from "./errors.js"

//#endregion ----------------------------------------------- Module Imports

export type RawBodySchema = string | Buffer<ArrayBufferLike>
const rawBodySchema: z.ZodType<RawBodySchema> = z.string().or(z.instanceof(Buffer))

export function validateRequest(appRoute: AppRoute, context: I_InternalReqContext<ExpressUserBase>): void {
	if (appRoute.kind === "POST") _handlePostBody(appRoute)
	else _handleGetBody(appRoute)

	//* ---------- Helpers -----------------------------------------------

	function _handlePostBody(postRoute: I_POST_RouteObj): void {
		_validateFileUpload(postRoute)
		if (!postRoute.zodData) return
		if (postRoute.zodData === "raw") {
			_handleRawBody()
			return
		}

		postRoute.zodData.parse(context.getBody())
	}

	function _validateFileUpload(postRoute: I_POST_RouteObj): void {
		if (!postRoute.fileInputName) return

		const files = context.getFiles()

		if (!(files && Object.keys(files).includes(postRoute.fileInputName))) {
			throw new Errors.CustomError("BAD_REQUEST", {
				message: "Expected a file upload but no files were uploaded.",
				forClient: true
			})
		}
	}

	function _handleRawBody(): void {
		const rawBody = rawBodySchema.safeParse(context.getBody())
		if (rawBody.error) {
			throw new Errors.CustomError("BAD_REQUEST", {
				message: rawBody.error.message,
				cause: rawBody.error,
				forClient: "Your browser sent a request that the server could not understand.",
				logInProd: true
			})
		}
	}

	function _handleGetBody(getRoute: I_GET_RouteObj): void {
		if (!getRoute.zodData) return

		getRoute.zodData.parse(context.getQuery())
	}
}
