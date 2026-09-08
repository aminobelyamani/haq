//#region -------------------------------------------------- Type Imports

import type {
	AnyDOMElement,
	ExtractAllComponentShapes,
	ExtractAllElements,
	ExtractAllSelectors,
	ExtractChildElements,
	ExtractChildSelectors,
	FindChildElBySelector,
	FindNestedChildElBySelector,
	FindNestedParentShapeByShape,
	RenderedDOMElementOrWebComponent
} from "../types/dynamic.js"
import type { I_ComponentShape } from "../types/static.js"

//#endregion ----------------------------------------------- Type Imports

export interface I_DOMManipulation<PA_Component extends I_ComponentShape> {
	/*******************************************************************************
	 *
	 * Typed wrapper for the `after()` method of the ChildNode interface.
	 *
	 * @param refEl The typed reference DOM element.
	 * @param newEl The typed DOM element that will be rendered after the reference DOM element.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/CharacterData/after)
	 *
	 ******************************************************************************/

	readonly insertAfter: <
		IA_RefComponent extends ExtractAllComponentShapes<PA_Component>,
		IA_NewComponent extends FindNestedParentShapeByShape<PA_Component, IA_RefComponent>
	>(
		refEl: RenderedDOMElementOrWebComponent<IA_RefComponent>,
		newEl: IA_RefComponent extends PA_Component ? never : ExtractChildElements<IA_NewComponent, true>
	) => void

	/*******************************************************************************
	 *
	 * Typed helper to query the parent of a given typed DOM element.
	 *
	 * @param childEl The typed child DOM element.
	 * @param selector The typed selector for childEl's parent DOM element.
	 *
	 * @returns The typed parent DOM element or `null` if not found.
	 *
	 ******************************************************************************/

	readonly getParent: <
		IA_ChildComponent extends ExtractAllComponentShapes<PA_Component>,
		IA_ParentSel extends FindNestedParentShapeByShape<PA_Component, IA_ChildComponent>["HAQ_selector"] & string
	>(
		childEl: RenderedDOMElementOrWebComponent<IA_ChildComponent>,
		selector: IA_ChildComponent extends PA_Component ? never : IA_ParentSel
	) => FindNestedChildElBySelector<PA_Component, IA_ParentSel, false> | null

	/*******************************************************************************
	 *
	 * Typed wrapper for the `closest()` method of the Element interface.
	 *
	 * @param refEl The typed reference DOM element.
	 * @param selector The typed selector.
	 *
	 * @returns The typed DOM element or `null` if not found.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/closest)
	 *
	 ******************************************************************************/

	readonly getClosest: <IA_Sel extends ExtractAllSelectors<PA_Component>>(
		refEl: AnyDOMElement,
		selector: IA_Sel
	) => FindNestedChildElBySelector<PA_Component, IA_Sel, false> | null

	/*******************************************************************************
	 *
	 * Typed helper to query the closest sibling of a given typed DOM element.
	 *
	 * @param refEl The typed reference DOM element.
	 * @param order The sibling order to query with.
	 * @param selector The typed selector for refEl's sibling DOM element.
	 *
	 * @returns The typed sibling DOM element or `null` if not found.
	 *
	 ******************************************************************************/

	readonly getSibling: <
		IA_RefComponent extends ExtractAllComponentShapes<PA_Component>,
		IA_ParentComponent extends FindNestedParentShapeByShape<PA_Component, IA_RefComponent>,
		IA_SiblingSel extends ExtractChildSelectors<IA_ParentComponent> & string,
		IA_SiblingEl extends FindChildElBySelector<IA_ParentComponent, IA_SiblingSel, false>
	>(
		refEl: RenderedDOMElementOrWebComponent<IA_RefComponent>,
		order: "previous" | "next",
		selector: IA_RefComponent extends PA_Component ? never : IA_SiblingSel
	) => IA_SiblingEl | null

	/*******************************************************************************
	 *
	 * Typed helper to query the closest direct child of a given typed DOM element.
	 *
	 * @param parentEl The typed parent DOM element.
	 * @param order The child order to query with.
	 * @param selector The typed selector for parentEl's direct child DOM element.
	 *
	 * @returns The typed child DOM element or `null` if not found.
	 *
	 ******************************************************************************/

	readonly getChild: <
		IA_ParentComponent extends ExtractAllComponentShapes<PA_Component>,
		IA_ChildSel extends ExtractChildSelectors<IA_ParentComponent> & string
	>(
		parentEl: RenderedDOMElementOrWebComponent<IA_ParentComponent>,
		order: "first" | "last",
		selector: IA_ChildSel
	) => FindNestedChildElBySelector<PA_Component, IA_ChildSel, false> | null

	/*******************************************************************************
	 *
	 * Typed wrapper for the global `getComputedStyle()` function.
	 *
	 * @param refEl The typed reference DOM element.
	 *
	 * @returns The typed `style` property of the typed DOM element.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/getComputedStyle)
	 *
	 ******************************************************************************/

	readonly getComputedStyle: <IA_RefEl extends ExtractAllElements<PA_Component>>(
		refEl: IA_RefEl
	) => "style" extends keyof IA_RefEl ? IA_RefEl["style"] : never

	/*******************************************************************************
	 *
	 * Typed helper to check if a given DOM element is currently focused in the document.
	 *
	 * @param refEl The typed reference DOM element.
	 *
	 * @returns True or false whether refEl is the currently focused element in the document.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/activeElement)
	 *
	 ******************************************************************************/

	readonly isActive: <IA_RefEl extends ExtractAllElements<PA_Component>>(refEl: IA_RefEl) => boolean
}
