//#region -------------------------------------------------- Type Imports

import type { HAQ_AnyDOMElement } from "@haq/astro"
import type { MU_MyForm } from "@haq/markup"

type T = MU_MyForm // the generated App Component markup type

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppComponent } from "@haq/astro"

//#endregion ----------------------------------------------- Module Imports

export class MyForm extends AppComponent<T>() {
	// initialize your dom variables

	constructor() {
		super("myForm") // id attribute of Component

		this.#onSubmit()

		// add native event listeners
		// add custom event listeners
		// other setup
		// safe to invoke methods of child WebComponents, DOM is fully loaded at this point
	}

	#onSubmit(): void {
		const FormData = this.FormManipulation.makeFormData(this)
		const emailValue = FormData.get("email") // string | null
		const roleValue = FormData.get("role") // "ADMIN" | "CLIENT" | null
		const profilePic = FormData.get("profilePic") // File | null
	}
}
