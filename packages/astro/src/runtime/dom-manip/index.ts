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
import type { I_DOMManipulation } from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppComponentClass } from "../app-component/index.js"

//#endregion ----------------------------------------------- Module Imports

export function makeDOMManipulation<PA_Component extends I_ComponentShape>(): I_DOMManipulation<PA_Component> {
	return Object.freeze({
		insertAfter,
		getParent,
		getClosest,
		getSibling,
		getChild,
		getComputedStyle,
		isActive
	})

	function insertAfter<
		IA_RefComponent extends ExtractAllComponentShapes<PA_Component>,
		IA_NewComponent extends FindNestedParentShapeByShape<PA_Component, IA_RefComponent>
	>(
		refEl: RenderedDOMElementOrWebComponent<IA_RefComponent>,
		newEl: IA_RefComponent extends PA_Component ? never : ExtractChildElements<IA_NewComponent, true>
	): void {
		if (!(refEl instanceof HTMLElement && newEl instanceof HTMLElement)) return
		refEl.after(newEl)
	}

	function getParent<
		IA_ChildComponent extends ExtractAllComponentShapes<PA_Component>,
		IA_ParentSel extends FindNestedParentShapeByShape<PA_Component, IA_ChildComponent>["HAQ_selector"] & string
	>(
		childEl: RenderedDOMElementOrWebComponent<IA_ChildComponent>,
		selector: IA_ChildComponent extends PA_Component ? never : IA_ParentSel
	): FindNestedChildElBySelector<PA_Component, IA_ParentSel, false> | null {
		if (!(childEl instanceof HTMLElement)) return null

		const parentElement = childEl.parentElement as unknown as FindNestedChildElBySelector<
			PA_Component,
			IA_ParentSel,
			false
		>
		return (parentElement as unknown as HTMLElement).matches(selector) ? parentElement : null
	}

	function getClosest<IA_Sel extends ExtractAllSelectors<PA_Component>>(
		refEl: AnyDOMElement,
		selector: IA_Sel
	): FindNestedChildElBySelector<PA_Component, IA_Sel, false> | null {
		if (!(refEl instanceof HTMLElement)) return null

		return refEl.closest(selector as string) as FindNestedChildElBySelector<PA_Component, IA_Sel, false> | null
	}

	function getSibling<
		IA_RefComponent extends ExtractAllComponentShapes<PA_Component>,
		IA_ParentComponent extends FindNestedParentShapeByShape<PA_Component, IA_RefComponent>,
		IA_SiblingSel extends ExtractChildSelectors<IA_ParentComponent> & string,
		IA_SiblingEl extends FindChildElBySelector<IA_ParentComponent, IA_SiblingSel, false>
	>(
		refEl: RenderedDOMElementOrWebComponent<IA_RefComponent>,
		order: "previous" | "next",
		selector: IA_RefComponent extends PA_Component ? never : IA_SiblingSel
	): IA_SiblingEl | null {
		if (!(refEl instanceof HTMLElement)) return null

		if (order === "previous") {
			const prevElem = refEl.previousElementSibling as IA_SiblingEl | null

			return _findPreviousSibling(prevElem) as IA_SiblingEl | null
		}

		const nextElem = refEl.nextElementSibling as IA_SiblingEl | null
		return _findNextSibling(nextElem) as IA_SiblingEl | null

		//* ---------- Helpers -----------------------------------------------

		function _findPreviousSibling(prevElem: Element | null): HTMLElement | null {
			if (!prevElem) return null

			if (prevElem?.matches(selector)) {
				return prevElem
			}

			return _findPreviousSibling(prevElem?.previousElementSibling)
		}

		function _findNextSibling(nextEl: Element | null): HTMLElement | null {
			if (!nextEl) return null

			if (nextEl?.matches(selector)) {
				return nextEl
			}

			return _findNextSibling(nextEl?.nextElementSibling)
		}
	}

	function getChild<
		IA_ParentComponent extends ExtractAllComponentShapes<PA_Component>,
		IA_ChildSel extends ExtractChildSelectors<IA_ParentComponent> & string
	>(
		parentEl: RenderedDOMElementOrWebComponent<IA_ParentComponent>,
		order: "first" | "last",
		selector: IA_ChildSel
	): FindNestedChildElBySelector<PA_Component, IA_ChildSel, false> | null {
		if (!(parentEl instanceof HTMLElement)) return null
		if (order === "first") {
			return _findFirstChild() as FindNestedChildElBySelector<PA_Component, IA_ChildSel, false> | null
		}

		return _findlastChild() as FindNestedChildElBySelector<PA_Component, IA_ChildSel, false> | null

		//* ---------- Helpers -----------------------------------------------

		function _findFirstChild(): HTMLElement | null {
			if (!(parentEl instanceof HTMLElement)) return null
			for (const child of Array.from(parentEl.childNodes)) {
				if (!(child instanceof HTMLElement)) continue
				if (child.matches(selector)) return child
			}
			return null
		}

		function _findlastChild(): HTMLElement | null {
			if (!(parentEl instanceof HTMLElement)) return null
			for (const child of Array.from(parentEl.childNodes).reverse()) {
				if (!(child instanceof HTMLElement)) continue
				if (child.matches(selector)) return child
			}
			return null
		}
	}

	function getComputedStyle<IA_RefEl extends ExtractAllElements<PA_Component>>(
		refEl: IA_RefEl
	): "style" extends keyof IA_RefEl ? IA_RefEl["style"] : never {
		if (refEl instanceof AppComponentClass) {
			return globalThis.getComputedStyle(
				refEl.element as unknown as Element
			) as unknown as "style" extends keyof IA_RefEl ? IA_RefEl["style"] : never
		}

		return globalThis.getComputedStyle(refEl as unknown as Element) as unknown as "style" extends keyof IA_RefEl
			? IA_RefEl["style"]
			: never
	}

	function isActive<IA_RefEl extends ExtractAllElements<PA_Component>>(refEl: IA_RefEl): boolean {
		return document.activeElement === refEl
	}
}
