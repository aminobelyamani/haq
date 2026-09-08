import type z from "zod"

//------------------------------------------------------------------------------
//
// Allowed request methods/kinds
//
//------------------------------------------------------------------------------

export type Method = "POST" | "GET"
export type RouteKind = Method | "PAGE"

//------------------------------------------------------------------------------
//
// Route string helpers
//
//------------------------------------------------------------------------------

export type SubRoutePrefix = `/${string}`
export type NestedRoutePrefix = `/${string}/${string}`
export type RouteWithParam = `${string}/:${string}`

export type InternalRouteLiteral = "/haq-auth"
export type PartialRouteLiteral = "/@partial"
export type EmailRouteLiteral = "/@email"

export type PartialRoutePrefix = `${PartialRouteLiteral}${string}`
export type EmailRoutePrefix = `${EmailRouteLiteral}${string}`

export type ErrorRoute = `/${number}`
export type ErrorRoutes = "/400" | "/500"

//------------------------------------------------------------------------------
//
// Request body/query types
//
//------------------------------------------------------------------------------

export type GET_QueryType = z.ZodType
export type POST_BodyType = z.ZodType | "raw"

//------------------------------------------------------------------------------
//
// Types used with Auth
//
//------------------------------------------------------------------------------

export type ExpressUserBase = {
	email: string
	password: string
	role: string
}

export type ExpressFlash = {
	success?: {
		error?: string[]
		success?: string[]
	}
}

export type ExpressFlashResponse = {
	expressFlash?: ExpressFlash["success"]
}

//------------------------------------------------------------------------------
//
// Astro SSR handler type
//
//------------------------------------------------------------------------------

export type AstroSSRHandlerType = (...args: unknown[]) => Promise<void>

//------------------------------------------------------------------------------
//
// Shape of generated Partial Markup from @haq/astro
//
//------------------------------------------------------------------------------

export type PartialMarkupShape = {
	[route: PartialRoutePrefix]: unknown
}
