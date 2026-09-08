//#region -------------------------------------------------- Type Imports

import type { UnionToIntersection } from "@haq/utils/types"
import type { I_AppComponent } from "../app-component/types.js"
import type { DOMElementPropsWithOnPrefix } from "../types/dynamic.js"
import type { ComponentEventsShape, FileUploaderEvents, I_ComponentShape } from "../types/static.js"
import type { AppRouterClass } from "./index.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// AppRouterClass constructor args
//
//------------------------------------------------------------------------------

export type ARGS_AppRouterClass<GIA_ComponentsRouter extends ComponentsRouterShape> = {
	/*******************************************************************************
	 *
	 * Components router object satisfying the generated `HAQ_AppComponents_X` type.
	 *
	 ******************************************************************************/

	componentsRouter: GIA_ComponentsRouter

	/*******************************************************************************
	 *
	 * Events router object (optional).
	 *
	 ******************************************************************************/

	eventsRouter?: AppEventsRouter<GIA_ComponentsRouter>

	/*******************************************************************************
	 *
	 * Callback that gets called after the `astro:page-load` event of the view transitions life cycle (optional).
	 *
	 ******************************************************************************/

	afterSwapHandler?: (
		route: keyof GIA_ComponentsRouter,
		components: ExposedConstructedComponents<GIA_ComponentsRouter>,
		isInitialLoad: boolean
	) => void

	/*******************************************************************************
	 *
	 * Callback for the `resize` event on the `window` object (optional).
	 *
	 ******************************************************************************/

	resizeHandler?: (
		route: keyof GIA_ComponentsRouter,
		components: ExposedConstructedComponents<GIA_ComponentsRouter>,
		isInitialLoad: boolean
	) => void
}

//------------------------------------------------------------------------------
//
// Shape of `componentsRouter` passed arg that will be inferred
//
//------------------------------------------------------------------------------

export type ComponentsRouterShape = {
	[route: string]: {
		[AppComponentName: string]: AppComponentClassDefShape
	}
}

type AppComponentClassDefShape = {
	new (): AppComponentClassOwnProperties<ComponentsRouterShape[string][string]["prototype"]>
	prototype: { destructor: () => void }
	__T_appEvents: ComponentEventsShape | false
}

type AppComponentClassOwnProperties<AppComponentEl> = Omit<
	AppComponentEl,
	| keyof HTMLElement
	| "handleEvent"
	| keyof I_AppComponent<I_ComponentShape, ComponentEventsShape>
	| DOMElementPropsWithOnPrefix
>

//------------------------------------------------------------------------------
//
// Internal constructed components
//
//------------------------------------------------------------------------------

export type InternalConstructedComponents<ComponentsRouter extends ComponentsRouterShape> = {
	[R in keyof ComponentsRouter]: {
		[K in keyof ComponentsRouter[R]]: AppComponentClassDefShape["prototype"]
	}
}

//------------------------------------------------------------------------------
//
// Exposed components router after all components have been constructed
//
//------------------------------------------------------------------------------

export type ExposedConstructedComponents<ComponentsRouter extends ComponentsRouterShape> = {
	[R in keyof ComponentsRouter]: {
		[K in keyof ComponentsRouter[R]]: AppComponentClassOwnProperties<ComponentsRouter[R][K]["prototype"]>
	}
}

//------------------------------------------------------------------------------
//
// Extract app events from components router
//
//------------------------------------------------------------------------------

export type ExtractAllAppEventsFromComponentsRouter<ComponentsRouter extends ComponentsRouterShape> =
	UnionToIntersection<AppEventsUnion<ComponentsRouter>> & FileUploaderEvents

type AppEventsUnion<ComponentsRouter extends ComponentsRouterShape> = {
	[R in keyof ComponentsRouter]: {
		[K in keyof ComponentsRouter[R]]: "__T_appEvents" extends keyof ComponentsRouter[R][K]
			? ComponentsRouter[R][K]["__T_appEvents"]
			: never
	}[keyof ComponentsRouter[R]]
}[keyof ComponentsRouter]

/*******************************************************************************
 *
 * Type helper to extract all global app events and map them to their emitted data.
 *
 * @typeParam ComponentsRouter - the components router type satisfying the generated `HAQ_AppComponents_X` type.
 *
 * @example
 * ```ts
 * export type AppEvents = HAQ_AppEvents<HAQ_AppComponents_X>
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export type AppEvents<ComponentsRouter extends ComponentsRouterShape> =
	ExtractAllAppEventsFromComponentsRouter<ComponentsRouter>

/*******************************************************************************
 *
 * Type definition for the `eventsRouter` argument in `AppRouter`.
 *
 * Useful when you want to avoid inlining the `eventsRouter` in `AppRouter`
 *
 * @typeParam ComponentsRouter - the components router type satisfying the generated `HAQ_AppComponents_X` type.
 *
 * @example
 * ```ts
 * export const eventsRouter: HAQ_AppEventsRouter<HAQ_AppComponents_X> = {
 *   // your events here
 * }
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export type AppEventsRouter<ComponentsRouter extends ComponentsRouterShape> = {
	[EventName in keyof AppEvents<ComponentsRouter>]: ExecutedAction<
		AppEvents<ComponentsRouter>,
		EventName,
		ComponentsRouter
	>
}

type ExecutedAction<
	ComponentEvents extends ComponentEventsShape,
	EventName extends keyof ComponentEvents,
	ComponentsRouter extends ComponentsRouterShape
> = (context: AppRouterClass<ComponentsRouter>, data: ComponentEvents[EventName]) => void
