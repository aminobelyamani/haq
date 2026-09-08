/*******************************************************************************
 *
 * Server side module for handling errors in a type safe way.
 *
 * @module
 *
 ******************************************************************************/

//#region -------------------------------------------------- Type Imports

import type { CustomErrorOptions, InternalServerErrorOptions } from "./custom-error.js"
import type { AllExceptClientErrorTypes, BaseErrorType, HTTP_StatusCode } from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { CustomError } from "./custom-error.js"

//#endregion ----------------------------------------------- Module Imports

/*******************************************************************************
 *
 * Factory function that provides typed methods for dealing with Errors.
 *
 * @typeParam PA_CustomErrorType - Your defined error types that will extend the base error types.
 * Type should be string literal union (optional).
 *
 * @example
 * ```ts
 * // Without extending the base error types
 *
 * import { makeErrors } from "@haq/astro-ssr/errors"
 *
 * // declare it once and export it to use it everywhere in your back end
 * export const Errors = makeErrors()
 * ```
 *  @example
 *
 * ```ts
 * // Extending the base error types.
 *
 * import { makeErrors } from "@haq/astro-ssr/errors"
 *
 * type MyErrorTypes = "DATABASE_ERROR" | "FILE_UPLOAD_ERROR"
 *
 * // declare it once and export it to use it everywhere in your front end
 * export const Errors = makeErrors<MyErrorTypes>()
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function makeErrors<PA_CustomErrorType extends string = BaseErrorType>(): RT_makeErrors<PA_CustomErrorType> {
	return Object.freeze({
		CustomError: CustomError<AllExceptClientErrorTypes<PA_CustomErrorType>>,
		isCustomError,
		isErrorType
	})

	function isCustomError(e: unknown): e is CustomError<AllExceptClientErrorTypes<PA_CustomErrorType>> {
		return e instanceof CustomError
	}

	function isErrorType(
		e: CustomError<AllExceptClientErrorTypes<PA_CustomErrorType>>,
		type: AllExceptClientErrorTypes<PA_CustomErrorType>
	): boolean {
		return e.errorType === type
	}
}

type NewCustomError<PA_CustomErrorType extends string> = {
	new (
		errorType: Exclude<PA_CustomErrorType, "INTERNAL_SERVER_ERROR">,
		options: CustomErrorOptions
	): CustomError<PA_CustomErrorType>
	new (errorType: "INTERNAL_SERVER_ERROR", options: InternalServerErrorOptions): CustomError<PA_CustomErrorType>
}

interface RT_makeErrors<PA_CustomErrorType extends string = BaseErrorType> {
	/*******************************************************************************
	 *
	 * CustomError
	 *
	 * @param errorType The type of error to be thrown.
	 * @param options The options object. Must have at least a message.
	 *
	 * @example
	 * ```ts
	 * throw new Errors.CustomError("BAD_REQUEST", {
	 *   message: "Username is already taken.",
	 *   forClient: true
	 * })
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	readonly CustomError: NewCustomError<AllExceptClientErrorTypes<PA_CustomErrorType>>

	/*******************************************************************************
	 *
	 * Method to check whether an unknown error is an instance of `CustomError`.
	 *
	 * @param e The unknown error.
	 *
	 * @returns A boolean value. Allows for type narrowing the given error.
	 *
	 * @example
	 * ```ts
	 * if(Errors.isCustomError(err)){
	 *   // now err is of type CustomError
	 * }
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	readonly isCustomError: (e: unknown) => e is CustomError<AllExceptClientErrorTypes<PA_CustomErrorType>>

	/*******************************************************************************
	 *
	 * Method to check whether a CustomError is of a given error type
	 *
	 * @param e The CustomError.
	 * @param type The error type to check
	 *
	 * @return Boolean whether the passed error type matches.
	 *
	 ******************************************************************************/

	readonly isErrorType: (
		e: CustomError<AllExceptClientErrorTypes<PA_CustomErrorType>>,
		type: AllExceptClientErrorTypes<PA_CustomErrorType>
	) => boolean
}

/*******************************************************************************
 *
 * HTTP Status Codes used by package.
 *
 ******************************************************************************/

export const HTTP_STATUS_CODE: HTTP_StatusCode = {
	/*******************************************************************************
	 *
	 * Sent on successful PAGE and GET requests.
	 *
	 ******************************************************************************/

	OK: 200,

	/*******************************************************************************
	 *
	 * Sent on successful POST requests.
	 *
	 ******************************************************************************/

	CREATED: 201,

	/*******************************************************************************
	 *
	 * Permanent redirect.
	 *
	 ******************************************************************************/

	MOVED_PERMANENTLY: 301,

	/*******************************************************************************
	 *
	 * Redirect from a POST request.
	 *
	 ******************************************************************************/

	SEE_OTHER: 303,

	/*******************************************************************************
	 *
	 * Sent from a thrown CustomError with errorType BAD_REQUEST.
	 *
	 * If not thrown by user, it can be thrown by query or body validation internally.
	 *
	 ******************************************************************************/

	BAD_REQUEST: 400,

	/*******************************************************************************
	 *
	 * Sent from a thrown CustomError with errorType UNAUTHORIZED.
	 *
	 * If not thrown by user, it can be thrown by internal auth handling.
	 *
	 ******************************************************************************/

	UNAUTHORIZED: 401,

	/*******************************************************************************
	 *
	 * Sent from a thrown CustomError with errorType NOT_FOUND.
	 *
	 ******************************************************************************/

	NOT_FOUND: 404,

	/*******************************************************************************
	 *
	 * Sent from a thrown CustomError with errorType INTERNAL_SERVER_ERROR.
	 *
	 * If not thrown by user, it can be thrown by any unknown errors caught.
	 *
	 ******************************************************************************/

	INTERNAL_SERVER_ERROR: 500
}

//------------------------------------------------------------------------------
//
// Exposed types
//
//------------------------------------------------------------------------------

export type { ErrorResponse as HAQ_ErrorResponse } from "./types.js"
