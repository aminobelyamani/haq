//#region -------------------------------------------------- Type Imports

import type { I_BaseComponent } from "../types/base-component.js"
import type { IsValidAppComponent, RenderedDOMElementOrWebComponent, ValidComponentSelector } from "../types/dynamic.js"
import type { ComponentEventsShape, I_ComponentShape } from "../types/static.js"

//#endregion ----------------------------------------------- Type Imports

export interface I_AppComponentBase<PA_Component extends I_ComponentShape> extends I_BaseComponent<PA_Component> {
	/*******************************************************************************
	 *
	 * Class destructor. Useful for clean up.
	 *
	 * This will be called on the `astro:before-swap` event from Astro's transition API.
	 *
	 ******************************************************************************/

	// biome-ignore lint/style/useConsistentMethodSignatures: To allow method overriding
	destructor(): void

	/*******************************************************************************
	 *
	 * Exposed element shadowing `this`. Useful in case you run into an edge case at runtime.
	 *
	 * @returns The typed DOM element.
	 *
	 ******************************************************************************/

	get element(): RenderedDOMElementOrWebComponent<PA_Component>
}

export interface I_AppComponent<PA_Component extends I_ComponentShape, PA_ComponentEvents extends ComponentEventsShape>
	extends I_AppComponentBase<PA_Component> {
	/*******************************************************************************
	 *
	 * Typed helper for `globalThis.dispatchEvent()`.
	 *
	 * NOTE: Must be passed a second type argument to `AppComponent<T, E>()`that satisifes the shape `Record<string, unknown>` when extending this class.
	 *
	 * @param eventName The event name.
	 * @param data The data associated with the event. Only if defined.
	 *
	 * @example
	 * ```ts
	 * type E = {
	 *  "some-event": {
	 *      someProp:string
	 *   }
	 *   "some-other-event": undefined
	 * }
	 *
	 * export class MyAppComponent extends AppComponent<T, E>(){
	 *
	 *     constructor(){
	 *         super("myAppComponent")
	 *         // do stuff
	 *         this.emitAppEvent("some-other-event")
	 *     }
	 *
	 *   someMethod(){
	 *     this.emitAppEvent("some-event", {someProp: "some string"})
	 *   }
	 * }
	 * ```
	 *
	 * @author Amino Belyamani
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent)
	 ******************************************************************************/

	emitAppEvent: <IA_EventName extends keyof PA_ComponentEvents>(
		...args: ARGS_emitAppEvent<PA_ComponentEvents, IA_EventName>
	) => void
}

export type ARGS_emitAppEvent<
	PA_ComponentEvents extends ComponentEventsShape,
	IA_EventName extends keyof PA_ComponentEvents
> = PA_ComponentEvents[IA_EventName] extends undefined
	? [eventName: IA_EventName]
	: [eventName: IA_EventName, data: NoInfer<PA_ComponentEvents[IA_EventName]>]

export type InternalGlobalCustomEvent = CustomEvent<InternalGlobalCustomEventDetail>

type InternalGlobalCustomEventDetail = {
	eventName: string
	data: unknown | undefined
}

export type ValidAppComponent<
	PA_Component extends I_ComponentShape,
	PA_ComponentEvents extends ComponentEventsShape | false
> = IsValidAppComponent<PA_Component> extends true ? AppComponentClassDef<PA_Component, PA_ComponentEvents> : never

export type AppComponentClassDef<
	PA_Component extends I_ComponentShape = I_ComponentShape,
	PA_AppEvents extends ComponentEventsShape | false = false
> = {
	new (
		id: ValidComponentSelector<PA_Component, "HAQ_id">
	): RenderedDOMElementOrWebComponent<PA_Component, true> &
		(PA_AppEvents extends ComponentEventsShape
			? I_AppComponent<PA_Component, PA_AppEvents>
			: I_AppComponentBase<PA_Component>)
	prototype: RenderedDOMElementOrWebComponent<PA_Component, true> &
		(PA_AppEvents extends ComponentEventsShape
			? I_AppComponent<PA_Component, PA_AppEvents>
			: I_AppComponentBase<PA_Component>)
	__T_appEvents: PA_AppEvents
}
