// src/app-components/MyHeader/MyHeader.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_Event } from "@haq/astro"
import type { MU_MyHeader } from "@haq/markup"
import type { HAQ_PageRoute } from "@haq/routes-1"

type T = MU_MyHeader // the generated App Component markup type

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppComponent } from "@haq/astro"
import { assertUnreachable } from "@haq/utils"

//#endregion ----------------------------------------------- Module Imports

export class MyHeader extends AppComponent<T>() {
	// initialize your dom variables
	readonly #Nav = this.querySelector("[x_sel='nav']")
	readonly #NavLinks = [...this.#Nav.querySelectorAll("[x_sel='nav-link']")]

	readonly #MyConfetti = this.querySelector("my-confetti")

	constructor() {
		super("header") // id attribute of Component

		this.addEventListener("click", this)
	}

	override destructor(): void {
		// we only need to do this because this component has a transiion:persist directive and don't want to keep adding listeners on every navigation
		this.removeEventListener("click", this)
	}

	//* ---------- Exposed Methods -----------------------------------------------

	updateNav(currentPage: HAQ_PageRoute): void {
		for (const Link of this.#NavLinks) {
			Link.removeAttribute("d_active")
		}
		const ActiveLink = this.#NavLinks.find((Link) => Link.getAttribute("href") === currentPage)
		ActiveLink?.setAttribute("d_active", true)
	}

	confettiTime(): void {
		this.#MyConfetti.start()
	}

	stopConfetti(): void {
		this.#MyConfetti.stop()
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
		const NavLink = e.target.closest("[x_sel='nav-link']")
		if (NavLink?.hasAttribute("d_active")) {
			e.preventDefault()
		}
	}
}
