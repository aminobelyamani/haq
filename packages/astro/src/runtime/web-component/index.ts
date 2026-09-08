//#region -------------------------------------------------- Type Imports

import type {
	ExtractAllCustomEvents,
	ExtractNativeEventTypesByKind,
	NativeEventListenerObject,
	TypedCustomEvent
} from "../types/dynamic.js"
import type { ComponentEventsShape, I_ComponentShape, NativeEventType } from "../types/static.js"
import type { ARGS_emitCustomEvent, I_WebComponent, ValidCustomEvents } from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { makeDOMManipulation } from "../dom-manip/index.js"
import { makeFormManipulation } from "../form-manip/index.js"

//#endregion ----------------------------------------------- Module Imports

export class WebComponentClass<PA_Component extends I_ComponentShape, PA_ComponentEvents extends ComponentEventsShape>
	extends HTMLElement
	implements I_WebComponent<PA_Component, PA_ComponentEvents>
{
	//------------------------------------------------------------------------------
	//
	// Event emitter
	//
	//------------------------------------------------------------------------------

	emitCustomEvent<IA_EventName extends keyof ValidCustomEvents<PA_Component, PA_ComponentEvents>>(
		...args: ARGS_emitCustomEvent<PA_Component, PA_ComponentEvents, IA_EventName>
	): void {
		const [eventName, detail, options] = args
		const ev = new CustomEvent(eventName as string, {
			bubbles: true,
			...(options?.cancelable ? { cancelable: options.cancelable } : {}),
			...(detail ? { detail } : {})
		})
		this.dispatchEvent(ev)
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

		this.addEventListener(type as keyof HTMLElementEventMap, obj, options)
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
