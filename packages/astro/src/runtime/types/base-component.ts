//#region -------------------------------------------------- Type Imports

import type { I_DOMManipulation } from "../dom-manip/types.js"
import type { I_FormManipulation } from "../form-manip/types.js"
import type {
	ExtractAllCustomEvents,
	ExtractNativeEventTypesByKind,
	NativeEventListenerObject,
	TypedCustomEvent
} from "./dynamic.js"
import type { I_ComponentShape, NativeEventType } from "./static.js"

//#endregion ----------------------------------------------- Type Imports

/*******************************************************************************
 *
 * Base Interface that both AppComponent and WebComponent share.
 *
 ******************************************************************************/

export type I_BaseComponent<PA_Component extends I_ComponentShape> = {
	/*******************************************************************************
	 *
	 * Object that provides typed methods for common DOM manipulation.
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	readonly DOMManipulation: I_DOMManipulation<PA_Component>

	/*******************************************************************************
	 *
	 * Object that provides methods for common Form manipulation.
	 *
	 * @example
	 * ```ts
	 *
	 * const FormData = this.FormManipulation.makeFormData(Form)
	 * const emailValue = FormData.get("email")
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	readonly FormManipulation: I_FormManipulation

	/*******************************************************************************
	 *
	 * Typed wrapper for `addEventListener()`.
	 * It exposes all custom events emitted by all child Web Components.
	 *
	 * @param type The event type to listen for.
	 * @param listener The callback function.
	 * @param options The listener options (optional).
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
	 *
	 * @example
	 * ```ts
	 * // anonumous callback
	 * this.addWebComponentEventListener("my-elem:some-event", (e) => {
	 *   // your logic here ....
	 * }
	 *
	 * // named function callback
	 * this.addWebComponentEventListener("my-elem:some-event", this.#myElemListener)
	 *
	 * // we need to make the callback into an arrow function to preserve the `this` context
	 * readonly #myElemListener = (e: WebComponentEvent<T>["my-elem:some-event"]) => {
	 *   // your logic here ...
	 * }
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	addWebComponentEventListener: <IA_EventType extends keyof ExtractAllCustomEvents<PA_Component> & string>(
		type: IA_EventType,
		listener: (event: NoInfer<TypedCustomEvent<ExtractAllCustomEvents<PA_Component>, IA_EventType>>) => void,
		options?: boolean | AddEventListenerOptions
	) => void

	/*******************************************************************************
	 *
	 * Typed wrapper for `document.addEventListener()`.
	 *
	 * @param type The event type to listen for.
	 * @param listener The listener object that provides a `handleEvent` method.
	 * @param options The listener options (optional).
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
	 *
	 * @example
	 * ```ts
	 * this.addDocumentEventListener("keyup", this)
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	addDocumentEventListener: (
		type: PA_Component extends { HAQ_eventListenerType: NativeEventType }
			? ExtractNativeEventTypesByKind<PA_Component["HAQ_eventListenerType"], "doc">
			: never,
		listener: NativeEventListenerObject<PA_Component>,
		options?: boolean | AddEventListenerOptions
	) => void

	/*******************************************************************************
	 *
	 * Typed wrapper for `document.removeEventListener()`.
	 *
	 * @param type The event type to listen for.
	 * @param listener The listener object that provides a `handleEvent` method.
	 * @param options The listener options (optional).
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener)
	 *
	 * @example
	 * ```ts
	 * this.removeDocumentEventListener("keyup", this)
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	removeDocumentEventListener: (
		type: PA_Component extends { HAQ_eventListenerType: NativeEventType }
			? ExtractNativeEventTypesByKind<PA_Component["HAQ_eventListenerType"], "doc">
			: never,
		listener: NativeEventListenerObject<PA_Component>,
		options?: boolean | AddEventListenerOptions
	) => void

	/*******************************************************************************
	 *
	 * Typed wrapper for `window.addEventListener()`.
	 *
	 * @param type The event type to listen for.
	 * @param listener The listener object that provides a `handleEvent` method.
	 * @param options The listener options (optional).
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
	 *
	 * @example
	 * ```ts
	 * this.addWindowEventListener("resize", this)
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	addWindowEventListener: (
		type: PA_Component extends { HAQ_eventListenerType: NativeEventType }
			? ExtractNativeEventTypesByKind<PA_Component["HAQ_eventListenerType"], "win">
			: never,
		listener: NativeEventListenerObject<PA_Component>,
		options?: boolean | AddEventListenerOptions
	) => void

	/*******************************************************************************
	 *
	 * Typed wrapper for `window.removeEventListener()`.
	 *
	 * @param type The event type to listen for.
	 * @param listener The listener object that provides a `handleEvent` method.
	 * @param options The listener options (optional).
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener)
	 *
	 * @example
	 * ```ts
	 * this.removeWindowEventListener("resize", this)
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	removeWindowEventListener: (
		type: PA_Component extends { HAQ_eventListenerType: NativeEventType }
			? ExtractNativeEventTypesByKind<PA_Component["HAQ_eventListenerType"], "win">
			: never,
		listener: NativeEventListenerObject<PA_Component>,
		options?: boolean | AddEventListenerOptions
	) => void
}
