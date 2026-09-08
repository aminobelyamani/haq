//#region -------------------------------------------------- Type Imports

import type { NativeDOMElement, RenderedDOMElementOrWebComponent } from "../types/dynamic.js"
import type { I_ComponentShape } from "../types/static.js"
import type { I_FormData } from "../types/typed-form-data.js"

//#endregion ----------------------------------------------- Type Imports

export interface I_FormManipulation {
	/*******************************************************************************
	 *
	 * Typed wrapper for the global `FormData` interface.
	 *
	 * @param form The typed DOM `<form>` element.
	 *
	 * @returns Typed instance of `FormData`.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/FormData)
	 *
	 * @example
	 *
	 * ```ts
	 * const FormData = this.FormManipulation.makeFormData(Form)
	 * ```
	 *
	 * @author Amino Belyamani
	 ******************************************************************************/

	readonly makeFormData: <IA_Component extends I_ComponentShape, IA_FormData extends IA_Component["HAQ_formData"]>(
		form: IA_FormData extends undefined ? never : RenderedDOMElementOrWebComponent<IA_Component>
	) => I_FormData<NonNullable<IA_FormData>>

	/*******************************************************************************
	 *
	 * Typed helper to set a value to a given input field in a form.
	 *
	 * @param form The typed DOM `<form>` element.
	 * @param name The input's name, i.e. the value of the name attribute.
	 * @param value The typed value to set the input to.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLInputElement/value)
	 *
	 ******************************************************************************/

	readonly setValue: <
		IA_Component extends I_ComponentShape,
		IA_FormData extends IA_Component["HAQ_formData"],
		IA_InputName extends keyof IA_FormData & string
	>(
		form: RenderedDOMElementOrWebComponent<IA_Component>,
		name: IA_InputName,
		value: IA_FormData[IA_InputName] extends string ? IA_FormData[IA_InputName] : never
	) => void

	/*******************************************************************************
	 *
	 * Typed helper to get the value of the checked radio input in the form.
	 *
	 * @param form The typed DOM `<form>` element.
	 * @param name The input's name, i.e. the value of the name attribute.
	 *
	 * @returns The typed value of the checked radio input, `null` if none were checked.
	 *
	 ******************************************************************************/

	readonly getCheckedRadioValue: <
		IA_Component extends I_ComponentShape,
		IA_FormData extends IA_Component["HAQ_formData"],
		IA_InputName extends keyof IA_FormData & string
	>(
		form: RenderedDOMElementOrWebComponent<IA_Component>,
		name: IA_InputName
	) => IA_FormData[IA_InputName] | null

	/*******************************************************************************
	 *
	 * Typed helper to query all the inputs in the form with a given name.
	 *
	 * @param form The typed DOM `<form>` element.
	 * @param name The input's name, i.e. the value of the name attribute.
	 *
	 * @returns Array of typed input elements.
	 *
	 ******************************************************************************/

	readonly getInputElementsByName: <
		IA_Component extends I_ComponentShape,
		IA_FormData extends NonNullable<IA_Component["HAQ_formData"]>,
		IA_InputName extends keyof IA_FormData & string
	>(
		form: RenderedDOMElementOrWebComponent<IA_Component>,
		name: IA_InputName
	) => NativeDOMElement<"input">[]
}
