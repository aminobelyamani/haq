/*******************************************************************************
 *
 * Client side module for making typed API requests.
 *
 * @module
 *
 ******************************************************************************/

//#region -------------------------------------------------- Type Imports

import type { BaseErrorType, ErrorResponse } from "../errors/types.js"
import type {
	AllErrorTypes,
	ClientTypesShape,
	POST_WithoutUpload,
	POST_WithUpload,
	RT_makeFetch,
	UploadPayload
} from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { navigate, supportsViewTransitions } from "astro/virtual-modules/transitions-router.js"
import { injectHTMLFromServer } from "./html-injection.js"

//#endregion ----------------------------------------------- Module Imports

/*******************************************************************************
 *
 * Factory that provides typed methods for common fetch api usage.
 *
 * @typeParam GPA_ClientTypes - The exposed `CLIENT` type returned from your App.
 * @typeParam GPA_CustomErrorType - Your defined error types that will extend the base error types. Type should be string literal union (optional).
 *
 * @example
 * ```ts
 * // Without extending the base error types
 *
 * // declare it once and export it to use it everywhere in your front end
 * export const Fetch = makeFetch<App["CLIENT"]>()
 * ```
 *
 * @example
 * ```ts
 * // Extending the base error types.
 *
 * type MyErrorTypes = "DATABASE_ERROR" | "FILE_UPLOAD_ERROR"
 *
 * // declare it once and export it to use it everywhere in your front end
 * export const Fetch = makeFetch<App["CLIENT"], MyErrorTypes>()
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function makeFetch<
	GPA_ClientTypes extends ClientTypesShape,
	GPA_CustomErrorType extends string = BaseErrorType
>(): RT_makeFetch<GPA_ClientTypes, GPA_CustomErrorType> {
	return Object.freeze({
		get,
		post,
		upload,
		navigateTo
	})

	//------------------------------------------------------------------------------
	//
	// GET client request
	//
	//------------------------------------------------------------------------------

	async function get<IA_Path extends keyof GPA_ClientTypes["GET"] & string>(
		path: IA_Path
	): Promise<GPA_ClientTypes["GET"][IA_Path]["response"] | ErrorResponse<AllErrorTypes<GPA_CustomErrorType>>> {
		const ERROR_OBJECT: ErrorResponse<AllErrorTypes<GPA_CustomErrorType>> = {
			success: false,
			type: "CLIENT_FETCH_ERROR",
			errorMessage: "An unexpected error occurred.\nPlease check your internet connection."
		}

		try {
			const response = await fetch(path)

			const contentType = response.headers.get("Content-Type")

			// json success/error response

			if (!contentType?.includes("text/html")) {
				if (contentType?.includes("application/json")) {
					return await response.json()
				}
				console.error("Expected a json or html response.")
				return ERROR_OBJECT
			}

			// partial response

			const htmlAsString = await response.text()
			const newBody = injectHTMLFromServer({ htmlAsString, partialRoute: path })
			if (!newBody) return ERROR_OBJECT

			return { success: true, body: newBody } as GPA_ClientTypes["GET"][IA_Path]["response"]
		} catch (err) {
			console.error(err)
			return {
				success: false,
				type: "CLIENT_FETCH_ERROR",
				errorMessage: "An unexpected error occurred.\nPlease check your internet connection."
			}
		}
	}

	//------------------------------------------------------------------------------
	//
	// POST client request
	//
	//------------------------------------------------------------------------------

	async function post<IA_Path extends keyof POST_WithoutUpload<GPA_ClientTypes["POST"]> & string>(
		path: IA_Path,
		payload: NoInfer<POST_WithoutUpload<GPA_ClientTypes["POST"]>[IA_Path]["body"]>,
		replaceRedirectLocation?: true
	): Promise<
		POST_WithoutUpload<GPA_ClientTypes["POST"]>[IA_Path]["response"] | ErrorResponse<AllErrorTypes<GPA_CustomErrorType>>
	> {
		const ERROR_OBJECT: ErrorResponse<AllErrorTypes<GPA_CustomErrorType>> = {
			success: false,
			type: "CLIENT_FETCH_ERROR",
			errorMessage: "An unexpected error occurred.\nPlease check your internet connection."
		}

		const fetchOptions = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		}

		try {
			const response = await fetch(path, fetchOptions)
			if (response.redirected) {
				_navigateWithoutTransition(response.url, replaceRedirectLocation)
				return { success: true } as POST_WithoutUpload<GPA_ClientTypes["POST"]>[IA_Path]["response"]
			}

			const contentType = response.headers.get("Content-Type")

			// json success/error response

			if (!contentType?.includes("text/html")) {
				if (contentType?.includes("application/json")) {
					return await response.json()
				}
				console.error("Expected a json or html response.")
				return ERROR_OBJECT
			}

			// partial response

			const htmlAsString = await response.text()
			const newBody = injectHTMLFromServer({ htmlAsString, partialRoute: path })
			if (!newBody) return ERROR_OBJECT

			return { success: true, body: newBody } as POST_WithoutUpload<GPA_ClientTypes["POST"]>[IA_Path]["response"]
		} catch (err) {
			console.error(err)
			return {
				success: false,
				type: "CLIENT_FETCH_ERROR",
				errorMessage: "An unexpected error occurred.\nPlease check your internet connection."
			}
		}
	}

	//------------------------------------------------------------------------------
	//
	// Upload file to server
	//
	//------------------------------------------------------------------------------

	async function upload<IA_Path extends keyof POST_WithUpload<GPA_ClientTypes["POST"]> & string>(
		path: IA_Path,
		payload: NoInfer<UploadPayload<POST_WithUpload<GPA_ClientTypes["POST"]>, IA_Path>>,
		uId?: string
	): Promise<
		POST_WithUpload<GPA_ClientTypes["POST"]>[IA_Path]["response"] | ErrorResponse<AllErrorTypes<GPA_CustomErrorType>>
	> {
		const HUNDRED_PERCENT = 100

		const ERROR_OBJECT: ErrorResponse<AllErrorTypes<GPA_CustomErrorType>> = {
			success: false,
			type: "CLIENT_FETCH_ERROR",
			errorMessage: "An unexpected error occurred while uploading."
		}

		let file: File | undefined
		let filePropName: string | undefined
		const formData = new FormData()
		for (const [key, value] of Object.entries(payload)) {
			formData.append(key, value)
			if (value instanceof File) {
				filePropName = key
			}
			file = value
		}

		if (!(file && filePropName)) {
			console.error("No File was found in the payload.")
			return ERROR_OBJECT
		}

		return await new Promise<
			POST_WithUpload<GPA_ClientTypes["POST"]>[IA_Path]["response"] | ErrorResponse<AllErrorTypes<GPA_CustomErrorType>>
		>((resolve) => {
			const req = new XMLHttpRequest()

			req.open("POST", path, true)

			req.upload.onprogress = (e): void => {
				const size = file.size
				if (e.loaded <= size) {
					const perc = Math.round((e.loaded / size) * HUNDRED_PERCENT)
					_emitAppEvent("haq:file-upload-progress-received", { perc, uId: uId ?? filePropName })
				} else {
					_emitAppEvent("haq:file-upload-progress-received", { perc: 100, uId: uId ?? filePropName })
				}

				// Source of truth of passed event name, data type, and CustomEvent name are here
				// LINK packages/astro/src/runtime/app-component/index.ts:96

				function _emitAppEvent(
					...args: [
						eventName: "haq:file-upload-progress-received",
						data: {
							perc: number
							uId: string
						}
					]
				): void {
					const [eventName, data] = args
					const ev = new CustomEvent("haq:app-event", {
						detail: {
							eventName,
							data
						}
					})
					globalThis.dispatchEvent(ev)
				}
			}

			req.onload = (): void => {
				try {
					const contentType = req.getResponseHeader("Content-Type")

					// json success/error response

					if (!contentType?.includes("text/html")) {
						resolve(_handleJSONResponse(contentType))
					}

					// partial response

					const htmlAsString = req.responseText
					const newBody = injectHTMLFromServer({ htmlAsString, partialRoute: path })
					if (!newBody) resolve(ERROR_OBJECT)

					resolve({ success: true, body: newBody } as POST_WithUpload<GPA_ClientTypes["POST"]>[IA_Path]["response"])
				} catch (err) {
					console.error(err)
					resolve(ERROR_OBJECT)
				}

				function _handleJSONResponse(
					contentType: string | null
				):
					| POST_WithUpload<GPA_ClientTypes["POST"]>[IA_Path]["response"]
					| ErrorResponse<AllErrorTypes<GPA_CustomErrorType>> {
					if (contentType?.includes("application/json")) {
						const jsonResponse = JSON.parse(req.response)
						return jsonResponse
					}
					console.error("Expected a json or html response.")
					return ERROR_OBJECT
				}
			}

			req.onerror = (e: unknown): void => {
				console.error(e)
				resolve(ERROR_OBJECT)
			}

			req.send(formData)
		})
	}

	//------------------------------------------------------------------------------
	//
	// Navigate to a page
	//
	//------------------------------------------------------------------------------

	function navigateTo<IA_Path extends keyof GPA_ClientTypes["PAGE"] & string>(path: IA_Path, replace?: true): void {
		const isUsingAstroTransitions = document.head.querySelector(`meta[name="astro-view-transitions-enabled"]`) !== null

		if (isUsingAstroTransitions && supportsViewTransitions) _navigateWithTransition(path, replace)
		else _navigateWithoutTransition(path, replace)
	}

	function _navigateWithoutTransition(path: string, replace?: true): void {
		if (replace) {
			globalThis.location.replace(path)
			return
		}
		globalThis.location.href = path
	}

	function _navigateWithTransition(path: string, replace?: true): void {
		navigate(path, {
			history: replace ? "replace" : "auto"
		})
	}
}
