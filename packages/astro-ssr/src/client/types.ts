//#region -------------------------------------------------- Type Imports

import type { EmptyObject } from "@haq/utils/types"
import type { BaseErrorType, ErrorResponse } from "../errors/types.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// makeFetch return
//
//------------------------------------------------------------------------------

export interface RT_makeFetch<
	GPA_ClientTypes extends ClientTypesShape,
	GPA_CustomErrorType extends string = BaseErrorType
> {
	/*******************************************************************************
	 *
	 * Typed helper for a GET fetch request that returns a json response.
	 *
	 * @param path The url path of the GET request.
	 *
	 * @returns The typed response, success or fail.
	 *
	 ******************************************************************************/

	readonly get: <IA_Path extends keyof GPA_ClientTypes["GET"] & string>(
		path: IA_Path
	) => Promise<GPA_ClientTypes["GET"][IA_Path]["response"] | ErrorResponse<AllErrorTypes<GPA_CustomErrorType>>>

	/*******************************************************************************
	 *
	 * Typed helper for a POST fetch request that returns a json response or html if the route is a partial.
	 *
	 * @param path The url of the POST request.
	 * @param payload The payload (body) of the POST request.
	 * @param replaceRedirectLocation Whether to replace the history after a redirect, if one was initiated by the server (optional).
	 *
	 * @returns The typed response, success or fail.
	 *
	 ******************************************************************************/

	readonly post: <IA_Path extends keyof POST_WithoutUpload<GPA_ClientTypes["POST"]> & string>(
		path: IA_Path,
		payload: NoInfer<POST_WithoutUpload<GPA_ClientTypes["POST"]>[IA_Path]["body"]>,
		replaceRedirectLocation?: true
	) => Promise<
		POST_WithoutUpload<GPA_ClientTypes["POST"]>[IA_Path]["response"] | ErrorResponse<AllErrorTypes<GPA_CustomErrorType>>
	>

	/*******************************************************************************
	 *
	 * Typed helper for uploading a file to your server and sending payload via POST request.
	 *
	 * @param path The url of the post request.
	 * @param payload The payload (body) of the POST request.
	 * @param uId The unique string id of the upload. Useful for tracking progress accross multiple uploads. (optional)
	 *
	 * @returns The typed response, success or fail.
	 *
	 ******************************************************************************/

	readonly upload: <IA_Path extends keyof POST_WithUpload<GPA_ClientTypes["POST"]> & string>(
		path: IA_Path,
		payload: NoInfer<UploadPayload<POST_WithUpload<GPA_ClientTypes["POST"]>, IA_Path>>,
		uId?: string
	) => Promise<
		POST_WithUpload<GPA_ClientTypes["POST"]>[IA_Path]["response"] | ErrorResponse<AllErrorTypes<GPA_CustomErrorType>>
	>

	/*******************************************************************************
	 *
	 * Typed helper for navigating to a different page.
	 *
	 * @param path The url of the new location.
	 * @param replace Whether to replace the history or not (optional).
	 *
	 *
	 ******************************************************************************/

	readonly navigateTo: <IA_Path extends keyof GPA_ClientTypes["PAGE"] & string>(path: IA_Path, replace?: true) => void
}

//------------------------------------------------------------------------------
//
// Helper Types
//
//------------------------------------------------------------------------------

export type AllErrorTypes<CustomErrorType extends string> = BaseErrorType | CustomErrorType

export type POST_WithoutUpload<POSTRoutes extends ClientTypesShape["POST"]> = {
	[Route in keyof POSTRoutes as POSTRoutes[Route]["fileUploadData"] extends never ? Route : never]: POSTRoutes[Route]
}

export type POST_WithUpload<POSTRoutes extends ClientTypesShape["POST"]> = {
	[Route in keyof POSTRoutes as POSTRoutes[Route]["fileUploadData"] extends never ? never : Route]: POSTRoutes[Route]
}

export type UploadPayload<
	POSTWithUploadRoutes extends POST_WithUpload<ClientTypesShape["POST"]>,
	Route extends keyof POSTWithUploadRoutes
> = POSTWithUploadRoutes[Route]["fileUploadData"] &
	(POSTWithUploadRoutes[Route]["body"] extends undefined ? EmptyObject : POSTWithUploadRoutes[Route]["body"])

/*******************************************************************************
 *
 * Shape of exposed return type "CLIENT" from makeServer.App()
 *
 ******************************************************************************/

//NOTE: Always sync this type
//LINK  packages/astro-ssr/src/server/types/app.ts:86

export type ClientTypesShape = {
	PAGE: {
		[Route: string]: {
			query: unknown
		}
	}
	GET: {
		[Route: string]: {
			query: unknown
			partialRoute: unknown
			response: unknown
		}
	}
	POST: {
		[Route: string]: {
			body: unknown
			fileUploadData: Record<string, File>
			partialRoute: unknown
			response: unknown
		}
	}
}
