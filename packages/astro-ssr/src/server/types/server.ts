//#region -------------------------------------------------- Type Imports

import type { UnknownObj } from "@haq/utils/types"
import type { App_Routers, RT_App } from "./app.js"
import type { AppConfig, DeepExact, DeepNoExtraKeys, PAGE_Route, SuggestedBaseURL } from "./dynamic.js"
import type { RT_createErrorContext } from "./error-page.js"
import type { Router_PartialAndEmailRoutes, RT_createRouter } from "./router.js"
import type { ExpressUserBase, InternalRouteLiteral, PartialMarkupShape } from "./static.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// makeServer return
//
//------------------------------------------------------------------------------

export interface RT_makeServer<
	GPA_RenderedRoutes extends string,
	GPA_PartialMarkup extends PartialMarkupShape,
	GPA_ExpressUser extends ExpressUserBase | false = false
> {
	/*******************************************************************************
	 *
	 * Your App's main entry point where all your routes will be registered at runtime.
	 *
	 * @param appConfig The App config.
	 * @param routers An array of all your routers.
	 *
	 * @returns Compile time App types to use accross your project.
	 *
	 * NOTE: The actual runtime value returned is `Symbol(type)`.
	 * So make sure you do not access it at runtime.
	 *
	 * @example
	 * ```ts
	 * // Without Auth
	 *
	 * const App = Server.App(
	 *   {
	 *     PORT: 3000,
	 *     IS_DEV_MODE: process.env.NODE_ENV === "development",
	 *     ASTRO_CONFIG: {
	 *       SSR_HANDLER: ssrHandler,
	 *       CLIENT_DIR: "@dist/@astro/client"
	 *     },
	 *   },
	 *   [
	 *     // your routers here
	 *   ]
	 * )
	 *
	 * export type AppTypes = typeof App
	 * // Now you can use this type for your whole full-stack App
	 * ```
	 *
	 * @example
	 * ```ts
	 * // With Auth
	 *
	 * const App = Server.App(
	 *   {
	 *     PORT: 3000,
	 *     IS_DEV_MODE: process.env.NODE_ENV === "development",
	 *     ASTRO_CONFIG: {
	 *       SSR_HANDLER: ssrHandler,
	 *       CLIENT_DIR: "@dist/@astro/client"
	 *     },
	 *     AUTH_CONFIG: {
	 *       SESSION_SECRET: process.env.SESSION_SECRET,
	 *       LOGIN_PAGE_ROUTE: "/auth/login",
	 *       GET_AUTHENTICATED_REDIRECT_ROUTE: (role) => {
	 *         switch (role) {
	 *           case "ADMIN":
	 *           case "CLIENT":
	 *             return "/"
	 *           default:
	 *             return "/"
	 *         }
	 *       },
	 *       GET_USER_BY_EMAIL_AND_ROLE: (email, role): Promise<ExpressUser | undefined> => getUser(email)
	 *     }
	 *   },
	 *   [
	 *     // your routers here
	 *   ]
	 * )
	 *
	 * export type AppTypes = typeof App
	 * // Now you can use this type for your whole full-stack App
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	App: <
		IA_Config extends AppConfig<PAGE_Route<GPA_RenderedRoutes>, GPA_ExpressUser>,
		IA_BaseURL extends string,
		IA_Routers extends App_Routers<IA_BaseURL>
	>(
		appConfig: IA_Config & DeepExact<IA_Config, AppConfig<PAGE_Route<GPA_RenderedRoutes>, GPA_ExpressUser>>,
		routers: IA_Routers
	) => RT_App<GPA_RenderedRoutes, GPA_PartialMarkup, GPA_ExpressUser, IA_Config, IA_BaseURL, IA_Routers>

	/*******************************************************************************
	 *
	 * Factory that provides router methods.
	 *
	 * @param baseURL The base URL for your router.
	 * @param partialAndEmailRouteTypes The types that your Astro `@partial` and `@email` pages will receive as data.
	 *
	 * @returns Methods to define your routes and middleware.
	 *
	 * @example
	 * ```ts
	 * // Without any partial or email routes:
	 * // main/index.ts
	 *
	 * import type { T_Server } from "./server.js" // your exported type from typeof makeServer()
	 *
	 * function makeRouter(Server: T_Server) {
	 *   return Server.defineRouter("/")
	 * }
	 *
	 * export type T_Router = ReturnType<typeof makeRouter>
	 *
	 * export function main(Server: G_Server) {
	 *   const Router = makeRouter(Server)
	 *
	 *   return [indexPage(Router)]
	 * }
	 * ```
	 *
	 * @example
	 * ```ts
	 * // With partial or email routes:
	 * // main/index.ts
	 *
	 * import type { T_Server } from "./server.js" // your exported type from typeof makeServer()
	 * import { _T } from "@haq/utils"
	 * import { indexPage } from "./index-page.ts"
	 *
	 * function makeRouter(Server: T_Server) {
	 *   return Server.defineRouter("/", {
	 *     PARTIAL: {
	 *         "/some-partial-route": _T<{someProp:string}>()
	 *     },
	 *     EMAIL: {
	 *       "/password-changed": _T<{someProp:string}>()
	 *     }
	 *  })
	 * }
	 *
	 * export type T_Router = ReturnType<typeof makeRouter>
	 *
	 * export function main(Server: G_Server) {
	 *   const Router = makeRouter(Server)
	 *
	 *   return [indexPage(Router)]
	 * }
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	defineRouter: <
		IA_BaseURL extends SuggestedBaseURL<GPA_RenderedRoutes>,
		IA_PartialAndEmailRoutes extends Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>
	>(
		baseURL: IA_BaseURL extends `${InternalRouteLiteral}${string}` ? never : IA_BaseURL,
		..._T_partialAndEmailRoutes: Router_PartialAndEmailRoutes<
			GPA_RenderedRoutes,
			GPA_PartialMarkup,
			IA_BaseURL
		> extends never
			? []
			: [
					IA_PartialAndEmailRoutes &
						DeepNoExtraKeys<
							IA_PartialAndEmailRoutes,
							Router_PartialAndEmailRoutes<GPA_RenderedRoutes, GPA_PartialMarkup, IA_BaseURL>
						>
				]
	) => RT_createRouter<GPA_RenderedRoutes, GPA_PartialMarkup, GPA_ExpressUser, IA_BaseURL, IA_PartialAndEmailRoutes>

	/*******************************************************************************
	 *
	 * Factory that provides PAGE methods for rendering Error pages.
	 *
	 * @typeParam PA_Response - The type the Astro error page will receive as data (optional).
	 *
	 * @example
	 * ```ts
	 * // errors/400-page.ts
	 *
	 * import type { T_Server } from "./server.js" // your exported type from typeof makeServer()
	 *
	 * export function page_400(Server: T_Server) {
	 *   type AstroProps =  {errorMessage: string }
	 *
	 *   const route = Server.defineErrorContext<AstroProps>()("/400")
	 *
	 *   type RT = typeof route.T_response // we use this to explicitly assign a return type to our controller to prevent any excess properties to be sent.
	 *
	 *   route.PAGE({
	 *     controller: (context): RT => {
	 *       const errorMessage = context.getErrorMessage()
	 *       return {
	 *         errorMessage
	 *       }
	 *     }
	 *   })
	 *
	 *   return route
	 * }
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	defineErrorContext: <PA_Response extends UnknownObj = UnknownObj>() => RT_createErrorContext<
		GPA_RenderedRoutes,
		PA_Response
	>
}
