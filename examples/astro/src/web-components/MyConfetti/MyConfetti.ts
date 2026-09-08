// src/web-components/MyConfetti/MyConfetti.ts

//#region -------------------------------------------------- Type Imports

import type { MU_MyConfetti } from "@haq/markup"

type T = MU_MyConfetti // the generated Web Component markup type

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { defineWebComponent, WebComponent } from "@haq/astro"

//#endregion ----------------------------------------------- Module Imports

export class MyConfetti extends WebComponent<T>() {
	readonly #ClonableParticle = this.querySelector("my-confetti-particle")

	readonly #PARTICLE_COUNT = Number(this.getAttribute("d_particle_count"))

	readonly #COLORS = ["#ffd700", "#f2d74e", "#95c3de", "#b1c999", "#ea6463", "#a372de", "#a372de"]

	//* ---------- Exposed Methods -----------------------------------------------

	start(): void {
		for (const Particle of [...this.querySelectorAll("my-confetti-particle")]) {
			Particle.remove()
		}
		this.#renderParticles()
		this.setAttribute("d_animate", true)
	}

	stop(): void {
		this.removeAttribute("d_animate")
	}

	//* ---------- Helpers -----------------------------------------------

	#renderParticles(): void {
		if (!this.#ClonableParticle) return

		const HUNDRED_PERCENT = 100
		const NINETY_EIGHT_PERCENT = 98
		const MAX_ANIMATION_DELAY = 4
		const MIN_ANIMATION_DURATION = 3
		const MAX_ANIMATION_DURATION = 5

		for (let i = 1; i <= this.#PARTICLE_COUNT; i++) {
			const NewParticle = this.#ClonableParticle.cloneNode(true)
			// background-color

			const newColor = this.#COLORS[(i - 1) % this.#COLORS.length]
			if (!newColor) continue

			NewParticle.style.setProperty("--__bkgColor", newColor)

			// left

			const leftIncr = HUNDRED_PERCENT / this.#PARTICLE_COUNT
			const left = Math.min(NINETY_EIGHT_PERCENT, leftIncr * i)

			NewParticle.style.setProperty("--__left", `${left}%`)

			// animation-delay

			NewParticle.style.setProperty("--__delay", `${this.#getRandomFloat(0, MAX_ANIMATION_DELAY)}s`)

			// animation-duration

			NewParticle.style.setProperty(
				"--__duration",
				`${this.#getRandomFloat(MIN_ANIMATION_DURATION, MAX_ANIMATION_DURATION)}s`
			)

			this.appendChild(NewParticle)
		}
	}

	#getRandomFloat(min: number, max: number): number {
		return Math.random() * (max - min) + min
	}
}

defineWebComponent(MyConfetti, "my-confetti")
