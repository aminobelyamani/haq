//#region -------------------------------------------------- Type Imports

import type { IncomingHttpHeaders } from "node:http"
import type { ExtractStringLiteralFromArray, TypedOmit } from "@haq/utils/types"
import type fileUpload from "express-fileupload"
import type { z } from "zod"
import type { RawBodySchema } from "../core/body-validator.js"
import type { InferRoleFromExpressUser, IsDiscriminatedUnion, Roles } from "./dynamic.js"
import type { ExpressUserBase, GET_QueryType, Method, POST_BodyType, RouteWithParam } from "./static.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// Extending native Request interface
//
//------------------------------------------------------------------------------

export interface I_Request extends Request {
	context: I_InternalReqContext<ExpressUserBase>
}

//------------------------------------------------------------------------------
//
// Base Context
//
//------------------------------------------------------------------------------

interface I_BaseReqContext {
	readonly getHeaders: () => IncomingHttpHeaders
	readonly logout: () => Promise<true>
}

//------------------------------------------------------------------------------
//
// Context used internally
//
//------------------------------------------------------------------------------

export interface I_InternalReqContext<ExpressUser extends ExpressUserBase | false = false>
	extends I_ExposedReqContext<ExpressUser> {
	readonly getPathParam: () => string | undefined
	readonly getMethod: () => Method
	// route specific
	readonly getQuery: () => unknown
	readonly getBody: () => unknown
	readonly getFiles: () => unknown

	// internal only
	readonly getPaths: () => ReqContextPaths
	readonly isAuthenticated: () => boolean
	readonly isUnauthenticated: () => boolean
	readonly getOriginalReqURL: () => string
	readonly getSessionURL: () => string | undefined
	readonly setSessionURL: (value: string | undefined) => void
	readonly setPageURL: (value: string) => void
	readonly setDynamicParam: (value: string | undefined) => void
	readonly getErrorMessage: () => string
	readonly setErrorMessage: (value: string) => void
}

interface I_ExposedReqContext<ExpressUser extends ExpressUserBase | false = false> extends I_BaseReqContext {
	readonly getUser: () => ExpressUser extends ExpressUserBase ? ExpressUser | undefined : unknown
}

export type ReqContextPaths = {
	expressPath: string
	astroPath: string
}

//------------------------------------------------------------------------------
//
// For Auth Afterware
//
//------------------------------------------------------------------------------

export interface I_ExposedAuthenticatedReqContext<ExpressUser extends ExpressUserBase> extends I_BaseReqContext {
	readonly getUser: () => ExpressUser
}

//------------------------------------------------------------------------------
//
// For Router middleware
//
//------------------------------------------------------------------------------

export interface I_RouterReqContext<ExpressUser extends ExpressUserBase | false> extends I_ExposedReqContext {
	readonly getUser: () => ExpressUser extends ExpressUserBase ? ExpressUser | undefined : never
	readonly getMethod: () => Method
}

//------------------------------------------------------------------------------
//
// Route Context (GET, PAGE, POST)
//
//------------------------------------------------------------------------------

export interface I_RouteReqContext<
	ExpressUser extends ExpressUserBase | false,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	R extends string
> extends I_ExposedReqContext {
	readonly getUser: () => ExpressUser extends ExpressUserBase
		? ExpRoles extends string[]
			? ContextExpressUser<ExpressUser, ExpRoles>
			: ExpRoles extends "public"
				? ExpressUser | undefined
				: ExpRoles extends null
					? never
					: ContextExpressUser<ExpressUser, ExpRoles> | undefined
		: never

	readonly logout: () => ExpressUser extends ExpressUserBase ? Promise<true> : never
	readonly getPathParam: () => R extends RouteWithParam ? string : never
}

type ContextExpressUser<
	ExpressUser extends ExpressUserBase,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>
> =
	IsDiscriminatedUnion<ExpressUser, "role"> extends true
		? TypedOmit<ExpressUser, "role"> & { role: ExtractStringLiteralFromArray<ExpRoles> }
		: {
				[U in ExpressUser as ExpressUser["role"]]: U["role"] extends ExtractStringLiteralFromArray<ExpRoles> ? U : never
			}[ExpressUser["role"]]

//------------------------------------------------------------------------------
//
// GET
//
//------------------------------------------------------------------------------

export interface I_GET_Context<
	ExpressUser extends ExpressUserBase | false,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	R extends string,
	QT extends GET_QueryType
> extends I_RouteReqContext<ExpressUser, ExpRoles, R> {
	readonly getQuery: () => z.infer<QT>
}

//------------------------------------------------------------------------------
//
// POST
//
//------------------------------------------------------------------------------

export interface I_POST_Context<
	ExpressUser extends ExpressUserBase | false,
	ExpRoles extends Roles<InferRoleFromExpressUser<ExpressUser>>,
	R extends string,
	QT extends POST_BodyType,
	FileInputName extends string
> extends I_RouteReqContext<ExpressUser, ExpRoles, R> {
	readonly getBody: () => QT extends "raw" ? RawBodySchema : z.infer<QT>
	readonly getFiles: () => FileUploadData<FileInputName, "server">
}

//------------------------------------------------------------------------------
//
// File Upload Data - type received in context.getFiles()
//
//------------------------------------------------------------------------------

export type FileUploadData<FileInputName extends string, Stack = "server" | "client"> = string extends FileInputName
	? never
	: { [K in FileInputName]: Stack extends "server" ? fileUpload.UploadedFile : File }
