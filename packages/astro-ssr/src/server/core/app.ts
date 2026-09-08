//#region -------------------------------------------------- Type Imports

import type { NextFunction, Request, Response } from "express"
import type { VerifyFunctionWithRequest } from "passport-local"
import type { ErrorStatusCodes } from "../../errors/types.js"
import type { GenericConfig, GenericConfigWithAuth, MiddlewareResponse } from "../types/dynamic.js"
import type {
	AppRoute,
	AppRoutes,
	I_GET_RouteObj,
	I_POST_RouteObj,
	InternalAfterware,
	InternalRouteControllerResponse
} from "../types/internal.js"
import type { I_InternalReqContext, I_Request, ReqContextPaths } from "../types/request-context.js"
import type { I_InternalResContext, I_Response } from "../types/response-context.js"
import type { ExpressUserBase, Method } from "../types/static.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import http from "node:http"
import path from "node:path"
import process from "node:process"
import { assertUnreachable, hasProperty } from "@haq/utils"
import bcrypt from "bcrypt"
import express from "express"
import fileUpload from "express-fileupload"
import flash from "express-flash"
import session from "express-session"
import { createProxyMiddleware } from "http-proxy-middleware"
import memStore from "memorystore"
import methodOverride from "method-override"
import passport from "passport"
import { Strategy } from "passport-local"
import { makeHttpError } from "../../errors/http-error.js"
import { HTTP_STATUS_CODE } from "../../errors/index.js"
import { GLOBALS } from "../../globals.js"

import { makeAfterwareCb } from "./callbacks/afterware.js"
import { makeGETCb } from "./callbacks/get.js"
import { makeMiddlewareCb } from "./callbacks/middleware.js"
import { makePageCb } from "./callbacks/page.js"
import { makePartialCb } from "./callbacks/partial.js"
import { makePOSTCb } from "./callbacks/post.js"
import { makeQueryValidator } from "./callbacks/query.js"
import { Errors } from "./errors.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_initExpressApp = {
	appConfig: GenericConfig
	appRoutes: AppRoutes
}

export function initExpressApp(args: ARGS_initExpressApp): void {
	const { appConfig, appRoutes } = args
	const { IS_DEV_MODE } = appConfig

	const APP_HAS_AUTH = _hasAuth(appConfig)

	//------------------------------------------------------------------------------
	//
	// Init Express App
	//
	//------------------------------------------------------------------------------

	const app = express()

	app.enable("strict routing")
	app.set("case sensitive routing", true)

	// redirect trailing slashes

	app.use((req, res, next) => {
		const hasTrailingSlash = req.path.slice(-1) === "/"
		const isNotRoot = req.path.length > 1

		if (hasTrailingSlash && isNotRoot) {
			const query = req.url.slice(req.path.length) // Preserve query parameters
			const safePath = req.path.slice(0, -1).replace(/\/\/+/g, "/") // Remove trailing slash and prevent double slashes

			// Redirect to the URL without the trailing slash
			res.redirect(HTTP_STATUS_CODE.MOVED_PERMANENTLY, safePath + query)
		} else next()
	})

	app.use(
		express.static(path.join(process.cwd(), appConfig.ASTRO_CONFIG.CLIENT_DIR), {
			extensions: ["html"]
		})
	)

	const rawBodyRoutes = appRoutes.filter((r) => r.kind === "POST" && r.zodData === "raw").map((r) => r.fullPath)

	// Separate raw body parsing from json parsing
	app.use((req, res, next) => {
		if (rawBodyRoutes?.includes(req.originalUrl)) {
			express.raw({ type: "application/json" })(req, res, next)
		} else {
			express.json({ limit: "5mb" })(req, res, next) //? use limit when needed for long client-side body payloads, like entire books as text ->  defaults to 2MB
		}
	})

	//------------------------------------------------------------------------------
	//
	// Handling Vite HMR
	//
	//------------------------------------------------------------------------------

	let proxyMiddleware: ReturnType<typeof createProxyMiddleware<Request, Response, NextFunction>>

	if (IS_DEV_MODE) {
		// for astro dev toolbar
		app.use(
			["/@id/astro"],
			createProxyMiddleware({
				changeOrigin: true,
				target: `http://localhost:4321${process.cwd()}/node_modules/astro/dist`,
				ws: true
			})
		)

		// for astro view transitions
		app.use(
			["/@id"],
			createProxyMiddleware({
				target: "http://localhost:4321/@id",
				changeOrigin: true,
				ws: true
			})
		)

		app.use(
			["/Users"],
			createProxyMiddleware({
				target: "http://localhost:4321/Users",
				changeOrigin: true,
				ws: true
			})
		)

		// for vite
		app.use(
			["/@vite"],
			createProxyMiddleware({
				target: "http://localhost:4321/@vite",
				changeOrigin: true,
				ws: true
			})
		)
		app.use(
			["/node_modules"],
			createProxyMiddleware({
				target: `http://localhost:4321${process.cwd()}/node_modules`,
				changeOrigin: true,
				ws: true
			})
		)

		// for files imported from packages in monorepo
		app.use(
			["/@fs", "/_astro"],
			createProxyMiddleware({
				target: "http://localhost:4321",
				changeOrigin: true,
				ws: true
			})
		)

		// for files imported using relative paths
		app.use(
			["/src"],
			createProxyMiddleware({
				target: `http://localhost:4321${process.cwd()}/src`,
				changeOrigin: true,
				ws: true
			})
		)

		proxyMiddleware = createProxyMiddleware({
			target: "http://localhost:4321",
			changeOrigin: true,
			ws: true, // Enables HMR over WebSockets,
			on: {
				proxyReq: (proxyReq, req) => {
					// Forward the `locals` header to Astro Dev Server
					const hmrHeader = req.headers[GLOBALS.ASTRO_LOCALS_HMR_HEADER]
					if (hmrHeader) {
						proxyReq.setHeader(GLOBALS.ASTRO_LOCALS_HMR_HEADER, hmrHeader)
						// Forces the backend to handle this request standalone
						// if keep-alive collisions are happening
						proxyReq.setHeader("Connection", "close")
					}
				}
			}
		})
	}

	//* ---------- Init Express File Upload -----------------------------------------------

	app.use(fileUpload())

	//* ---------- Init Passport Auth -----------------------------------------------

	if (APP_HAS_AUTH) {
		const MemoryStore = memStore(session)

		app.use(express.urlencoded({ extended: false }))
		app.set("trust proxy", 1) //* trust first proxy
		const MILLISECONDS_IN_SECOND = 1000
		app.use(
			session({
				cookie: { secure: "auto", maxAge: 24 * 60 * 60 * MILLISECONDS_IN_SECOND },
				store: new MemoryStore({
					checkPeriod: 86_400_000 //* prune expired entries every 24h
				}),
				secret: appConfig.AUTH_CONFIG.SESSION_SECRET,
				resave: false,
				saveUninitialized: true
			})
		)
		app.use(passport.initialize())
		app.use(passport.session())

		app.use(methodOverride("_method"))

		app.use(flash())

		_initPassport(appConfig.AUTH_CONFIG.GET_USER_BY_EMAIL_AND_ROLE)
	}

	type User = Express.User | false | undefined

	function _initPassport(getUserByEmail: GenericConfigWithAuth["AUTH_CONFIG"]["GET_USER_BY_EMAIL_AND_ROLE"]): void {
		if (!APP_HAS_AUTH) return
		const LocalStrategy = Strategy
		let userRole: string | undefined

		const authenticateUser: VerifyFunctionWithRequest = async (req, email, password, done) => {
			try {
				userRole = req.body?.role
				const user = (await getUserByEmail(email, userRole ?? "none")) as User
				if (!user)
					return done(null, false, {
						message: "No records have been found with the email and password you've entered."
					})

				if (await bcrypt.compare(password, (user as ExpressUserBase).password)) return done(null, user as User)
				return done(null, false, { message: "No records have been found with the email and password you've entered." })
			} catch (err) {
				return done(err)
			}
		}

		passport.use(
			new LocalStrategy(
				{
					usernameField: appConfig.AUTH_CONFIG.USERNAME_FIELD ?? "email", // define the parameter in req.body that passport can use as username and password
					passwordField: appConfig.AUTH_CONFIG.PASSWORD_FIELD ?? "password",
					passReqToCallback: true
				},
				authenticateUser
			)
		)

		type SerializedUser = Pick<ExpressUserBase, "email" | "role">

		passport.serializeUser<SerializedUser>((user, done) => {
			const expressUser = user as ExpressUserBase
			const serializeUser = { email: expressUser.email, role: expressUser.role }
			done(null, serializeUser)
		})

		passport.deserializeUser<SerializedUser>(async (serializedUser, done) => {
			const user = (await getUserByEmail(serializedUser.email, serializedUser.role)) as User
			done(null, user)
		})
	}

	//------------------------------------------------------------------------------
	//
	// HAQ Contexts
	//
	//------------------------------------------------------------------------------

	//* ---------- Req Context -----------------------------------------------

	const REQUEST_ADAPTER = (req: Request): I_InternalReqContext<ExpressUserBase> => {
		let url = req.url.split("?")[0] as string

		let dynamicParam: string | undefined
		let sessionURL: string | undefined
		let errorMessage: string | undefined

		return Object.freeze({
			// exposed general context

			getHeaders: () => req.headers,

			getErrorMessage: () => errorMessage as string,

			logout: () =>
				new Promise<true>((resolve) => {
					req.logout((err: unknown) => {
						if (err) {
							throw new Errors.CustomError("INTERNAL_SERVER_ERROR", {
								message: "An error occurred while logging out.",
								forClient: true,
								cause: err
							})
						}
						req.flash("success", "Logout successful")
						return resolve(true)
					})
				}),

			getPaths: () => {
				if (!dynamicParam) {
					return {
						expressPath: url,
						astroPath: url
					}
				}
				return _getPathsByParam(dynamicParam)
			},

			getPathParam: () => {
				if (!dynamicParam) return
				const reqParam = req.params[dynamicParam]
				return typeof reqParam === "string" ? reqParam : undefined
			},

			// exposed route specific methods

			getUser: () => req.user as ExpressUserBase | undefined,

			getBody: () => req.body,
			getFiles: () => req.files,
			getQuery: () => req.query,

			// internal methods

			getMethod: () => req.method as Method,
			isAuthenticated: () => req.isAuthenticated(),
			isUnauthenticated: () => req.isUnauthenticated(),
			getOriginalReqURL: () => req.originalUrl,
			getSessionURL: () => sessionURL,
			setSessionURL: (value: string | undefined) => {
				sessionURL = value
			},
			setPageURL: (value: string) => {
				url = value
			},
			setDynamicParam: (value: string | undefined) => {
				dynamicParam = value
			},
			setErrorMessage: (value: string) => {
				errorMessage = value
			}
		})

		function _getPathsByParam(param: string): ReqContextPaths {
			const lastIndexOfSlash = req.url.lastIndexOf("/")
			const rootPath = req.url.slice(0, lastIndexOfSlash)
			return {
				expressPath: `${rootPath}/:${param}`,
				astroPath: `${rootPath}/[${param}]`
			}
		}
	}

	//* ---------- Res Context -----------------------------------------------

	const RESPONSE_ADAPTER = (): I_InternalResContext => {
		let afterwareData: unknown | undefined

		return Object.freeze({
			getAfterwareData: () => afterwareData,
			setAfterwareData: (data: unknown) => {
				afterwareData = data
			}
		} satisfies I_InternalResContext)
	}

	//* ---------- Attach contexts -----------------------------------------------

	app.use((req: Request, res: Response, next: NextFunction) => {
		;(req as unknown as I_Request).context = REQUEST_ADAPTER(req)
		;(res as unknown as I_Response).context = RESPONSE_ADAPTER()
		next()
	})

	//------------------------------------------------------------------------------
	//
	// Register all Routes
	//
	//------------------------------------------------------------------------------

	const exactRoutes = appRoutes.filter((r) => !r.fullPath.includes(":"))
	const dynamicRoutes = appRoutes.filter((r) => r.fullPath.includes(":"))

	_registerRoutes(exactRoutes)
	_registerRoutes(dynamicRoutes)

	if (APP_HAS_AUTH) {
		_registerLogIn()
		_registerLogOut()
	}

	_initErrorHandler()

	_startServer()

	function _registerRoutes(routes: AppRoutes): void {
		for (const appRoute of routes) {
			switch (appRoute.kind) {
				case "PAGE":
				case "GET": {
					if (appRoute.isErrorRoute) continue
					if (appRoute.redirectFrom) {
						_redirect(appRoute.redirectFrom, appRoute.fullPath)
					}
					_registerGetRoute(appRoute)
					break
				}
				case "POST": {
					_registerPostRoute(appRoute)
					break
				}

				default:
					assertUnreachable(appRoute)
			}
		}
	}

	//------------------------------------------------------------------------------
	//
	// Permanent Redirects
	//
	//------------------------------------------------------------------------------

	function _redirect(redirectFrom: string, redirectTo: string): void {
		app.get(redirectFrom, (req, res) => {
			const query = (req as unknown as I_Request).context.getQuery()
			if (!query) return res.redirect(redirectTo)
			let queryString = "?"
			let index = 1
			for (const [key, value] of Object.entries(query)) {
				const ampersand = Object.keys(query).length === index ? "" : "&"
				queryString += `${key}=${value}${ampersand}`
				index++
			}
			res.redirect(HTTP_STATUS_CODE.MOVED_PERMANENTLY, `${redirectTo}${queryString}`)
		})
	}

	//------------------------------------------------------------------------------
	//
	// GET
	//
	//------------------------------------------------------------------------------

	function _registerGetRoute(appRoute: I_GET_RouteObj): void {
		const { middlewares, afterwares } = _populateAllMiddlewares(appRoute)

		if (appRoute.zodData) middlewares.push(makeQueryValidator(appRoute))
		if (APP_HAS_AUTH) middlewares.unshift(makeMiddlewareCb(appRoute, _handleAuth))

		if (appRoute.kind === "PAGE") __handlePageRoute()
		else __handleGetRoute()

		//* ---------- Initialize -----------------------------------------------

		function __handlePageRoute(): void {
			// login route shouldn't intercept originalUrl

			if (APP_HAS_AUTH && appRoute.fullPath === appConfig.AUTH_CONFIG.LOGIN_PAGE_ROUTE) {
				_registerLoginPageRoute(appRoute, middlewares, afterwares)
				return
			}

			// all other routes

			if (APP_HAS_AUTH) middlewares.unshift(_interceptOriginalUrl)

			app.get(
				appRoute.fullPath,
				_interceptReqParams,
				...middlewares,
				makePageCb(appConfig, appRoute, IS_DEV_MODE),
				IS_DEV_MODE ? proxyMiddleware : [],
				...afterwares
			)
		}

		function __handleGetRoute(): void {
			// partial
			if (appRoute.fullPartialPath) {
				app.get(
					appRoute.fullPath,
					...middlewares,
					makePartialCb(appConfig, appRoute, IS_DEV_MODE),
					IS_DEV_MODE ? proxyMiddleware : [],
					...afterwares
				)
				return
			}

			// regular get

			app.get(appRoute.fullPath, ...middlewares, makeGETCb(appRoute), ...afterwares)
		}
	}

	function _registerLoginPageRoute(
		appRoute: I_GET_RouteObj,
		middleWares: ExpressMiddleware[],
		afterwares: ExpressMiddleware[]
	): void {
		app.get(
			appRoute.fullPath,
			...middleWares,
			makePageCb(appConfig, appRoute, IS_DEV_MODE),
			IS_DEV_MODE ? proxyMiddleware : [],
			...afterwares
		)
	}

	//------------------------------------------------------------------------------
	//
	// POST
	//
	//------------------------------------------------------------------------------

	function _registerPostRoute(appRoute: I_POST_RouteObj): void {
		const { middlewares, afterwares } = _populateAllMiddlewares(appRoute)

		if (APP_HAS_AUTH) middlewares.unshift(makeMiddlewareCb(appRoute, _handleAuth))

		// partial
		if (appRoute.fullPartialPath) {
			app.post(
				appRoute.fullPath,
				...middlewares,
				makePartialCb(appConfig, appRoute, IS_DEV_MODE),
				IS_DEV_MODE ? proxyMiddleware : [],
				...afterwares
			)
			return
		}

		// regular post

		app.post(appRoute.fullPath, ...middlewares, makePOSTCb(appRoute), ...afterwares)
	}

	//------------------------------------------------------------------------------
	//
	// Auth Handling
	//
	//------------------------------------------------------------------------------

	function _registerLogIn(): void {
		if (!APP_HAS_AUTH) return

		const LOGIN_ROUTE = {
			kind: "POST",
			fullPath: "/haq-auth/login",
			roles: null,
			controllerArgs: {
				controller: (): InternalRouteControllerResponse => ({}),
				middleware: []
			}
		} satisfies I_POST_RouteObj

		appRoutes.push(LOGIN_ROUTE)

		const afterWare = appConfig.AUTH_CONFIG.LOGIN_SUCCESS_AFTERWARE
			? [makeAfterwareCb(appConfig.AUTH_CONFIG.LOGIN_SUCCESS_AFTERWARE as InternalAfterware, IS_DEV_MODE)]
			: []

		app.post(
			LOGIN_ROUTE.fullPath,
			makeMiddlewareCb(LOGIN_ROUTE, _handleAuth),
			(req: Request, _res: Response, next: NextFunction) => {
				;(req as unknown as I_Request).context.setSessionURL((req.session as unknown as SessionData).reqUrl)
				return next()
			},
			passport.authenticate("local", {
				failureRedirect: appConfig.AUTH_CONFIG.LOGIN_PAGE_ROUTE,
				failureFlash: true
			}),
			(req: Request, res: Response, next: NextFunction) => {
				const context = (req as unknown as I_Request).context
				const user = context.getUser() as ExpressUserBase

				const sessionURL = (req as unknown as I_Request).context.getSessionURL()

				if (sessionURL) res.redirect(sessionURL)
				else res.redirect(appConfig.AUTH_CONFIG.GET_AUTHENTICATED_REDIRECT_ROUTE(user.role))

				return next()
			},
			...afterWare
		)
	}

	function _registerLogOut(): void {
		if (!APP_HAS_AUTH) return

		const LOGOUT_ROUTE = {
			kind: "POST",
			fullPath: "/haq-auth/logout",
			roles: null,
			controllerArgs: {
				controller: (): InternalRouteControllerResponse => ({}),
				middleware: []
			}
		} satisfies I_POST_RouteObj

		appRoutes.push(LOGOUT_ROUTE)

		const _logOutController = async (
			context: I_InternalReqContext<ExpressUserBase>
		): Promise<MiddlewareResponse<string>> => {
			await context.logout()

			return { success: true }
		}

		const afterWare = appConfig.AUTH_CONFIG.LOGOUT_SUCCESS_AFTERWARE
			? [makeAfterwareCb(appConfig.AUTH_CONFIG.LOGOUT_SUCCESS_AFTERWARE as InternalAfterware, IS_DEV_MODE)]
			: []

		app.delete(
			LOGOUT_ROUTE.fullPath,
			makeMiddlewareCb(LOGOUT_ROUTE, _logOutController),
			(_req: Request, res: Response, next: NextFunction) => {
				res.redirect(appConfig.AUTH_CONFIG.LOGIN_PAGE_ROUTE)
				return next()
			},
			...afterWare
		)
	}

	function _handleAuth(context: I_InternalReqContext<ExpressUserBase>, appRoute: AppRoute): MiddlewareResponse<string> {
		if (!APP_HAS_AUTH) return { success: true }

		const expressPath = context.getPaths().expressPath

		const method = context.getMethod()

		const __checkNotAuthenticated = (): MiddlewareResponse<string> => {
			if (context.isUnauthenticated()) return { success: true }
			if (context.getMethod() === "GET") {
				const currentUser = context.getUser()
				if (!currentUser) {
					throw new Errors.CustomError("INTERNAL_SERVER_ERROR", {
						message: "Couldn't get authenticated user."
					})
				}

				return { redirect: appConfig.AUTH_CONFIG.GET_AUTHENTICATED_REDIRECT_ROUTE(currentUser.role) }
			}
			throw new Errors.CustomError("UNAUTHORIZED", {
				message: "You do not have access to this API request.",
				forClient: true
			})
		}

		const __handleUnauthenticated = (): MiddlewareResponse<string> => {
			if (method === "GET") {
				return { redirect: appConfig.AUTH_CONFIG.LOGIN_PAGE_ROUTE }
			}
			throw new Errors.CustomError("UNAUTHENTICATED", {
				message: "You are not authenticated. Please log in.",
				forClient: true
			})
		}

		const __handleUnauthorized = (): MiddlewareResponse<string> => {
			if (method === "GET") {
				const currentUser = context.getUser()
				if (!currentUser) {
					throw new Errors.CustomError("INTERNAL_SERVER_ERROR", {
						message: "Couldn't get authenticated user."
					})
				}

				return { redirect: appConfig.AUTH_CONFIG.GET_AUTHENTICATED_REDIRECT_ROUTE(currentUser.role) }
			}
			throw new Errors.CustomError("UNAUTHORIZED", {
				message: "You do not have access to this API request.",
				forClient: true
			})
		}

		const roles = appRoute.roles
		if (roles === undefined) {
			throw new Errors.CustomError("INTERNAL_SERVER_ERROR", {
				message: `Expected a roles object for route: ${expressPath}.`
			})
		}

		// if public, return success

		if (roles === "public") {
			return { success: true }
		}

		// if null, check not authenticated

		if (roles === null) return __checkNotAuthenticated()

		// check authenticated

		const user = context.getUser()
		if (!user) return __handleUnauthenticated()

		// check role

		const hasRole = roles.includes(user.role)
		if (hasRole) return { success: true }

		return __handleUnauthorized()
	}

	//------------------------------------------------------------------------------
	//
	// Error Handling
	//
	//------------------------------------------------------------------------------

	const NOT_FOUND_ROUTE = {
		kind: "PAGE",
		fullPath: "/404",
		controllerArgs: {
			controller: (): InternalRouteControllerResponse => ({}),
			middleware: []
		}
	} satisfies I_GET_RouteObj

	const customBadRequestRoute = appRoutes.find((r) => r.kind === "PAGE" && r.fullPath === "/400") as I_GET_RouteObj

	const BAD_REQUEST_ROUTE =
		customBadRequestRoute ??
		({
			kind: "PAGE",
			fullPath: "/400",
			controllerArgs: {
				controller: (): InternalRouteControllerResponse => ({}),
				middleware: []
			}
		} satisfies I_GET_RouteObj)

	const customInternalServerRoute = appRoutes.find((r) => r.kind === "PAGE" && r.fullPath === "/500") as I_GET_RouteObj

	const INTERNAL_SERVER_ERROR_ROUTE =
		customInternalServerRoute ??
		({
			kind: "PAGE",
			fullPath: "/500",
			controllerArgs: {
				controller: (): InternalRouteControllerResponse => ({}),
				middleware: []
			}
		} satisfies I_GET_RouteObj)

	function _errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
		const context = (req as unknown as I_Request).context
		const expressPath = context.getPaths().expressPath
		const method = context.getMethod()

		const httpError = makeHttpError({ error, method, route: expressPath, isDevMode: IS_DEV_MODE })

		if (res.headersSent) return

		if (method === "GET") {
			__handleGET(httpError.statusCode)
			return
		}

		// all other methods
		__sendJSONErrorResponse()

		//* ---------- Helpers -----------------------------------------------

		async function __handleGET(statusCode: ErrorStatusCodes): Promise<void> {
			const currentAppRoute = ___getCurrentGETRoute()

			switch (statusCode) {
				case HTTP_STATUS_CODE.NOT_FOUND: {
					await _invalidPathHandler(req, res, next)
					break
				}

				case HTTP_STATUS_CODE.UNAUTHORIZED:
				case HTTP_STATUS_CODE.BAD_REQUEST: {
					if (currentAppRoute.kind === "GET" || !customBadRequestRoute) __sendJSONErrorResponse()
					else await __handleBadRequestPage(statusCode)

					break
				}

				case HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR: {
					if (currentAppRoute.kind === "GET" || !customInternalServerRoute) __sendJSONErrorResponse()
					else __handleInternalServerErrorPage(statusCode)
					break
				}

				default:
			}

			//* ---------- Helpers -----------------------------------------------

			function ___getCurrentGETRoute(): AppRoute {
				const route = appRoutes.find((r) => r.fullPath === expressPath && (r.kind === "GET" || r.kind === "PAGE"))

				if (!route) {
					throw new Errors.CustomError("INTERNAL_SERVER_ERROR", {
						message: "Unreachable at _getCurrentGETRoute()"
					})
				}

				return route
			}
		}

		async function __handleBadRequestPage(statusCode: ErrorStatusCodes): Promise<void> {
			context.setPageURL("/400")
			context.setDynamicParam(undefined)
			context.setErrorMessage(httpError.data.errorMessage)
			const errorCallback = makePageCb(appConfig, BAD_REQUEST_ROUTE, IS_DEV_MODE, statusCode)
			await errorCallback(req, res, next)
		}

		async function __handleInternalServerErrorPage(statusCode: ErrorStatusCodes): Promise<void> {
			context.setPageURL("/500")
			context.setDynamicParam(undefined)
			context.setErrorMessage(httpError.data.errorMessage)
			const errorCallback = makePageCb(appConfig, INTERNAL_SERVER_ERROR_ROUTE, IS_DEV_MODE, statusCode)
			await errorCallback(req, res, next)
		}

		function __sendJSONErrorResponse(): void {
			res.set(httpError.headers).status(httpError.statusCode).send(httpError.data)
		}
	}

	async function _invalidPathHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
		const context = (req as unknown as I_Request).context

		const expressPath = context.getPaths().expressPath
		const method = context.getMethod()

		const validAppRoute =
			method === "GET"
				? appRoutes.find((r) => r.fullPath === expressPath && (r.kind === "GET" || r.kind === "PAGE"))
				: appRoutes.find((r) => r.fullPath === expressPath && r.kind === "POST")

		if (validAppRoute) return // this gets called when there are no handlers left after calling next() in afterResponseCb or no afterWareCb is used

		if (method === "GET") {
			context.setPageURL("/404")
			context.setDynamicParam(undefined)
			const notFoundCallback = makePageCb(appConfig, NOT_FOUND_ROUTE, IS_DEV_MODE, HTTP_STATUS_CODE.NOT_FOUND)
			await notFoundCallback(req, res, next)
			return
		}

		// all other methods
		if (!res.headersSent) res.status(HTTP_STATUS_CODE.NOT_FOUND).send()
	}

	function _initErrorHandler(): void {
		app.use(_invalidPathHandler, IS_DEV_MODE ? proxyMiddleware : [])
		app.use(_errorHandler, IS_DEV_MODE ? proxyMiddleware : [])
	}

	//------------------------------------------------------------------------------
	//
	// Start Server
	//
	//------------------------------------------------------------------------------

	function _startServer(): void {
		const server = http.createServer(app)
		const IP_ADDRESS = appConfig.IP_ADDRESS ?? "0.0.0.0"
		server.listen(appConfig.PORT, IP_ADDRESS, () => {
			console.info(`Listening on port ${appConfig.PORT} --> ${new Date().toUTCString()}`, "\n")
		})
	}

	//------------------------------------------------------------------------------
	//
	// Helpers
	//
	//------------------------------------------------------------------------------

	function _hasAuth(config: GenericConfig): config is GenericConfigWithAuth {
		return hasProperty(config as GenericConfigWithAuth, "AUTH_CONFIG")
	}

	function _interceptOriginalUrl(req: Request, _res: Response, next: NextFunction): void {
		;(req.session as unknown as SessionData).reqUrl = (req as unknown as I_Request).context.getOriginalReqURL()
		next()
	}

	function _interceptReqParams(req: Request, _res: Response, next: NextFunction): void {
		const dynamicParam = Object.keys(req.params)[0]
		;(req as unknown as I_Request).context.setDynamicParam(dynamicParam)
		next()
	}

	type RT__populateAllMiddlewares = {
		middlewares: ExpressMiddleware[]
		afterwares: ExpressMiddleware[]
	}
	function _populateAllMiddlewares(appRoute: AppRoute): RT__populateAllMiddlewares {
		const middlewares = _populateMiddlewares(appRoute)
		const afterwares = _populateAfterwares(appRoute)

		return { middlewares, afterwares }
	}

	function _populateMiddlewares(appRoute: AppRoute): ExpressMiddleware[] {
		const middlewares: ExpressMiddleware[] = []

		for (const controller of appRoute.controllerArgs.middleware) {
			middlewares.push(makeMiddlewareCb(appRoute, controller))
		}
		return middlewares
	}

	function _populateAfterwares(appRoute: AppRoute): ExpressMiddleware[] {
		const middlewares: ExpressMiddleware[] = []

		if (appRoute.controllerArgs.afterware) {
			middlewares.push(makeAfterwareCb(appRoute.controllerArgs.afterware, IS_DEV_MODE))
		}
		return middlewares
	}
}

//------------------------------------------------------------------------------
//
// Local Types
//
//------------------------------------------------------------------------------

type SessionData = {
	reqUrl: string | undefined
}

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void> | void
