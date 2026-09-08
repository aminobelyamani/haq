import type { TypedExclude } from "@haq/utils/types"

/*******************************************************************************
 *
 * Allowed HTTP status codes
 *
 ******************************************************************************/

export type HTTP_StatusCode = Readonly<{
	// success
	OK: 200
	CREATED: 201
	// redirect
	MOVED_PERMANENTLY: 301
	SEE_OTHER: 303
	// client error
	BAD_REQUEST: 400
	UNAUTHORIZED: 401
	NOT_FOUND: 404
	// server error
	INTERNAL_SERVER_ERROR: 500
}>

export type ErrorStatusCodes =
	| HTTP_StatusCode["NOT_FOUND"]
	| HTTP_StatusCode["BAD_REQUEST"]
	| HTTP_StatusCode["UNAUTHORIZED"]
	| HTTP_StatusCode["INTERNAL_SERVER_ERROR"]

/*******************************************************************************
 *
 * Base Error types
 *
 ******************************************************************************/

export type BaseErrorType =
	| "UNAUTHENTICATED"
	| "UNAUTHORIZED"
	| "BAD_REQUEST"
	| "NOT_FOUND"
	| "INTERNAL_SERVER_ERROR"
	| "CLIENT_FETCH_ERROR"

/*******************************************************************************
 *
 * Remove CLIENT_FETCH_ERROR from type.
 *
 ******************************************************************************/

export type AllExceptClientErrorTypes<CustomErrorType extends string> = TypedExclude<
	BaseErrorType | CustomErrorType,
	"CLIENT_FETCH_ERROR"
>

/*******************************************************************************
 *
 * JSON Error response type returned by server
 *
 * @typeParam CustomErrorType - The custom error types to extend the Base error types (optional).
 *
 ******************************************************************************/

export type ErrorResponse<CustomErrorType extends string = BaseErrorType> = Readonly<{
	success: false
	type: BaseErrorType | CustomErrorType
	errorMessage: string
}>
