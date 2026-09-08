import type {
	ExtractAllComponentShapes,
	ExtractAllCustomTags,
	ExtractChildElements,
	FindNestedChildElByTag,
	FindNestedParentShapeByShape,
	RenderedDOMElementOrWebComponent,
	RenderedOrNotHelper,
	ValidComponentSelector
} from "../types/dynamic.js"
import type { I_ComponentShape } from "../types/static.js"

type Parent = HTMLElement | Document | ShadowRoot | DocumentFragment

export function $<T extends I_ComponentShape>(
	parent: Parent,
	selector: ValidComponentSelector<T, "HAQ_selector">
): RenderedOrNotHelper<T>

export function $<T extends I_ComponentShape>(
	parent: Parent,
	selector: ValidComponentSelector<T, "HAQ_selector">,
	returnAll: boolean
): RenderedDOMElementOrWebComponent<T>[]

export function $<T extends I_ComponentShape>(
	parent: Parent,
	selector: ValidComponentSelector<T, "HAQ_selector">,
	returnAll?: boolean
): RenderedOrNotHelper<T> | RenderedDOMElementOrWebComponent<T>[] {
	if (returnAll)
		return Array.from(
			(parent as unknown as HTMLElement).querySelectorAll(selector)
		) as unknown as RenderedDOMElementOrWebComponent<T>[]
	return (parent as unknown as HTMLElement).querySelector(selector) as unknown as RenderedOrNotHelper<T>
}

export interface UNUSED_DOMManipulation<PA_Component extends I_ComponentShape> {
	/*******************************************************************************
	 *
	 * Typed wrapper for `document.createElement()`.
	 *
	 * @param tag The custom element tag name that will be created.
	 * @returns The typed DOM element.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createElement)
	 *
	 ******************************************************************************/

	readonly createElement: <IA_Tag extends ExtractAllCustomTags<PA_Component>>(
		tag: IA_Tag
	) => FindNestedChildElByTag<PA_Component, IA_Tag>

	/*******************************************************************************
	 *
	 * Typed wrapper for the `before()` method of the ChildNode interface.
	 *
	 * @param refEl The typed reference DOM element.
	 * @param newEl The typed DOM element that will be rendered before the reference DOM element.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/CharacterData/before)
	 *
	 ******************************************************************************/

	readonly insertBefore: <
		IA_RefComponent extends ExtractAllComponentShapes<PA_Component>,
		IA_NewComponent extends FindNestedParentShapeByShape<PA_Component, IA_RefComponent>
	>(
		refEl: RenderedDOMElementOrWebComponent<IA_RefComponent>,
		newEl: IA_RefComponent extends PA_Component ? never : ExtractChildElements<IA_NewComponent>
	) => void

	/*******************************************************************************
	 *
	 * Typed wrapper for the `prepend()` or `append()` method of the ParentNode interface.
	 *
	 * @param parentEl The typed parent DOM element.
	 * @param childEl The typed DOM element that will be appended to the parent DOM element.
	 * @param order The order to which to append the DOM element. "first" will prepend, while "last" will append.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/prepend)
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/append)
	 *
	 ******************************************************************************/

	readonly appendChild: <IA_Component extends ExtractAllComponentShapes<PA_Component>>(
		parentEl: RenderedDOMElementOrWebComponent<IA_Component>,
		childEl: ExtractChildElements<IA_Component>,
		order: "first" | "last"
	) => void
}

export function __UNUSED__makeDOMManipulation<
	PA_Component extends I_ComponentShape
>(): UNUSED_DOMManipulation<PA_Component> {
	return Object.freeze({
		createElement,
		insertBefore,
		appendChild
	})

	function createElement<IA_Tag extends ExtractAllCustomTags<PA_Component>>(
		tag: IA_Tag
	): FindNestedChildElByTag<PA_Component, IA_Tag> {
		return document.createElement(tag) as unknown as FindNestedChildElByTag<PA_Component, IA_Tag>
	}

	function insertBefore<
		IA_RefComponent extends ExtractAllComponentShapes<PA_Component>,
		IA_NewComponent extends FindNestedParentShapeByShape<PA_Component, IA_RefComponent>
	>(
		refEl: RenderedDOMElementOrWebComponent<IA_RefComponent>,
		newEl: IA_RefComponent extends PA_Component ? never : ExtractChildElements<IA_NewComponent>
	): void {
		;(refEl as unknown as HTMLElement).before(newEl as unknown as HTMLElement)
	}

	function appendChild<IA_Component extends ExtractAllComponentShapes<PA_Component>>(
		parentEl: RenderedDOMElementOrWebComponent<IA_Component>,
		childEl: ExtractChildElements<IA_Component>,
		order: "first" | "last"
	): void {
		if (order === "first") {
			;(parentEl as unknown as HTMLElement).prepend(childEl as unknown as HTMLElement)
			return
		}
		;(parentEl as unknown as HTMLElement).append(childEl as unknown as HTMLElement)
	}
}
