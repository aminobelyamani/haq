//#region -------------------------------------------------- Type Imports

import type { I_BaseComponent } from "../types/base-component.js"
import type { ComponentEventsShape, I_ComponentShape } from "../types/static.js"

//#endregion ----------------------------------------------- Type Imports

export interface I_WebComponent<PA_Component extends I_ComponentShape, PA_ComponentEvents extends ComponentEventsShape>
	extends I_BaseComponent<PA_Component> {
	/*******************************************************************************
	 *
	 * Typed helper for the `dispatchEvent()` method of the EventTarget interface.
	 *
	 * @param eventName The event name.
	 * @param detail The event data associated with that event. Only if defined.
	 * @param options The event options (optional).
	 *
	 * NOTE: Must be passed a second type argument to `WebComponent<T, E>()`that satisifes the shape `Record<string, unknown>` when extending this class.
	 *
	 * NOTE: Must be prefixed by the tag name followed by a colon. `my-elem:some-event`
	 *
	 * NOTE: Event always bubbles.
	 *
	 * @example
	 * ```ts
	 * type E = {
	 *     "my-elem:some-event": {
	 *          someProp:string
	 *     }
	 *     "my-elem:some-other-event": undefined
	 * }
	 *
	 * export class MyElem extends WebComponent<T, E>(){
	 *
	 *     constructor(){
	 *         super()
	 *         // do stuff
	 *     }
	 *
	 *     someMethod(){
	 *         this.emitCustomEvent("my-elem:some-event", {someProp: "some string"})
	 *     }
	 *
	 *     someOtherMethod(){
	 *         this.emitCustomEvent("my-elem:some-other-event")
	 *     }
	 * }
	 * ```
	 *
	 * @author Amino Belyamani
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent)
	 ******************************************************************************/

	emitCustomEvent: <IA_EventName extends keyof ValidCustomEvents<PA_Component, PA_ComponentEvents>>(
		...args: ARGS_emitCustomEvent<PA_Component, PA_ComponentEvents, IA_EventName>
	) => void
}

export type ARGS_emitCustomEvent<
	PA_Component extends I_ComponentShape,
	PA_ComponentEvents extends ComponentEventsShape,
	IA_EventName extends keyof ValidCustomEvents<PA_Component, PA_ComponentEvents>
> = PA_ComponentEvents extends ComponentEventsShape
	? IA_EventName extends `${ValidTag<PA_Component>}:${string}`
		? ValidCustomEvents<PA_Component, PA_ComponentEvents>[IA_EventName] extends undefined
			? [eventName: IA_EventName, detail?: never, options?: BaseOptions]
			: [
					eventName: IA_EventName,
					detail: NoInfer<ValidCustomEvents<PA_Component, PA_ComponentEvents>[IA_EventName]>,
					options?: BaseOptions
				]
		: never[]
	: never[]

export type ValidCustomEvents<
	Component extends I_ComponentShape,
	ComponentEvents extends ComponentEventsShape | false
> = {
	[K in keyof ComponentEvents]: K extends string
		? K extends ValidEventName<ValidTag<Component>, K>
			? ComponentEvents[K]
			: never
		: never
}

type BaseOptions = { cancelable?: true }

type ValidTag<Component extends I_ComponentShape> = Component extends { HAQ_isWebComponent: true }
	? Component["HAQ_tag"]
	: never

type ValidEventName<Tag, EventName extends string> = Tag extends string
	? EventName extends `${Tag}:${string}`
		? EventName
		: never
	: never
