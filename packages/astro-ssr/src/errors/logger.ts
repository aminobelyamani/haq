//#region -------------------------------------------------- Type Imports

import type { Method } from "../server/types/static.js"
import type { BaseErrorType } from "./types.js"

//#endregion ----------------------------------------------- Type Imports

/*******************************************************************************
 *
 * Error Logger
 *
 ******************************************************************************/

export function errorLogger(data: ARGS_errorLogger): void {
	const { method, route, error, errorType, errorMessage } = data

	console.error("\n------------------ Error -----------------------", "\n")
	console.error("❌ Date:     ", formatDate())
	console.error("❌ Method:   ", method)
	console.error("❌ Route:    ", route)
	console.error("❌ ErrorType:", errorType)
	console.error("❌ Message:  ", errorMessage, "\n")
	console.trace(error, "\n\n")
	console.error("\n------------------------------------------------", "\n")
}

type ARGS_errorLogger = {
	route: string
	method: Method
	error: unknown
	errorType: BaseErrorType
	errorMessage: string
}

/*******************************************************************************
 *
 * Date Formatting
 *
 ******************************************************************************/

function formatDate(d?: Date): string {
	const date = d ? new Date(d) : new Date() //get GMT timezone
	return date.toLocaleString("en-us", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "America/New_York"
	})
}
