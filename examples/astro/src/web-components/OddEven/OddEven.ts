// src/web-components/OddEven/OddEven.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_CustomEvent } from "@haq/astro"
import type { MU_OddEven } from "@haq/markup"

type T = MU_OddEven // the generated Web Component markup type

type E = {
	"odd-even:updated": {
		count: number
	}
}

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { defineWebComponent, WebComponent } from "@haq/astro"

//#endregion ----------------------------------------------- Module Imports

export class OddEven extends WebComponent<T, E>() {
	// initialize your dom variables
	readonly #Result = this.querySelector("[x_sel='result']")

	constructor() {
		super()

		this.addWebComponentEventListener("my-counter:updated", this.#counterUpdated)
	}

	//* ---------- Listeners ----------------------------------------------------

	readonly #counterUpdated = (e: HAQ_CustomEvent<T>["my-counter:updated"]): void => {
		const { count } = e.detail

		if (count % 2 === 0) {
			this.#Result.textContent = "This number is even!"
		} else {
			this.#Result.textContent = "This number is odd!"
		}

		this.emitCustomEvent("odd-even:updated", { count })
	}
}

defineWebComponent(OddEven, "odd-even")
