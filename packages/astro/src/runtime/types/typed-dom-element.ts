/** biome-ignore-all lint/style/useConsistentMethodSignatures: DOM properties don't augment well when written out in property style */

//#region ----------------------------------------------- Type Imports

import type { ExtractKeys, IsOptionalKey, NoEmptyArray, RequiredKeys, TypedOmit } from "@haq/utils/types"
import type {
	ConstructedEvent,
	ExtractAllElements,
	ExtractAllNativeEvents,
	ExtractChildElements,
	ExtractChildSelectors,
	ExtractNativeEventTypesByKind,
	FindChildElBySelector,
	NativeEventListenerObject,
	RenderedDOMElementOrWebComponent,
	ValidNativeEvType
} from "./dynamic.js"
import type { I_ComponentShape, NativeEventType } from "./static.js"

//#endregion ----------------------------------------------- Type Imports

//------------------------------------------------------------------------------
//
// Typed DOM Element Property Types
//
//------------------------------------------------------------------------------

//@ts-expect-error: EL will always be an element that extends HTMLElement
export interface I_DOMElement<Component extends I_ComponentShape, EL extends Component["HAQ_elType"]> extends EL {
	//* ---------- Selectors -----------------------------------------------

	querySelector<
		IA_Sel extends ExtractChildSelectors<Component>,
		IA_El extends FindChildElBySelector<Component, IA_Sel, true>
	>(selector: IA_Sel): IA_El
	querySelectorAll<
		IA_Sel extends ExtractChildSelectors<Component>,
		IA_El extends FindChildElBySelector<Component, IA_Sel, false>
	>(selector: IA_Sel): NodeListOf<IA_El>

	matches(
		selector: Component["HAQ_selector"] extends string
			? EL extends HTMLInputElement
				? Component["HAQ_selector"] | Component["HAQ_matchingSelectors"] | ":autofill"
				: Component["HAQ_matchingSelectors"] | Component["HAQ_selector"]
			: Component["HAQ_matchingSelectors"] extends string
				? Component["HAQ_matchingSelectors"]
				: never
	): boolean

	//* ---------- Class Manipulation -----------------------------------------------

	classList: {
		add(...tokens: ExtractClassList<Component>[]): void
		remove(...tokens: ExtractClassList<Component>[]): void
		contains(token: ExtractClassList<Component>): boolean
		toggle(token: ExtractClassList<Component>, force?: boolean): boolean
	}

	//* ---------- NOT USABLE Class Manipulation -----------------------------------------------

	getElementsByClassName(className: never): never
	getElementsByTagName(name: never): never
	getElementsByTagNameNS(namespace: never, name: never): never
	className: never

	//* ---------- Attribute Manipulation -----------------------------------------------

	getAttribute<IA_AttrName extends keyof ExtractAttributes<Component> & string>(
		attribute: IA_AttrName
	): ExtractAttributes<Component>[IA_AttrName]
	removeAttribute<IA_AttrName extends keyof ExtractAttributes<Component> & string>(attribute: IA_AttrName): void
	setAttribute<IA_AttrName extends keyof ExtractAttributes<Component> & string>(
		attribute: IA_AttrName,
		value: ExtractAttributes<Component>[IA_AttrName]
	): void
	toggleAttribute<IA_AttrName extends keyof ExtractAttributes<Component> & string>(
		attribute: IA_AttrName,
		force?: boolean
	): boolean
	hasAttribute<IA_AttrName extends keyof ExtractAttributes<Component> & string>(attribute: IA_AttrName): boolean
	getAttributeNames(): ExtractKeys<ExtractAttributes<Component>>[]

	//* ---------- NOT USABLE Attribute Manipulation -----------------------------------------------

	getAttributeNode(attribute: never): never
	setAttributeNode(attrNode: never): never
	getAttributeNS(namesapce: never, attribute: never): never
	getAttributeNodeNS(namespace: never, attribute: never): never
	setAttributeNS(namespace: never, attribute: never): never
	hasAttributeNS(namesapce: never, attribute: never): never
	removeAttributeNS(namesapce: never, attribute: never): never
	setAttributeNodeNS(attrNode: never): never
	dataset: never

	//* ---------- Style Property Manipulation -----------------------------------------------

	style: {
		getPropertyValue(property: ExtractStyleProperties<Component>): string
		setProperty(property: ExtractStyleProperties<Component>, value: string | null, priority?: string): void
		removeProperty(property: ExtractStyleProperties<Component>): void
	}

	//* ---------- Content (type-safe text) Manipulation -----------------------------------------------

	innerText: never
	outerText: never
	textContent: ExtractChildElements<Component> extends never ? string : never
	innerHTML: ExtractChildElements<Component> extends never ? string : never

	insertAdjacentHTML(
		position: InsertPosition,
		string: ExtractChildElements<Component> extends never ? string : never
	): void

	//* ---------- NOT USABLE Content (type-safe text) Manipulation -----------------------------------------------

	setHTMLUnsafe(html: never): never
	outerHTML: never

	//* ---------- Listeners -----------------------------------------------

	addEventListener(
		type: ExtractAllNativeEvents<Component> extends NativeEventType
			? ExtractNativeEventTypesByKind<ExtractAllNativeEvents<Component>>
			: never,
		listener: NativeEventListenerObject<Component>,
		options?: boolean | AddEventListenerOptions
	): void

	removeEventListener(
		type: ExtractAllNativeEvents<Component> extends NativeEventType
			? ExtractNativeEventTypesByKind<ExtractAllNativeEvents<Component>>
			: never,
		listener: NativeEventListenerObject<Component>,
		options?: boolean | AddEventListenerOptions
	): void

	// biome-ignore lint/style/useUnifiedTypeSignatures: We need this overload to allow use of TypedEvent
	dispatchEvent<IA_EventType extends ValidNativeEvType<Component>>(
		event: ConstructedEvent<Component, IA_EventType>
	): boolean

	dispatchEvent<IA_EventType extends ValidNativeEvType<Component>>(
		event: TypedOmit<Event, "type"> & {
			readonly type: IA_EventType
		} & HTMLElementEventMap[IA_EventType]
	): boolean

	//* ---------- DOM Manipulation -----------------------------------------------

	cloneNode<IA_El extends RenderedDOMElementOrWebComponent<Component>>(deep?: boolean): IA_El
	contains<IA_El extends RenderedDOMElementOrWebComponent<Component> | ExtractAllElements<Component>>(
		node: IA_El
	): boolean
	compareDocumentPosition<IA_OtherEl extends RenderedDOMElementOrWebComponent<Component>>(otherNode: IA_OtherEl): number

	append(...nodes: NonNullable<ExtractChildElements<Component, true>>[]): void
	appendChild<IA_El extends NonNullable<ExtractChildElements<Component>>>(node: Omit<IA_El, "remove">): IA_El
	prepend(...nodes: NonNullable<ExtractChildElements<Component, true>>[]): void

	moveBefore<
		IA_ElToMove extends NonNullable<ExtractChildElements<Component, true>>,
		IA_RefEl extends NonNullable<ExtractChildElements<Component, true>>
	>(node: IA_ElToMove, child: IA_RefEl | null): void
	insertBefore<
		IA_NewEl extends NonNullable<ExtractChildElements<Component>>,
		IA_RefEl extends NonNullable<ExtractChildElements<Component>>
	>(newNode: Omit<IA_NewEl, "remove">, refNode: IA_RefEl): IA_NewEl

	replaceChild<IA_El extends NonNullable<ExtractChildElements<Component>>>(
		newChild: Omit<IA_El, "remove">,
		oldChild: IA_El
	): IA_El
	replaceWith<IA_El extends RenderedDOMElementOrWebComponent<Component, true>>(node: IA_El): void
	removeChild<IA_El extends NonNullable<ExtractChildElements<Component>>>(
		node: "remove" extends keyof IA_El ? IA_El : never
	): IA_El
	replaceChildren(...nodes: NoEmptyArray<never>): void

	remove(): void

	isEqualNode(node: RenderedDOMElementOrWebComponent<Component, true> | null): boolean

	readonly nodeName: Component["HAQ_tag"]

	id: Component["HAQ_id"] extends string ? Component["HAQ_id"] : never

	//* ---------- NOT USABLE DOM Manipulation -----------------------------------------------

	readonly childNodes: NodeListOf<never>
	children: never
	closest(): never
	before(...nodes: NoEmptyArray<never>): void
	after(...nodes: NoEmptyArray<never>): void

	insertAdjacentElement(where: never, el: never): never

	firstChild: never
	lastChild: never
	firstElementChild: never
	lastElementChild: never
	nextSibling: never
	nextElementSibling: never
	parentElement: never
	parentNode: never
	previousSibling: never
	previousElementSibling: never
}

//------------------------------------------------------------------------------
//
// Type Helpers
//
//------------------------------------------------------------------------------

/*******************************************************************************
 *
 * Extract `HAQ_classList` from shape -> union of `HAQ_classList`
 *
 ******************************************************************************/

type ExtractClassList<Component extends I_ComponentShape> = Component extends {
	HAQ_classList: infer INF_ClassList
}
	? INF_ClassList
	: never

/*******************************************************************************
 *
 * Extract `HAQ_attributes` from shape and reconstruct to account for nullable values -> reconstructed `HAQ_attributes`
 *
 ******************************************************************************/

type ExtractAttributes<Component extends I_ComponentShape> = Component extends ComponentWithAttributes
	? {
			[K in keyof Component["HAQ_attributes"]]-?: IsOptionalKey<Component["HAQ_attributes"], K> extends true
				? NonNullable<Component["HAQ_attributes"][K]> | null
				: NonNullable<Component["HAQ_attributes"][K]>
		}
	: never

type ComponentWithAttributes = RequiredKeys<I_ComponentShape, "HAQ_attributes">

/*******************************************************************************
 *
 * Extract `HAQ_styleProperties` from shape -> `HAQ_styleProperties`
 *
 ******************************************************************************/

type ExtractStyleProperties<Component extends I_ComponentShape> = Component extends {
	HAQ_styleProperties: infer INF_StyleProps
}
	? INF_StyleProps
	: never
