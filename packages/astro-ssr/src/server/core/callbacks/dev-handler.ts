import type { NextFunction, Request, Response } from "express"
import { GLOBALS } from "../../../globals.js"

export function devHandler(req: Request, _res: Response, next: NextFunction, locals: object): void {
	const localsData = JSON.stringify(locals)
	req.headers[GLOBALS.ASTRO_LOCALS_HMR_HEADER] = Buffer.from(localsData).toString("base64") // Encode to safely pass JSON
	next()
}
