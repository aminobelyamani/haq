/*******************************************************************************
 *
 * Compile time types and runtime symbols for HAQ Astro.
 *
 * @module
 *
 ******************************************************************************/

//#region -------------------------------------------------- Type Imports

import type { HTMLAttributes } from "astro/types"
import type { z } from "zod"
import type { ValidAppComponent } from "./app-component/types.js"
import type { ARGS_AppRouterClass, ComponentsRouterShape } from "./app-router/types.js"
import type { I_BaseComponent } from "./types/base-component.js"
import type {
	ConstructedEvent,
	IsValidWebComponent,
	RenderedDOMElement,
	ValidComponentProp,
	ValidNativeEvType
} from "./types/dynamic.js"
import type { ComponentEventsShape, I_ComponentShape, MU_RootDocument } from "./types/static.js"
import type { I_URLSearchParams } from "./types/typed-url-search-params.js"
import type { I_WebComponent } from "./web-component/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppComponentClass } from "./app-component/index.js"
import { AppRouterClass } from "./app-router/index.js"
import { WebComponentClass } from "./web-component/index.js"

//#endregion ----------------------------------------------- Module Imports

//#region -------------------------------------------------- Main API

/*******************************************************************************
 *
 * Typed wrapper for `customElements.define()`.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/CustomElementRegistry/define)
 *
 * @param componentClass The class that defines the custom element.
 * @param tagName The tag name of the custom element.
 *
 * @example
 * ```ts
 * type T = MU_MyElem // imported from generated haq file - markup.ts
 *
 * export class MyElem extends WebComponent<T>() {...}
 *
 * defineWebComponent(MyElem, "my-elem")
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function defineWebComponent<
	IA_Component extends I_ComponentShape,
	IA_ComponentSevents extends ComponentEventsShape | false
>(
	componentClass: ValidWebComponent<IA_Component, IA_ComponentSevents>,
	tagName: IsValidWebComponent<IA_Component> extends true ? ValidComponentProp<IA_Component, "HAQ_tag"> : never
): void {
	customElements.define(tagName as string, componentClass as unknown as CustomElementConstructor)
}

/*******************************************************************************
 *
 * # HAQ Astro Web Component
 *
 * Typed wrapper for the `HTMLElement` object that extends a custom element class.
 *
 * It allows to correctly type `this` within the custom element class.
 *
 * NOTE: Must be passed a valid HAQ Generated Markup type argument from a WebComponent. The original markup must have a `x_webc` directive.
 *
 * NOTE: Class must be exported in order for proper type checking.
 *
 * @typeParam PA_Component - The generated markup type.
 * @typeParam PA_ComponentEvents - The custom events type. (optional)
 *
 * @example
 * ```ts
 * type T = MU_MyElem // imported from generated haq file - markup.ts
 *
 * export class MyElem extends WebComponent<T>() {...}
 * ```
 * @example
 * ```ts
 * type T = MU_MyElem // imported from generated haq file - markup.ts
 *
 * type E = {
 *   "my-elem:some-event": {
 *     someProp:string
 *   }
 * }
 *
 * export class MyElem extends WebComponent<T, E>() {...}
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function WebComponent<
	PA_Component extends I_ComponentShape,
	PA_ComponentEvents extends ComponentEventsShape | false = false
>(): ValidWebComponent<PA_Component, PA_ComponentEvents> {
	return WebComponentClass<PA_Component, ComponentEventsShape> as unknown as ValidWebComponent<
		PA_Component,
		PA_ComponentEvents
	>
}

type ValidWebComponent<PA_Component extends I_ComponentShape, PA_ComponentEvents extends ComponentEventsShape | false> =
	IsValidWebComponent<PA_Component> extends true ? WebComponentClassDef<PA_Component, PA_ComponentEvents> : never

type WebComponentClassDef<
	PA_Component extends I_ComponentShape,
	PA_ComponentEvents extends ComponentEventsShape | false
> = {
	new (): RenderedDOMElement<PA_Component> &
		(PA_ComponentEvents extends ComponentEventsShape
			? I_WebComponent<PA_Component, PA_ComponentEvents>
			: I_BaseComponent<PA_Component>)
	prototype: RenderedDOMElement<PA_Component> &
		(PA_ComponentEvents extends ComponentEventsShape
			? I_WebComponent<PA_Component, PA_ComponentEvents>
			: I_BaseComponent<PA_Component>)
	__T_customEvents: PA_ComponentEvents
}

/*******************************************************************************
 *
 * # HAQ Astro App Component
 *
 * Typed wrapper for the element returned by `document.getElementById`.
 *
 * It allows to correctly type `this` within the AppComponent class.
 *
 * NOTE: Must be passed a valid HAQ Generated Markup type argument from an App Component.
 *
 * NOTE: The original markup must have an `id` attribute.
 *
 * NOTE: The aliased component in your Astro /pages folder must have a `x_appc` directive.
 *
 * NOTE: Class must be exported in order for proper type checking.
 *
 * @typeParam PA_Component - The generated markup type.
 * @typeParam PA_ComponentEvents - The custom events type. (optional)
 *
 * @throws {Error} Throws an Error if the queried element (argument passed to `super()` in constructor) is not found in the DOM.
 *
 * @example
 * ```ts
 * type T = MU_MyAppComponent // imported from generated haq file - markup.ts
 *
 * export class MyAppComponent extends AppComponent<T>() {
 *   constructor() {
 *     super("elementId")
 *   }
 * }
 * ```
 * @example
 * ```ts
 * type T = MU_MyAppComponent // imported from generated haq file - markup.ts
 *
 * type E = {
 *   "some-event": {
 *     someProp:string
 *   }
 * }
 *
 * export class MyAppComponent extends AppComponent<T, E>() {
 *   constructor() {
 *     super("elementId")
 *   }
 * }
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function AppComponent<
	PA_Component extends I_ComponentShape,
	PA_ComponentEvents extends ComponentEventsShape | false = false
>(): ValidAppComponent<PA_Component, PA_ComponentEvents> {
	return AppComponentClass<PA_Component, ComponentEventsShape> as unknown as ValidAppComponent<
		PA_Component,
		PA_ComponentEvents
	>
}

/*******************************************************************************
 *
 * Typed wrapper for `document.documentElement`.
 *
 * NOTE: Must be passed a valid HAQ Generated Markup type argument from a <html> element.
 *
 * @returns The typed `HTMLHtmlElement`.
 *
 * @example
 * ```ts
 * type T = MU_MyRootDocument // imported from generated haq file - markup.ts
 *
 * const MyRootDoc = getRootDoc<T>()
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function getRootDoc<T extends MU_RootDocument>(): RenderedDOMElement<T> {
	return document.documentElement as unknown as RenderedDOMElement<T>
}

/*******************************************************************************
 *
 * Typed wrapper for the global `Event` interface.
 *
 * @param type The event type that will be dispatched.
 * @param init The event init options (optional).
 *
 * @returns The constructed Event object
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Event)
 *
 * @example
 * ```ts
 * MyElem.dispatchEvent(TypedEvent("change"))
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export const TypedEvent = <IA_Component extends I_ComponentShape, IA_EventType extends ValidNativeEvType<IA_Component>>(
	type: IA_EventType,
	init?: EventInit
): ConstructedEvent<IA_Component, IA_EventType> =>
	new Event(type, init) as unknown as ConstructedEvent<IA_Component, IA_EventType>

/*******************************************************************************
 *
 * # HAQ Astro App Router
 * Client side entry point function.
 *
 * @param {Object} config The client router config.
 * @param {Object} config.componentsRouter - The router object that satisfies the generated `HAQ_AppComponents_X` type.
 * @param {Object} config.eventsRouter - The events router object that satisfies the `HAQ_AppEventsRouter<HAQ_AppComponents_X>` (optional).
 * @param {Function} config.afterSwapHandler - The callback to be called after page transitions are complete, or after `DOMContentLoaded` if view transitions not supported or not used (optional).
 * @param {Function} config.resizeHandler - The callback to be called after the `resize` event on the `window` object (optional).
 *
 * @example
 * ```ts
 * export type Context = AppRouter<HAQ_AppComponents_X> // useful for separating your app events router and its handlers into separate files
 *
 * AppRouter({
 *   componentsRouter: {
 *     // your router object satisfying the generated `HAQ_AppComponents_X` type
 *   },
 *   eventsRouter: {
 *     // your events and their callbacks
 *   },
 *   afterSwapHandler: (route, components, isInitialLoad) => {
 *     // your logic here ...
 *   },
 *   resizeHandler: (route, components, isInitialLoad) => {
 *     // your logic here ...
 *   }
 * })
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function AppRouter<GIA_ComponentsRouter extends ComponentsRouterShape>(
	config: ARGS_AppRouterClass<GIA_ComponentsRouter>
): void {
	//@ts-expect-error can't instantiate the class without assignment, so we have a variable that is never used
	const _router = new AppRouterClass(config)
}
export type AppRouter<GIA_ComponentsRouter extends ComponentsRouterShape> = AppRouterClass<GIA_ComponentsRouter>

//#endregion ----------------------------------------------- Main API

//#region -------------------------------------------------- Useful API

/*******************************************************************************
 *
 * Helper to remove any query params or hash in the current url.
 *
 * @param {true} replaceState - Whether to replace the history state or not (optional).
 *
 ******************************************************************************/

export function removeQueryAndHash(replaceState?: true): void {
	const url = globalThis.location.origin + globalThis.location.pathname
	if (replaceState) {
		globalThis.history.replaceState({}, document.title, url)
	} else {
		globalThis.history.pushState({}, document.title, url)
	}
}

/*******************************************************************************
 *
 * Typed wrapper for the global `URLSearchParams` interface.
 *
 * @param options The options to initialize the instance with (optional).
 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams#options)
 *
 * @returns Typed instance of `URLSearchParams`.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams)
 *
 ******************************************************************************/

export function makeURLSearchParams<T extends Record<string, unknown>>(
	options?: string[][] | Record<string, string> | string | URLSearchParams
): I_URLSearchParams<T> {
	return new URLSearchParams(options) as unknown as I_URLSearchParams<T>
}

/*******************************************************************************
 *
 * Helper to validate and provide type safety and intellisense for your environment variables.
 *
 * @typeParam Env - The generated env types from `env-types.ts`.
 *
 * @param {unknown} env The env object from `process.env`.
 * @param {z.ZodType} zodSchema The generated zod schema from `env-schema.ts`.
 *
 * @returns {Readonly<Env>} The fully typed env.
 * @throws {Error} If the passed environment does not match the schema.
 *
 * @example
 * ```ts
 * import type { HAQ_ENV } from "./env-types.js"
 *
 * import { envSchema } from "./env-schema.js"
 * import { validateEnv } from "@haq/astro"
 *
 * export const ENV = validateEnv<HAQ_ENV>(process.env, envSchema)
 * // now you can use it safely anywhere in your project
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function validateEnv<Env extends Record<string, string>>(env: unknown, zodSchema: z.ZodType): Readonly<Env> {
	const ENV = zodSchema.safeParse(env)
	if (ENV.error) throw new Error(ENV.error.message)

	return Object.freeze(ENV.data) as Readonly<Env>
}

//#endregion ----------------------------------------------- Useful API

//#region -------------------------------------------------- Exposed Types

/*******************************************************************************
 *
 * Compile time prop types that can be passed to an aliasable Astro component.
 *
 ******************************************************************************/

export type HAQ_AliasableComponentProps = Pick<HTMLAttributes<"abbr">, "x_alias" | "x_appc" | "x_attr_values">

/*******************************************************************************
 *
 * Runtime global custom attributes types for Astro components props.
 *
 ******************************************************************************/

export type HAQ_GlobalCustomAttributes = astroHTML.JSX.HAQ_GlobalAttributes

/*******************************************************************************
 *
 * Runtime selector attributes types for Astro components props.
 *
 ******************************************************************************/

export type HAQ_SelectorProps = Pick<HTMLAttributes<"abbr">, "x_sel" | "id">

export type {
	AppEvents as HAQ_AppEvents,
	AppEventsRouter as HAQ_AppEventsRouter
} from "./app-router/types.js"

export type {
	AnyDOMElement as HAQ_AnyDOMElement,
	DOMElement as HAQ_DOMElement,
	FlattenChildren as HAQ_FlattenChildren,
	NativeDOMElement as HAQ_NativeDOMElement,
	NativeEvent as HAQ_Event,
	WebComponentEvent as HAQ_CustomEvent
} from "./types/dynamic.js"

export type { FileUploaderEvents as HAQ_FileUploaderEvents } from "./types/static.js"

//#endregion ----------------------------------------------- Exposed Types
