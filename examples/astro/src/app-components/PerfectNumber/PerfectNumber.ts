// src/app-components/PerfectNumber/PerfectNumber.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_CustomEvent } from "@haq/astro"
import type { MU_PerfectNumber } from "@haq/markup"

type T = MU_PerfectNumber // the generated App Component markup type

// your defined app events
type E = {
	"perfect-number-updated": {
		isPerfectNumber: boolean
	}
}

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppComponent } from "@haq/astro"

//#endregion ----------------------------------------------- Module Imports

export class PerfectNumber extends AppComponent<T, E>() {
	// initialize your dom variables
	readonly #ResultHeading = this.querySelector("[x_sel='result-heading']")

	constructor() {
		super("perfectNumber") // id attribute of Component

		this.addWebComponentEventListener("odd-even:updated", this.#oddEvenUpdated)
	}

	//* ---------- Listeners ----------------------------------------------------

	readonly #oddEvenUpdated = (e: HAQ_CustomEvent<T>["odd-even:updated"]): void => {
		const FIRST_PERFECT_NUMBER = 6

		const { count } = e.detail

		if (count === FIRST_PERFECT_NUMBER) {
			this.#ResultHeading.textContent = `${count} is a Perfect Number!`
			this.#ResultHeading.classList.add("clr-accent")
			this.emitAppEvent("perfect-number-updated", { isPerfectNumber: true })
		} else {
			this.#ResultHeading.textContent = `${count} is not a perfect number.`
			this.#ResultHeading.classList.remove("clr-accent")
			this.emitAppEvent("perfect-number-updated", { isPerfectNumber: false })
		}
	}
}
