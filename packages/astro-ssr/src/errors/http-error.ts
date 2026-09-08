//#region -------------------------------------------------- Type Imports

import type { Method } from "../server/types/static.js"
import type { CustomError } from "./custom-error.js"
import type { BaseErrorType, ErrorStatusCodes } from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { ZodError } from "zod"
import { Errors } from "../server/core/errors.js"
import { HTTP_STATUS_CODE } from "./index.js"
import { errorLogger } from "./logger.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_makeHttpError = {
	error: unknown
	method: Method
	route: string
	isDevMode: boolean
}

type RT_makeHttpError = {
	headers: Record<string, string>
	statusCode: ErrorStatusCodes
	data: {
		success: false
		type: BaseErrorType
		errorMessage: string
	}
}

export function makeHttpError({ error, method, isDevMode, route }: ARGS_makeHttpError): RT_makeHttpError {
	if (!(error instanceof Error)) {
		errorLogger({
			error,
			method,
			errorType: "INTERNAL_SERVER_ERROR",
			errorMessage: "An unknown error occurred.",
			route
		})
		return {
			headers: {
				"Content-Type": "application/json"
			},
			statusCode: HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
			data: {
				success: false,
				type: "INTERNAL_SERVER_ERROR",
				errorMessage: "An internal server error occurred."
			} as const
		}
	}

	// logging

	if (isDevMode) {
		errorLogger({
			error,
			method,
			errorType: _getErrorTypeFromError(error),
			errorMessage: _getMessageFromError(error).internalMessage,
			route
		})
	} else _handleProductionLogging(error)

	// error response

	return {
		headers: {
			"Content-Type": "application/json"
		},
		statusCode: _getStatusCodeFromError(error),
		data: {
			success: false,
			type: _getErrorTypeFromError(error),
			errorMessage: _getMessageFromError(error).clientMessage
		} as const
	}

	//* ---------- Helpers -----------------------------------------------

	function _handleProductionLogging(err: Error): void {
		const isUnknownError = !(err instanceof ZodError || Errors.isCustomError(err))

		if (
			isUnknownError ||
			(Errors.isCustomError(err) && (err.options?.logInProd || Errors.isErrorType(err, "INTERNAL_SERVER_ERROR")))
		) {
			errorLogger({
				error: err,
				method,
				errorType: _getErrorTypeFromError(err),
				errorMessage: _getMessageFromError(err).internalMessage,
				route
			})
		}
	}

	function _getZodErrorMessage(e: ZodError): string {
		if (e.issues[0]?.message) {
			if (e.issues[0].message === "Required") {
				const field = e.issues[0].path[0]
				return typeof field === "string" ? `${field} required` : "Invalid Body"
			}
			return e.issues[0].message
		}
		return "Invalid Body"
	}

	function _getStatusCodeFromError(e: Error): ErrorStatusCodes {
		if (e instanceof ZodError) return HTTP_STATUS_CODE.BAD_REQUEST
		if (!Errors.isCustomError(e)) return HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR

		if (Errors.isErrorType(e, "UNAUTHORIZED") || Errors.isErrorType(e, "UNAUTHENTICATED"))
			return HTTP_STATUS_CODE.UNAUTHORIZED
		if (Errors.isErrorType(e, "NOT_FOUND")) return HTTP_STATUS_CODE.NOT_FOUND
		if (Errors.isErrorType(e, "INTERNAL_SERVER_ERROR")) return HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR

		// all other errors

		return HTTP_STATUS_CODE.BAD_REQUEST
	}

	function _getErrorTypeFromError(e: Error): BaseErrorType {
		if (e instanceof ZodError) return "BAD_REQUEST"
		if (!Errors.isCustomError(e)) return "INTERNAL_SERVER_ERROR"

		return e.errorType
	}

	function _getMessageFromError(e: Error): { clientMessage: string; internalMessage: string } {
		const defaultClientMessage = "An internal server error occurred."

		if (e instanceof ZodError) {
			return {
				clientMessage: "Your browser sent a request that the server could not understand.",
				internalMessage: _getZodErrorMessage(e)
			}
		}
		if (!Errors.isCustomError(e)) return { clientMessage: defaultClientMessage, internalMessage: e.message }

		return {
			clientMessage: ___getCustomErrorClientMessage(e, defaultClientMessage),
			internalMessage: e.message
		}

		//* ---------- Helpers -----------------------------------------------

		function ___getCustomErrorClientMessage(customErr: CustomError<BaseErrorType>, defaultMessage: string): string {
			if (customErr.options?.forClient) {
				return typeof customErr.options.forClient === "string" ? customErr.options.forClient : e.message
			}
			return defaultMessage
		}
	}
}
