//#region -------------------------------------------------- Type Imports

import type { TypedExtract, TypedOmit } from "@haq/utils/types"
import type { BaseErrorType } from "./types.js"

//#endregion ----------------------------------------------- Type Imports

export class CustomError<CustomErrorType extends ErrorType> extends Error {
	readonly errorType: CustomErrorType
	readonly options: TypedOmit<CustomErrorOptions, "message"> | undefined

	constructor(errorType: Exclude<CustomErrorType, "INTERNAL_SERVER_ERROR">, options: CustomErrorOptions)
	constructor(errorType: "INTERNAL_SERVER_ERROR", options: InternalServerErrorOptions)

	constructor(errorType: CustomErrorType, options: CustomErrorOptions) {
		const { message, ...rest } = options
		super(message, rest)

		this.errorType = errorType
		this.options = rest

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, CustomError)
		}
	}
}

export type CustomErrorOptions = {
	/*******************************************************************************
	 *
	 * The error message that will be logged.
	 *
	 ******************************************************************************/

	message: string

	/*******************************************************************************
	 *
	 * Whether to log the error in production (optional).
	 *
	 ******************************************************************************/

	logInProd?: true

	/*******************************************************************************
	 *
	 * If `true` will send the client the message.
	 * If `string`, that will be the message sent to client (optional).
	 *
	 ******************************************************************************/

	forClient?: true | string
} & ErrorOptions

export type InternalServerErrorOptions = {
	/*******************************************************************************
	 *
	 * The error message that will be logged.
	 *
	 ******************************************************************************/

	message: string

	/*******************************************************************************
	 *
	 * If `true` will send the client the message.
	 * If `string`, that will be the message sent to client (optional).
	 *
	 ******************************************************************************/

	forClient?: true
} & ErrorOptions

type ErrorType = TypedExtract<BaseErrorType, "INTERNAL_SERVER_ERROR"> | string
