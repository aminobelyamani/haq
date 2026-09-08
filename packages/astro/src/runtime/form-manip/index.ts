//#region -------------------------------------------------- Type Imports

import type { NativeDOMElement, RenderedDOMElementOrWebComponent } from "../types/dynamic.js"
import type { I_ComponentShape } from "../types/static.js"
import type { I_FormData } from "../types/typed-form-data.js"
import type { I_FormManipulation } from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppComponentClass } from "../app-component/index.js"

//#endregion ----------------------------------------------- Module Imports

export function makeFormManipulation(): I_FormManipulation {
	return Object.freeze({
		makeFormData,
		setValue,
		getCheckedRadioValue,
		getInputElementsByName
	})

	//------------------------------------------------------------------------------
	//
	// Form Data
	//
	//------------------------------------------------------------------------------

	function makeFormData<IA_Component extends I_ComponentShape, IA_FormData extends IA_Component["HAQ_formData"]>(
		form: IA_FormData extends undefined ? never : RenderedDOMElementOrWebComponent<IA_Component>
	): I_FormData<NonNullable<IA_FormData>> {
		if (form instanceof AppComponentClass) {
			return new FormData(form.element as unknown as HTMLFormElement) as unknown as I_FormData<NonNullable<IA_FormData>>
		}

		if (!(form instanceof HTMLFormElement)) {
			throw new Error(" Expected a HTMLFormElement.")
		}

		return new FormData(form) as unknown as I_FormData<NonNullable<IA_FormData>>
	}

	//------------------------------------------------------------------------------
	//
	// Set Input Value
	//
	//------------------------------------------------------------------------------

	function setValue<
		IA_Component extends I_ComponentShape,
		IA_FormData extends IA_Component["HAQ_formData"],
		IA_InputName extends keyof IA_FormData & string
	>(
		form: RenderedDOMElementOrWebComponent<IA_Component>,
		name: IA_InputName,
		value: IA_FormData[IA_InputName] extends string ? IA_FormData[IA_InputName] : never
	): void {
		if (!(form instanceof HTMLFormElement)) return

		const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement
		if (!input) return

		input.value = value as string
	}

	//------------------------------------------------------------------------------
	//
	// Get Checked Radio Value
	//
	//------------------------------------------------------------------------------

	function getCheckedRadioValue<
		IA_Component extends I_ComponentShape,
		IA_FormData extends IA_Component["HAQ_formData"],
		IA_InputName extends keyof IA_FormData & string
	>(form: RenderedDOMElementOrWebComponent<IA_Component>, name: IA_InputName): IA_FormData[IA_InputName] | null {
		if (!(form instanceof HTMLFormElement)) return null

		const radioInputs = form.querySelectorAll(`[name="${name}"]`) as NodeListOf<HTMLInputElement>
		let checkedValue: IA_FormData[IA_InputName] | null = null

		for (const radioInput of radioInputs) {
			if (radioInput.checked) {
				checkedValue = radioInput.value as IA_FormData[IA_InputName]
				break
			}
		}
		return checkedValue
	}

	//------------------------------------------------------------------------------
	//
	// Get Inputs By Name
	//
	//------------------------------------------------------------------------------

	function getInputElementsByName<
		IA_Component extends I_ComponentShape,
		IA_FormData extends NonNullable<IA_Component["HAQ_formData"]>,
		IA_InputName extends keyof IA_FormData & string
	>(form: RenderedDOMElementOrWebComponent<IA_Component>, name: IA_InputName): NativeDOMElement<"input">[] {
		if (!(form instanceof HTMLFormElement)) {
			throw new Error(" Expected a HTMLFormElement.")
		}

		return Array.from(form.querySelectorAll(`[name="${name}"]`)) as unknown as NativeDOMElement<"input">[]
	}
}
