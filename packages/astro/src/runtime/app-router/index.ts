//#region -------------------------------------------------- Type Imports

import type { InternalGlobalCustomEvent } from "../app-component/types.js"
import type {
	AppEventsRouter,
	ARGS_AppRouterClass,
	ComponentsRouterShape,
	ExposedConstructedComponents,
	InternalConstructedComponents
} from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { entriesFromObject } from "@haq/utils"
import { HAQ_APP_EVENT_NAME } from "../globals.js"

//#endregion ----------------------------------------------- Module Imports

export class AppRouterClass<GIA_ComponentsRouter extends ComponentsRouterShape> {
	private readonly COMPONENTS_ROUTER: ARGS_AppRouterClass<GIA_ComponentsRouter>["componentsRouter"] // typescript & biome don't accedpt typeof this.#COMPONENTS_ROUTER
	readonly #eventsRouter: ARGS_AppRouterClass<GIA_ComponentsRouter>["eventsRouter"]
	readonly #afterSwapHandler: ARGS_AppRouterClass<GIA_ComponentsRouter>["afterSwapHandler"]
	readonly #resizeHandler: ARGS_AppRouterClass<typeof this.COMPONENTS_ROUTER>["resizeHandler"]

	#CURRENT_ROUTE
	#IS_INITIAL_LOAD = true

	readonly #constructedComponentsRouter: Partial<ExposedConstructedComponents<GIA_ComponentsRouter>> = {}

	constructor({
		componentsRouter,
		eventsRouter,
		afterSwapHandler,
		resizeHandler
	}: ARGS_AppRouterClass<GIA_ComponentsRouter>) {
		this.COMPONENTS_ROUTER = componentsRouter
		this.#eventsRouter = eventsRouter
		this.#afterSwapHandler = afterSwapHandler
		this.#resizeHandler = resizeHandler

		this.#CURRENT_ROUTE = this.#getCurrentPath()

		this.#init()
	}

	//* ---------- Public API -----------------------------------------------

	/*******************************************************************************
	 *
	 * @returns Current route
	 *
	 ******************************************************************************/

	getCurrentRoute(): keyof GIA_ComponentsRouter {
		return this.#CURRENT_ROUTE
	}

	/*******************************************************************************
	 *
	 * @param route "any"
	 * @returns The non nullable constucted components router that exist in every route.
	 *
	 ******************************************************************************/

	getCurrentComponents<IA_Route extends keyof GIA_ComponentsRouter>(
		route: "any"
	): ExposedConstructedComponents<GIA_ComponentsRouter>[IA_Route]

	/*******************************************************************************
	 *
	 * @param route Current route
	 * @returns The nullable constucted components router for the given route
	 *
	 ******************************************************************************/

	getCurrentComponents<IA_Route extends keyof GIA_ComponentsRouter>(
		route: IA_Route
	): ExposedConstructedComponents<GIA_ComponentsRouter>[IA_Route] | undefined

	getCurrentComponents<IA_Route extends keyof GIA_ComponentsRouter & string>(
		route: "any" | IA_Route
	): ExposedConstructedComponents<GIA_ComponentsRouter>[IA_Route] | undefined {
		if (route === "any")
			return this.#constructedComponentsRouter[
				this.#CURRENT_ROUTE
			] as unknown as ExposedConstructedComponents<GIA_ComponentsRouter>[IA_Route]

		if (route !== this.#CURRENT_ROUTE) {
			console.warn(`Route: "${route}" is not the current route.`)
			return
		}

		return this.#constructedComponentsRouter[route]
	}

	//* ---------- Internal -----------------------------------------------

	#init(): void {
		const isUsingAstroTransitions = document.head.querySelector(`meta[name="astro-view-transitions-enabled"]`) !== null

		if (document.startViewTransition === undefined || !isUsingAstroTransitions) {
			document.addEventListener("DOMContentLoaded", this.#onAfterSwap)
		} else {
			document.addEventListener("astro:before-swap", this.#onBeforeSwap)
			document.addEventListener("astro:page-load", this.#onAfterSwap)
		}

		if (this.#resizeHandler) window.addEventListener("resize", this.#onResize)

		if (this.#eventsRouter) initAppEventListener(this.#eventsRouter, this)

		this.#handleRoute()
	}

	readonly #onBeforeSwap = (): void => {
		const routeObj = this.#constructedComponentsRouter[
			this.#CURRENT_ROUTE
		] as unknown as InternalConstructedComponents<GIA_ComponentsRouter>[keyof InternalConstructedComponents<GIA_ComponentsRouter>]
		if (!routeObj) return

		for (const [_key, AppClass] of entriesFromObject(routeObj)) {
			AppClass.destructor()
		}
	}

	readonly #onAfterSwap = (): void => {
		this.#onResize()
		// avoid calling #handleRoute() twice on initial load, only after a view transition
		if (!this.#IS_INITIAL_LOAD) this.#handleRoute()

		if (this.#afterSwapHandler) {
			this.#afterSwapHandler(
				this.#CURRENT_ROUTE,
				this.#constructedComponentsRouter as ExposedConstructedComponents<GIA_ComponentsRouter>,
				this.#IS_INITIAL_LOAD
			)
		}

		if (this.#IS_INITIAL_LOAD === true) {
			this.#IS_INITIAL_LOAD = false
		}
	}

	readonly #onResize = (): void => {
		if (!this.#resizeHandler) return
		this.#resizeHandler(
			this.#CURRENT_ROUTE,
			this.#constructedComponentsRouter as ExposedConstructedComponents<GIA_ComponentsRouter>,
			this.#IS_INITIAL_LOAD
		)
	}

	#handleRoute(): void {
		this.#CURRENT_ROUTE = this.#getCurrentPath()
		this.#constructAppComponents(this.#CURRENT_ROUTE)
	}

	#constructAppComponents<IA_Route extends keyof GIA_ComponentsRouter>(route: IA_Route): void {
		const routeObj = this.COMPONENTS_ROUTER[route]
		if (!routeObj) return

		// reset App Components map
		this.#constructedComponentsRouter[route] = {} as ExposedConstructedComponents<GIA_ComponentsRouter>[IA_Route]

		for (const [key, AppClass] of entriesFromObject(routeObj)) {
			this.#constructedComponentsRouter[route][key] = new AppClass()
		}
	}

	#getCurrentPath(): keyof GIA_ComponentsRouter & string {
		const HTML_ROUTE_DIRECTIVE = "x_page"

		const pageAttribute = document.documentElement.getAttribute(HTML_ROUTE_DIRECTIVE)
		if (!pageAttribute) {
			throw new Error(`Missing "${HTML_ROUTE_DIRECTIVE}" attribute in root document.\n`)
		}

		if (!this.COMPONENTS_ROUTER[pageAttribute]) {
			throw new Error(`Missing AppComponents for the route "${pageAttribute}".\n`)
		}

		return pageAttribute as keyof typeof this.COMPONENTS_ROUTER & string
	}
}

//------------------------------------------------------------------------------
//
// Initialize and register global app event listener
//
//------------------------------------------------------------------------------

function initAppEventListener<ComponentsRouter extends ComponentsRouterShape>(
	router: AppEventsRouter<ComponentsRouter>,
	clientRouter: AppRouterClass<ComponentsRouter>
): void {
	globalThis.addEventListener(HAQ_APP_EVENT_NAME, (e) => {
		const detail = (e as InternalGlobalCustomEvent).detail

		const eventCallback = router[detail.eventName as keyof AppEventsRouter<ComponentsRouter>] as (
			context: typeof clientRouter,
			data: unknown
		) => void

		if (!eventCallback) {
			console.warn(
				`Event: "${detail.eventName}" was fired but could not find its handler.\nMake sure to add a handler.`
			)
			return
		}

		eventCallback(clientRouter, detail.data)
	})
}
