//#region -------------------------------------------------- Type Imports

import type {
	ExtractAllCustomEvents,
	ExtractNativeEventTypesByKind,
	NativeEventListenerObject,
	RenderedDOMElementOrWebComponent,
	TypedCustomEvent,
	ValidComponentSelector
} from "../types/dynamic.js"
import type { ComponentEventsShape, I_ComponentShape, NativeEventType } from "../types/static.js"
import type { ARGS_emitAppEvent, I_AppComponent, InternalGlobalCustomEvent } from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { makeDOMManipulation } from "../dom-manip/index.js"
import { makeFormManipulation } from "../form-manip/index.js"
import { HAQ_APP_EVENT_NAME } from "../globals.js"

//#endregion ----------------------------------------------- Module Imports

export class AppComponentClass<PA_Component extends I_ComponentShape, PA_ComponentEvents extends ComponentEventsShape>
	implements I_AppComponent<PA_Component, PA_ComponentEvents>
{
	private readonly _el

	//------------------------------------------------------------------------------
	//
	// Constructor
	//
	//------------------------------------------------------------------------------

	constructor(id: ValidComponentSelector<PA_Component, "HAQ_id">) {
		const el = getElementById<PA_Component>(id)
		this._el = el

		// biome-ignore lint/correctness/noConstructorReturn: We have to return a proxy to correctly bind `this` to the element returned from getElementById()
		return new Proxy(this, {
			get(target, prop, receiver) {
				// Prefer class members
				if (Reflect.has(target, prop)) {
					return Reflect.get(target, prop, receiver)
				}

				const value = Reflect.get(el, prop)

				// Bind native methods to the element
				if (typeof value === "function") {
					return value.bind(el)
				}

				return value
			},

			set(target, prop, value, receiver) {
				if (Reflect.has(target, prop)) {
					return Reflect.set(target, prop, value, receiver)
				}

				return Reflect.set(el, prop, value)
			},

			has(target, prop) {
				return prop in target || prop in el
			}
		})
	}

	//------------------------------------------------------------------------------
	//
	// Destructor
	//
	//------------------------------------------------------------------------------

	// biome-ignore lint/suspicious/noEmptyBlockStatements: Will be implemented by user as callback
	destructor(): void {}

	//------------------------------------------------------------------------------
	//
	// Alternative runtime for element, in case proxy doesn't work in a given situation
	//
	//------------------------------------------------------------------------------

	get element(): RenderedDOMElementOrWebComponent<PA_Component> {
		return this._el
	}

	//------------------------------------------------------------------------------
	//
	// App Event emitter
	//
	//------------------------------------------------------------------------------

	// Changes to emitAppEvent should be reflected here
	// LINK packages/astro-ssr/src/client/index.ts:230

	emitAppEvent<IA_EventName extends keyof PA_ComponentEvents>(
		...args: ARGS_emitAppEvent<PA_ComponentEvents, IA_EventName>
	): void {
		const [eventName, data] = args
		const ev = new CustomEvent(HAQ_APP_EVENT_NAME, {
			detail: {
				eventName,
				data
			}
		}) as InternalGlobalCustomEvent
		globalThis.dispatchEvent(ev)
	}

	//* ---------- BaseComponent -----------------------------------------------

	//------------------------------------------------------------------------------
	//
	// DOM Manipulation
	//
	//------------------------------------------------------------------------------

	readonly DOMManipulation = makeDOMManipulation<PA_Component>()

	//------------------------------------------------------------------------------
	//
	// Form Manipulation
	//
	//------------------------------------------------------------------------------

	readonly FormManipulation = makeFormManipulation()

	//------------------------------------------------------------------------------
	//
	// Event listener from child WebComponents
	//
	//------------------------------------------------------------------------------

	readonly addWebComponentEventListener = <IA_EventType extends keyof ExtractAllCustomEvents<PA_Component> & string>(
		type: IA_EventType,
		listener: (event: NoInfer<TypedCustomEvent<ExtractAllCustomEvents<PA_Component>, IA_EventType>>) => void,
		options?: boolean | AddEventListenerOptions
	): void => {
		const obj = {
			handleEvent: (event: Event): void => {
				listener(event as unknown as TypedCustomEvent<ExtractAllCustomEvents<PA_Component>, IA_EventType>)
			}
		}

		if (!(this.element instanceof HTMLElement)) {
			console.warn(`Unable to add an event listener to element for type: "${type}". Expected an HTMLElement.`)
			return
		}
		this.element.addEventListener(type as keyof HTMLElementEventMap, obj, options)
	}

	//------------------------------------------------------------------------------
	//
	// document.addEventListener
	//
	//------------------------------------------------------------------------------

	readonly addDocumentEventListener = (
		type: PA_Component extends { HAQ_eventListenerType: NativeEventType }
			? ExtractNativeEventTypesByKind<PA_Component["HAQ_eventListenerType"], "doc">
			: never,
		listener: NativeEventListenerObject<PA_Component>,
		options?: boolean | AddEventListenerOptions
	): void => {
		document.addEventListener(type, listener as unknown as EventListenerObject, options)
	}

	//------------------------------------------------------------------------------
	//
	// document.removeEventListener
	//
	//------------------------------------------------------------------------------

	readonly removeDocumentEventListener = (
		type: PA_Component extends { HAQ_eventListenerType: NativeEventType }
			? ExtractNativeEventTypesByKind<PA_Component["HAQ_eventListenerType"], "doc">
			: never,
		listener: NativeEventListenerObject<PA_Component>,
		options?: boolean | AddEventListenerOptions
	): void => {
		document.removeEventListener(type, listener as unknown as EventListenerObject, options)
	}

	//------------------------------------------------------------------------------
	//
	// window.addEventListener
	//
	//------------------------------------------------------------------------------

	readonly addWindowEventListener = (
		type: PA_Component extends { HAQ_eventListenerType: NativeEventType }
			? ExtractNativeEventTypesByKind<PA_Component["HAQ_eventListenerType"], "win">
			: never,
		listener: NativeEventListenerObject<PA_Component>,
		options?: boolean | AddEventListenerOptions
	): void => {
		// biome-ignore lint/style/useGlobalThis: We need to use window
		window.addEventListener(type, listener as unknown as EventListenerObject, options)
	}

	//------------------------------------------------------------------------------
	//
	// window.removeEventListener
	//
	//------------------------------------------------------------------------------

	readonly removeWindowEventListener = (
		type: PA_Component extends { HAQ_eventListenerType: NativeEventType }
			? ExtractNativeEventTypesByKind<PA_Component["HAQ_eventListenerType"], "win">
			: never,
		listener: NativeEventListenerObject<PA_Component>,
		options?: boolean | AddEventListenerOptions
	): void => {
		// biome-ignore lint/style/useGlobalThis: We need to use window
		window.removeEventListener(type, listener as unknown as EventListenerObject, options)
	}
}

/*******************************************************************************
 *
 * Typed wrapper for `document.getElementById()`
 *
 * NOTE: Must be passed a valid HAQ Generated Markup type argument from a component. The original markup must have an `id` attribute.
 *
 * @param id The id selector to query the document with.
 * @returns The Typed DOM element.
 * @throws {Error} Throws an Error if the queried element is not found in the DOM.
 *
 ******************************************************************************/

function getElementById<Component extends I_ComponentShape>(
	id: ValidComponentSelector<Component, "HAQ_id">
): RenderedDOMElementOrWebComponent<Component> {
	// biome-ignore lint/nursery/useDomQuerySelector: This is used in the HAQ context, which is totally safe.
	const el = document.getElementById(id)
	if (!el)
		throw new Error(
			`Element with id "${id}" is not present in the current markup.\nMake sure to use this component in this rendered page.\n`
		)
	return el as unknown as RenderedDOMElementOrWebComponent<Component>
}
