// src/web-components/MyCounter/MyCounter.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_Event } from "@haq/astro"
import type { MU_MyCounter } from "@haq/markup"

type T = MU_MyCounter // the generated Web Component markup type

type E = {
	"my-counter:updated": {
		count: number
	}
}

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { defineWebComponent, WebComponent } from "@haq/astro"
import { assertUnreachable } from "@haq/utils"

//#endregion ----------------------------------------------- Module Imports

export class MyCounter extends WebComponent<T, E>() {
	// initialize your dom variables
	readonly #MinusBtn = this.querySelector("[x_sel='minus-btn']")
	readonly #CountSpan = this.querySelector("[x_sel='count']")

	// initialize private variables
	#COUNT = 0

	constructor() {
		super()

		this.addEventListener("click", this, true)
	}

	//* ---------- Listeners ----------------------------------------------------

	handleEvent(e: HAQ_Event<T>): void {
		const type = e.type
		switch (type) {
			case "click": {
				this.#handleClick(e)

				break
			}

			default:
				assertUnreachable(type)
		}
	}

	#handleClick(e: HAQ_Event<T, "click">): void {
		if (e.target.closest("[x_sel='minus-btn']")) {
			this.#COUNT--
			this.#updateCounterText()
		} else if (e.target.closest("[x_sel='plus-btn']")) {
			this.#COUNT++
			this.#updateCounterText()
		}

		this.emitCustomEvent("my-counter:updated", { count: this.#COUNT })
	}

	#updateCounterText(): void {
		this.#CountSpan.textContent = this.#COUNT.toString()
		this.#MinusBtn.disabled = this.#COUNT < 1
	}
}

defineWebComponent(MyCounter, "my-counter")
