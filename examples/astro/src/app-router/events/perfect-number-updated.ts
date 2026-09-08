// src/app-router/events/perfect-number-updated.ts

//#region -------------------------------------------------- Type Imports

import type { AppEvents, Context } from "../index.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

//#endregion ----------------------------------------------- Module Imports

export function perfectNumberUpdated(context: Context, data: AppEvents["perfect-number-updated"]): void {
	if (data.isPerfectNumber) {
		context.getCurrentComponents("any").MyHeader.confettiTime()
	} else {
		context.getCurrentComponents("any").MyHeader.stopConfetti()
	}
}
