//#region -------------------------------------------------- Type Imports

import type { EmptyObject, NotAny, TypedExtract, TypedOmit, UnionToIntersection } from "@haq/utils/types"
import type { HTMLTag } from "astro/types"
import type { I_WebComponent } from "../web-component/types.js"
import type { AttributesByTag, MarkupAlias } from "./gen.js"
import type { I_HTMLFormElement } from "./html-form-element.js"
import type {
	ComponentChildrenShape,
	ComponentEventsShape,
	I_ComponentShape,
	NativeEventType,
	NativeEventTypeKind
} from "./static.js"
import type { I_DOMElement } from "./typed-dom-element.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// General `I_ComponentShape` validation
//
//------------------------------------------------------------------------------

export type IsValidComponent<Component extends I_ComponentShape, K extends keyof I_ComponentShape> =
	NotAny<Component[K]> extends never ? false : true

export type ValidComponentProp<Component extends I_ComponentShape, K extends keyof I_ComponentShape> =
	NotAny<Component[K]> extends never ? never : Component[K]

export type ValidComponentSelector<
	Component extends I_ComponentShape,
	K extends "HAQ_selector" | "HAQ_id"
> = Component[K] extends string ? Component[K] : never

export type ValidNativeEvType<Component extends I_ComponentShape> = Component extends {
	HAQ_eventListenerType: NativeEventType
}
	? Extract<Component["HAQ_eventListenerType"], keyof HTMLElementEventMap>
	: never

export type IsValidWebComponent<Component extends I_ComponentShape> = Component extends {
	HAQ_isWebComponent: true
}
	? true
	: false
export type IsValidAppComponent<Component extends I_ComponentShape> = Component extends { HAQ_id: string }
	? true
	: false

//------------------------------------------------------------------------------
//
// Base DOM Element types of `HAQ_elType`
//
//------------------------------------------------------------------------------

export type RenderedOrNotHelper<
	Component extends I_ComponentShape,
	WithoutRemove extends boolean = false
> = Component extends {
	HAQ_isMaybeRendered: true
}
	? RenderedDOMElementOrWebComponent<Component, WithoutRemove> | null
	: RenderedDOMElementOrWebComponent<Component, WithoutRemove>

export type RenderedDOMElementOrWebComponent<
	Component extends I_ComponentShape,
	WithoutRemove extends boolean = false
> = Component extends {
	HAQ_isWebComponent: true
}
	? WithoutRemove extends true
		? Omit<ExposedWebComponent<Component>, "remove">
		: ExposedWebComponent<Component>
	: Component extends {
				HAQ_isMaybeRendered: true
			}
		? WithoutRemove extends true
			? Omit<RenderedDOMElement<Component, true>, "remove">
			: RenderedDOMElement<Component, true>
		: RenderedDOMElement<Component>

export type RenderedDOMElement<
	Component extends I_ComponentShape,
	IsRemovable extends boolean = false
> = IsRemovable extends true
	? RemovableDOMElement<Component>
	: TypedOmit<ValidDOMElement<Component>, "remove" | ForbiddenDOMElementProps>

export type RemovableDOMElement<Component extends I_ComponentShape> = TypedOmit<
	ValidDOMElement<Component>,
	ForbiddenDOMElementProps
>

export type ValidDOMElement<Component extends I_ComponentShape> =
	IsValidComponent<Component, "HAQ_tag"> extends true
		? I_DOMElement<Component, ValidComponentProp<Component, "HAQ_elType">>
		: never

export type DOMElementPropsWithOnPrefix = NonNullable<
	{
		[K in keyof HTMLElement]: K extends `on${string}` ? K : never
	}[keyof HTMLElement]
>

type ForbiddenDOMElementProps = TypedExtract<keyof HTMLElement, "replaceChildren" | DOMElementPropsWithOnPrefix>
//------------------------------------------------------------------------------
//
// Web Component DOM Element types of `HAQ_elType`
//
//------------------------------------------------------------------------------

type ExposedWebComponentProps = TypedExtract<
	keyof HTMLElement,
	| "append"
	| "appendChild"
	| "cloneNode"
	| "contains"
	| "insertBefore"
	| "isEqualNode"
	| "matches"
	| "moveBefore"
	| "prepend"
	| "querySelector"
	| "querySelectorAll"
	| "replaceChild"
	| "removeChild"
	| "replaceWith"
>

type PrivateWebComponentProps =
	| keyof I_WebComponent<I_ComponentShape, ComponentEventsShape>
	| "handleEvent"
	| "connectedCallback"
	| "disconnectedCallback"

export type ExposedWebComponent<Component extends I_ComponentShape> = {
	[P in keyof ValidDOMElement<Component> as P extends PrivateWebComponentProps
		? never
		: P extends keyof HTMLElement
			? P extends ExposedWebComponentProps | GenericElementProps
				? P
				: Component extends {
							HAQ_isMaybeRendered: true
						}
					? P extends "remove"
						? P
						: never
					: never
			: P]: ValidDOMElement<Component>[P]
}

/*******************************************************************************
 *
 * Type helper to get the typed DOM element given a generated HAQ markup type.
 *
 * @typeParam Component - the generated markup type.
 *
 ******************************************************************************/

export type DOMElement<Component extends I_ComponentShape> = RenderedDOMElementOrWebComponent<MarkupAlias<Component>>

/*******************************************************************************
 *
 * Type for any typed DOM element.
 *
 ******************************************************************************/

export type AnyDOMElement = Pick<ValidDOMElement<I_ComponentShape>, GenericElementProps>

type GenericElementProps = TypedExtract<
	keyof HTMLElement,
	| "getBoundingClientRect"
	| "animate"
	| "checkVisibility"
	| "clientHeight"
	| "clientLeft"
	| "clientTop"
	| "clientWidth"
	| "compareDocumentPosition"
	| "getAnimations"
	| "getClientRects"
	| "getHTML"
	| "hasChildNodes"
	| "offsetHeight"
	| "offsetLeft"
	| "offsetTop"
	| "offsetWidth"
	| "requestFullscreen"
	| "scroll"
	| "scrollBy"
	| "scrollHeight"
	| "scrollIntoView"
	| "scrollLeft"
	| "scrollTo"
	| "scrollTop"
	| "scrollWidth"
>
/*******************************************************************************
 *
 * Type helper for native DOM elements.
 *
 * @typeParam Tag - the HTML tag name of the native element
 *
 * @example
 * ```ts
 * // A function that expects a typed element whose tag is "form"
 * function myFunc(Form:HAQ_NativeDOMElement<"form">){ ... }
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export type NativeDOMElement<Tag extends keyof HTMLElementTagNameMap> = TypedOmit<
	ValidDOMElement<NativeDOMElementComponent<Tag>>,
	| "addEventListener"
	| "cloneNode"
	| "contains"
	| "dispatchEvent"
	| "id"
	| "innerHTML"
	| "insertAdjacentHTML"
	| "isEqualNode"
	| "remove"
	| "removeEventListener"
	| "textContent"
	| ForbiddenDOMElementProps
>

type NativeDOMElementComponent<Tag extends keyof HTMLElementTagNameMap> = {
	HAQ_tag: Tag
	HAQ_elType: Tag extends "form" ? I_HTMLFormElement : HTMLElementTagNameMap[Tag]
	HAQ_attributes: Tag extends HTMLTag ? AttributesByTag<Tag> : never
	HAQ_styleProperties: never
	HAQ_matchingSelectors: never
}

/*******************************************************************************
 *
 * Type helper to flatten all `HAQ_children` & `HAQ_slotChildren` recursively.
 *
 * Exposes the raw HAQ markup type and the typed DOM element type for each child.
 *
 * @typeParam Component - the generated markup type.
 *
 * @example
 * ```ts
 * type X = HAQ_FlattenChildren<MU_MyElem>
 *
 * type T_Child = X["Child"]["_T"] // the raw generated markup type
 *
 * type Child = X["Child"]["_EL"] // the typed DOM element
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export type FlattenChildren<Component extends I_ComponentShape> = AddExposedHAQTypeProperties<Component> &
	(Component extends { HAQ_children?: infer C extends ComponentChildrenShape }
		? FlattenChildrenFromRecord<C>
		: EmptyObject) &
	(Component extends { HAQ_slotChildren?: infer S extends ComponentChildrenShape }
		? FlattenChildrenFromRecord<S>
		: EmptyObject)

type FlattenChildrenFromRecord<ComponentChildren extends ComponentChildrenShape> = {
	[K in keyof ComponentChildren]: ComponentChildren[K] extends { HAQ_children: never } // last (deepest) child
		? AddExposedHAQTypeProperties<ComponentChildren[K]>
		: ComponentChildren[K] extends { HAQ_slotChildren: never } // last (deepest) slot child
			? AddExposedHAQTypeProperties<ComponentChildren[K]>
			: AddExposedHAQTypeProperties<ComponentChildren[K]> & FlattenChildren<ComponentChildren[K]>
}

type AddExposedHAQTypeProperties<Component extends I_ComponentShape> = {
	_T: Component
	_EL: RenderedOrNotHelper<Component>
}

/*******************************************************************************
 *
 * Recursively map all `HAQ_tag` values that satisfy a custom element -> union of `HAQ_tag`
 *
 ******************************************************************************/

export type ExtractAllCustomTags<Component extends I_ComponentShape> = Component extends {
	HAQ_tag: infer INF_Tag extends CustomElementTag
}
	? INF_Tag | ExtractCustomTagsFromChildren<Component> | ExtractCustomTagsFromSlotChildren<Component>
	: ExtractCustomTagsFromChildren<Component> | ExtractCustomTagsFromSlotChildren<Component>

type ExtractCustomTagsFromChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_children?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractCustomTagsRecursively<INF_ComponentChildren>
	: never

type ExtractCustomTagsFromSlotChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_slotChildren?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractCustomTagsRecursively<INF_ComponentChildren>
	: never

type ExtractCustomTagsRecursively<ComponentChildren extends ComponentChildrenShape> = {
	[K in keyof ComponentChildren]: ExtractAllCustomTags<ComponentChildren[K]>
}[keyof ComponentChildren]

type CustomElementTag = `${string}-${string}`

/*******************************************************************************
 *
 * Recursively map all `HAQ_selector` values -> union of `HAQ_selector`
 *
 ******************************************************************************/

export type ExtractAllSelectors<Component extends I_ComponentShape> = Component extends {
	HAQ_selector: infer INF_Sel extends string
}
	? INF_Sel | ExtractSelectorsFromChildren<Component> | ExtractSelectorsFromSlotChildren<Component>
	: ExtractSelectorsFromChildren<Component> | ExtractSelectorsFromSlotChildren<Component>

type ExtractSelectorsFromChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_children?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractSelectorsRecursively<INF_ComponentChildren>
	: never

type ExtractSelectorsFromSlotChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_slotChildren?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractSelectorsRecursively<INF_ComponentChildren>
	: never

type ExtractSelectorsRecursively<ComponentChildren extends ComponentChildrenShape> = {
	[K in keyof ComponentChildren]: ExtractAllSelectors<ComponentChildren[K]>
}[keyof ComponentChildren]

/*******************************************************************************
 *
 * Recursively find typed DOM element by selector -> `HAQ_elType`
 *
 ******************************************************************************/

export type FindNestedChildElBySelector<
	Component extends I_ComponentShape,
	Sel extends string,
	Nullable extends boolean
> = Component extends { HAQ_selector: Sel }
	? Nullable extends true
		? RenderedOrNotHelper<Component>
		: RenderedDOMElementOrWebComponent<Component>
	:
			| FindNestedChildElFromChildrenBySelector<Component, Sel, Nullable>
			| FindNestedChildElFromSlotChildrenBySelector<Component, Sel, Nullable>

type FindNestedChildElFromChildrenBySelector<
	Component extends I_ComponentShape,
	Sel extends string,
	Nullable extends boolean
> = Component extends {
	HAQ_children?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? FindNestedChildElBySelectorRecursively<INF_ComponentChildren, Sel, Nullable>
	: never

type FindNestedChildElFromSlotChildrenBySelector<
	Component extends I_ComponentShape,
	Sel extends string,
	Nullable extends boolean
> = Component extends {
	HAQ_slotChildren?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? FindNestedChildElBySelectorRecursively<INF_ComponentChildren, Sel, Nullable>
	: never

type FindNestedChildElBySelectorRecursively<
	ComponentChildren extends ComponentChildrenShape,
	Sel extends string,
	Nullable extends boolean
> = {
	[K in keyof ComponentChildren]: FindNestedChildElBySelector<ComponentChildren[K], Sel, Nullable>
}[keyof ComponentChildren]

/*******************************************************************************
 *
 * Recursively find typed DOM Element by tag -> `HAQ_elType`
 *
 ******************************************************************************/

export type FindNestedChildElByTag<
	Component extends I_ComponentShape,
	Tag extends CustomElementTag
> = Component extends {
	HAQ_tag: Tag
}
	? RenderedDOMElementOrWebComponent<Component>
	: FindNestedChildElFromChildrenByTag<Component, Tag> | FindNestedChildElFromSlotChildrenByTag<Component, Tag>

type FindNestedChildElFromChildrenByTag<
	Component extends I_ComponentShape,
	Tag extends CustomElementTag
> = Component extends {
	HAQ_children?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? FindNestedChildElByTagRecursively<INF_ComponentChildren, Tag>
	: never

type FindNestedChildElFromSlotChildrenByTag<
	Component extends I_ComponentShape,
	Tag extends CustomElementTag
> = Component extends {
	HAQ_slotChildren?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? FindNestedChildElByTagRecursively<INF_ComponentChildren, Tag>
	: never

type FindNestedChildElByTagRecursively<
	ComponentChildren extends ComponentChildrenShape,
	Tag extends CustomElementTag
> = {
	[K in keyof ComponentChildren]: FindNestedChildElByTag<ComponentChildren[K], Tag>
}[keyof ComponentChildren]

/*******************************************************************************
 *
 * Recursively extract all `I_ComponentShape` -> union of `I_ComponentShape`
 *
 ******************************************************************************/

export type ExtractAllComponentShapes<Component extends I_ComponentShape> =
	| Component
	| ExtractComponentShapesFromChildren<Component>
	| ExtractComponentShapesFromSlotChildren<Component>

type ExtractComponentShapesFromChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_children?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractComponentShapesRecursively<INF_ComponentChildren>
	: never

type ExtractComponentShapesFromSlotChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_slotChildren?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractComponentShapesRecursively<INF_ComponentChildren>
	: never

type ExtractComponentShapesRecursively<Component extends ComponentChildrenShape> = {
	[K in keyof Component]: ExtractAllComponentShapes<Component[K]>
}[keyof Component]

/*******************************************************************************
 *
 * Recursively find `I_ComponentShape` that matches parent of given child shape -> `I_ComponentShape` of parent
 *
 ******************************************************************************/

export type FindNestedParentShapeByShape<
	Component extends I_ComponentShape,
	TargetComponent extends I_ComponentShape,
	ParentComponent extends I_ComponentShape = Component
> = Component extends TargetComponent
	? ParentComponent
	:
			| FindNestedParentShapeFromChildrenByShape<Component, TargetComponent>
			| FindNestedParentShapeFromSlotChildrenByShape<Component, TargetComponent>

type FindNestedParentShapeFromChildrenByShape<
	Component extends I_ComponentShape,
	TargetComponent extends I_ComponentShape
> = Component extends {
	HAQ_children?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? FindNestedParentShapeByShapeRecursively<INF_ComponentChildren, TargetComponent, Component>
	: never

type FindNestedParentShapeFromSlotChildrenByShape<
	Component extends I_ComponentShape,
	TargetComponent extends I_ComponentShape
> = Component extends {
	HAQ_slotChildren?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? FindNestedParentShapeByShapeRecursively<INF_ComponentChildren, TargetComponent, Component>
	: never

type FindNestedParentShapeByShapeRecursively<
	ComponentChildren extends ComponentChildrenShape,
	TargetComponent extends I_ComponentShape,
	ParentComponent extends I_ComponentShape
> = {
	[K in keyof ComponentChildren]: FindNestedParentShapeByShape<ComponentChildren[K], TargetComponent, ParentComponent>
}[keyof ComponentChildren]

/*******************************************************************************
 *
 * Map all `HAQ_selector` values from direct children only -> union of `HAQ_selector`
 *
 ******************************************************************************/

export type ExtractChildSelectors<Component extends I_ComponentShape> =
	| ExtractChildSelectorsFromChildren<Component>
	| ExtractChildSelectorsFromSlotChildren<Component>

type ExtractChildSelectorsFromChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_children?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractChildSelectorsRecursively<INF_ComponentChildren>
	: never

type ExtractChildSelectorsFromSlotChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_slotChildren?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractChildSelectorsRecursively<INF_ComponentChildren>
	: never

type ExtractChildSelectorsRecursively<ComponentChildren extends ComponentChildrenShape> =
	ComponentChildren extends Record<string, infer INF_ChildShape extends I_ComponentShape>
		? INF_ChildShape extends { HAQ_selector: infer INF_Sel extends string }
			? INF_Sel
			: never
		: never

/*******************************************************************************
 *
 * Find typed DOM element that is a direct child by selector -> `HAQ_elType`
 *
 ******************************************************************************/

export type FindChildElBySelector<Component extends I_ComponentShape, Sel extends string, Nullable extends boolean> =
	| FindChildElFromChildrenBySelector<Component, Sel, Nullable>
	| FindChildElFromSlotChildrenBySelector<Component, Sel, Nullable>

type FindChildElFromChildrenBySelector<
	Component extends I_ComponentShape,
	Sel extends string,
	Nullable extends boolean
> = Component extends { HAQ_children?: infer INF_ComponentChildren }
	? INF_ComponentChildren extends Record<infer INF_ComponentAlias, infer INF_ComponentShape extends I_ComponentShape>
		? INF_ComponentShape extends { HAQ_selector: infer INF_Sel extends string }
			? Sel extends INF_Sel
				? Nullable extends true
					? RenderedOrNotHelper<INF_ComponentChildren[INF_ComponentAlias]>
					: RenderedDOMElementOrWebComponent<INF_ComponentChildren[INF_ComponentAlias]>
				: never
			: never
		: never
	: never

type FindChildElFromSlotChildrenBySelector<
	Component extends I_ComponentShape,
	Sel extends string,
	Nullable extends boolean
> = Component extends { HAQ_slotChildren?: infer INF_ComponentChildren }
	? INF_ComponentChildren extends Record<infer INF_ComponentAlias, infer INF_ComponentShape extends I_ComponentShape>
		? INF_ComponentShape extends { HAQ_selector: infer INF_Sel extends string }
			? Sel extends INF_Sel
				? Nullable extends true
					? RenderedOrNotHelper<INF_ComponentChildren[INF_ComponentAlias]>
					: RenderedDOMElementOrWebComponent<INF_ComponentChildren[INF_ComponentAlias]>
				: never
			: never
		: never
	: never

/*******************************************************************************
 *
 * Recursively map all `HAQ_elType` -> union of `HAQ_elType`, including root element
 *
 ******************************************************************************/

export type ExtractAllElements<Component extends I_ComponentShape, WithoutRemove extends boolean = false> =
	| RenderedOrNotHelper<Component, WithoutRemove>
	| ExtractElementsFromChildren<Component>
	| ExtractElementsFromSlotChildren<Component>

type ExtractElementsFromChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_children?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractElementsRecursively<INF_ComponentChildren>
	: never

type ExtractElementsFromSlotChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_slotChildren?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractElementsRecursively<INF_ComponentChildren>
	: never

type ExtractElementsRecursively<ComponentChildren extends ComponentChildrenShape> = {
	[K in keyof ComponentChildren]: ExtractAllElements<ComponentChildren[K]>
}[keyof ComponentChildren]

/*******************************************************************************
 *
 * Map all `HAQ_elType` values from direct children only -> union of `HAQ_elType`
 *
 ******************************************************************************/

export type ExtractChildElements<Component extends I_ComponentShape, WithoutRemove extends boolean = false> =
	| ExtractChildElementsFromChildren<Component, WithoutRemove>
	| ExtractChildElementsFromSlotChildren<Component, WithoutRemove>

type ExtractChildElementsFromChildren<
	Component extends I_ComponentShape,
	WithoutRemove extends boolean
> = Component extends {
	HAQ_children?: infer C extends ComponentChildrenShape
}
	? ExtractChildElementsFromComponentChildren<C, WithoutRemove>
	: never

type ExtractChildElementsFromSlotChildren<
	Component extends I_ComponentShape,
	WithoutRemove extends boolean
> = Component extends {
	HAQ_slotChildren?: infer C extends ComponentChildrenShape
}
	? ExtractChildElementsFromComponentChildren<C, WithoutRemove>
	: never

type ExtractChildElementsFromComponentChildren<
	ComponentChildren extends ComponentChildrenShape,
	WithoutRemove extends boolean
> = {
	[K in keyof ComponentChildren]: RenderedOrNotHelper<ComponentChildren[K], WithoutRemove>
}[keyof ComponentChildren]

/*******************************************************************************
 *
 * Type helper for received WebComponent events within a component context.
 *
 * @typeParam Component - the generated markup type.
 *
 * @example
 * ```ts
 * // Useful for named callback listener functions.
 * this.addWebComponentEventListener("my-elem:some-event", this.#myElemListener)
 * readonly #myElemListener = (e: HAQ_CustomEvent<T>["my-elem:some-event"]) => {
 *   // your logic here ...
 * }
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export type WebComponentEvent<Component extends I_ComponentShape> = {
	[K in keyof ExtractAllCustomEvents<Component>]: K extends string
		? TypedCustomEvent<ExtractAllCustomEvents<Component>, K>
		: never
}

/*******************************************************************************
 *
 * Recursively map all `HAQ_customEvents` except root component -> constructed type obj
 *
 * ```ts
 * {
 *     [eventName:string]: {
 *         events: ValidCustomEvents
 *         __EVENT_TARGET: WebComponent
 *     }
 * }
 *
 * ```
 ******************************************************************************/

export type ExtractAllCustomEvents<Component extends I_ComponentShape> = ExtractCustomEventsFromChildren<Component> &
	ExtractCustomEventsFromSlotChildren<Component>

type ExtractCustomEventsFromChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_children?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? IntersectCustomEventTypesFromRecord<INF_ComponentChildren>
	: EmptyObject

type ExtractCustomEventsFromSlotChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_slotChildren?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? IntersectCustomEventTypesFromRecord<INF_ComponentChildren>
	: EmptyObject

type IntersectCustomEventTypesFromRecord<T extends ComponentChildrenShape> = UnionToIntersection<
	{
		[K in keyof T]: ExtractCustomEventsRecursively<T[K]>
	}[keyof T]
>

type ExtractCustomEventsRecursively<Component extends I_ComponentShape> = Component extends {
	HAQ_customEvents?: infer INF_CustomEvents
}
	? INF_CustomEvents extends false
		? ExtractCustomEventsFromChildren<Component> & ExtractCustomEventsFromSlotChildren<Component>
		: AddEventTargetToCustomEvent<INF_CustomEvents, Component> &
				ExtractCustomEventsFromChildren<Component> &
				ExtractCustomEventsFromSlotChildren<Component>
	: ExtractCustomEventsFromChildren<Component> & ExtractCustomEventsFromSlotChildren<Component>

type AddEventTargetToCustomEvent<CustomEvents, Component extends I_ComponentShape> = {
	[K in keyof CustomEvents]: {
		events: CustomEvents[K]
		__EVENT_TARGET: ExposedWebComponent<Component>
	}
}

/*******************************************************************************
 *
 * Correctly type `target` type from custom event and attach it to element that emitted the event.
 *
 ******************************************************************************/

export type TypedCustomEvent<
	InternalCustomEvents extends ComponentEventsShape,
	K extends keyof InternalCustomEvents & string
> = InternalCustomEvents[K] extends {
	events: infer INF_CustomEvenets
	__EVENT_TARGET: infer INF_EventTarget
}
	? TypedOmit<CustomEvent<INF_CustomEvenets>, "target"> & {
			target: INF_EventTarget
		}
	: never

/*******************************************************************************
 *
 * Recursively map all `HAQ_eventListenerType` -> union of `HAQ_eventListenerType`, including root element
 *
 ******************************************************************************/

export type ExtractAllNativeEvents<Component extends I_ComponentShape> = Component extends {
	HAQ_eventListenerType: infer INF_Nativelisteners extends NativeEventType
}
	? INF_Nativelisteners | ExtractNativeEventsFromChildren<Component> | ExtractNativeEventsFromSlotChildren<Component>
	: ExtractNativeEventsFromChildren<Component> | ExtractNativeEventsFromSlotChildren<Component>

type ExtractNativeEventsFromChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_children?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractNativeEventsRecursively<INF_ComponentChildren>
	: never

type ExtractNativeEventsFromSlotChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_slotChildren?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractNativeEventsRecursively<INF_ComponentChildren>
	: never

type ExtractNativeEventsRecursively<ComponentChildren extends ComponentChildrenShape> = {
	[K in keyof ComponentChildren]: ExtractAllNativeEvents<ComponentChildren[K]>
}[keyof ComponentChildren]

/*******************************************************************************
 *
 * Type helper to extract `HAQ_eventListenerType` values by kind and return a string literal union of events.
 *
 ******************************************************************************/

export type ExtractNativeEventTypesByKind<
	EventTypes extends NativeEventType,
	Kind extends NativeEventTypeKind = "native"
> = Kind extends "native"
	? ExtractGeneralEventTypes<EventTypes>
	: Kind extends "doc"
		? ExtractDocEventTypes<EventTypes>
		: Kind extends "win"
			? ExtractWinEventTypes<EventTypes>
			: never

type ExtractGeneralEventTypes<EventTypes extends NativeEventType> = {
	[EvType in EventTypes]: EvType extends keyof HTMLElementEventMap ? EvType : never
}[EventTypes]

type ExtractDocEventTypes<EventTypes extends NativeEventType> = {
	[EvType in EventTypes]: EvType extends `d:${infer INF_EvType extends keyof DocumentEventMap}` ? INF_EvType : never
}[EventTypes]

type ExtractWinEventTypes<EventTypes extends NativeEventType> = {
	[EvType in EventTypes]: EvType extends `w:${infer INF_EvType extends keyof WindowEventMap}` ? INF_EvType : never
}[EventTypes]

/*******************************************************************************
 *
 * Type helper for augmenting `handleEvent(e)`
 *
 ******************************************************************************/

export type NativeEventListenerObject<Component extends I_ComponentShape> = {
	/** biome-ignore lint/style/useConsistentMethodSignatures: DOM properties don't augment well when written out in property style */
	handleEvent(e: NativeEvent<Component>): void
}

/*******************************************************************************
 *
 * Type helper for received native events within a component context.
 *
 * @typeParam Component - the generated markup type.
 * @typeParam EvType - the name of the event type (optional).
 *
 * NOTE: If a second EvType argument is passed, it will return the proper event type (`SubmitEvent`, `MouseEvent`...)
 *
 * @example
 * ```ts
 * type T = MU_MyElem // imported from generated haq file - markup.ts
 *
 * handleEvent(e: HAQ_Event<T>) {
 *   switch (e.type) {
 *      case "submit":
 *        this.#onSubmit(e)
 *        break
 *      default:
 *        assertUnreachable(e)
 *   }
 * }
 *
 * #onSubmit(e: HAQ_Event<T, "submit">) {
 *   // your submit logic
 * }
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export type NativeEvent<
	Component extends I_ComponentShape,
	EvType extends keyof EvTypesMapFromShapesUnion<ExtractAllShapesWithNativeEvTypes<Component>> | false = false,
	EvTypesMap extends EvTypesMapFromShapesUnion<
		ExtractAllShapesWithNativeEvTypes<Component>
	> = EvTypesMapFromShapesUnion<ExtractAllShapesWithNativeEvTypes<Component>>
> = EvType extends keyof EvTypesMap
	? EvType extends keyof HTMLElementEventMap
		? EvTypesMap[EvType] extends I_ComponentShape
			? TypedOmit<HTMLElementEventMap[EvType], "target" | "type"> & {
					readonly type: EvType
					readonly target: AnyDOMElement & TypedEventTarget<EvTypesMap[EvType]>
				}
			: never
		: never
	: {
			[K in keyof EvTypesMap]: K extends keyof HTMLElementEventMap
				? EvTypesMap[K] extends I_ComponentShape
					? TypedOmit<HTMLElementEventMap[K], "target" | "type"> & {
							readonly type: K
							readonly target: AnyDOMElement & TypedEventTarget<EvTypesMap[K]>
						}
					: never
				: never
		}[keyof EvTypesMap]

type TypedEventTarget<Component extends I_ComponentShape> = {
	/** biome-ignore lint/style/useConsistentMethodSignatures: DOM properties don't augment well when written out in property style */
	closest<Sel extends ExtractAllSelectors<Component> & string>(
		selector: Sel
	): FindNestedChildElBySelector<Component, Sel, false> | null
}

/*******************************************************************************
 *
 * Construct map of `HAQ_eventListenerType` from union of `I_ComponentShape`
 *
 ******************************************************************************/

type EvTypesMapFromShapesUnion<Components extends I_ComponentShape> = {
	[Shape in Components as Shape["HAQ_eventListenerType"] extends NativeEventType
		?
				| ExtractGeneralEventTypes<Shape["HAQ_eventListenerType"]>
				| ExtractDocEventTypes<Shape["HAQ_eventListenerType"]>
				| ExtractWinEventTypes<Shape["HAQ_eventListenerType"]>
		: never]: Shape
}

/*******************************************************************************
 *
 * Recursively map all `I_ComponentShape` that have `HAQ_eventListenerType` defined -> union of `I_ComponentShape`, including root element
 *
 ******************************************************************************/

type ExtractAllShapesWithNativeEvTypes<Component extends I_ComponentShape> = Component extends {
	HAQ_eventListenerType: NativeEventType
}
	?
			| Component
			| ExtractShapesWithNativeEvTypesFromChildren<Component>
			| ExtractShapesWithNativeEvTypesFromSlotChildren<Component>
	: ExtractShapesWithNativeEvTypesFromChildren<Component> | ExtractShapesWithNativeEvTypesFromSlotChildren<Component>

type ExtractShapesWithNativeEvTypesFromChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_children?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractShapesWithNativeEvTypesRecursively<INF_ComponentChildren>
	: never

type ExtractShapesWithNativeEvTypesFromSlotChildren<Component extends I_ComponentShape> = Component extends {
	HAQ_slotChildren?: infer INF_ComponentChildren extends ComponentChildrenShape
}
	? ExtractShapesWithNativeEvTypesRecursively<INF_ComponentChildren>
	: never

type ExtractShapesWithNativeEvTypesRecursively<ComponentChildren extends ComponentChildrenShape> = {
	[K in keyof ComponentChildren]: ExtractAllShapesWithNativeEvTypes<ComponentChildren[K]>
}[keyof ComponentChildren]

/*******************************************************************************
 *
 * Typed wrapper for `new Event()` to pass to `dispatchEvent`
 *
 ******************************************************************************/

export type ConstructedEvent<Component extends I_ComponentShape, EventType extends ValidNativeEvType<Component>> = {
	new (
		type: EventType,
		init?: EventInit
	): TypedOmit<Event, "type"> & { readonly type: EventType } & HTMLElementEventMap[EventType]
}
