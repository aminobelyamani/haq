/*******************************************************************************
 *
 * Astro Middleware for HMR in Dev Mode.
 *
 * @module
 *
 ******************************************************************************/

//#region -------------------------------------------------- Type Imports

/// <reference types="astro/client" />

import type { MiddlewareHandler } from "astro"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { defineMiddleware } from "astro/virtual-modules/middleware.js"
import { GLOBALS } from "../globals.js"

//#endregion ----------------------------------------------- Module Imports

/*******************************************************************************
 *
 * Astro Middleware for HMR in Dev Mode
 *
 * @example
 *
 * ```ts
 * // Add a `middleware.ts` file in your Astro src dir.
 *
 * import { devMiddleware } from "@haq/astro-ssr/astro-mw"
 * export const onRequest = devMiddleware
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export const devMiddleware = defineMiddleware(({ locals, request }, next) => {
	const encodedLocals = request.headers.get(GLOBALS.ASTRO_LOCALS_HMR_HEADER)

	if (encodedLocals) {
		try {
			const decodedLocals = JSON.parse(Buffer.from(encodedLocals, "base64").toString())
			Object.assign(locals, decodedLocals)
		} catch (error) {
			console.error("Failed to parse locals:", error)
		}
	}

	return next()
}) as MiddlewareHandler
