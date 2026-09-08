// src/app-router/index.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_AppEvents, HAQ_AppEventsRouter } from "@haq/astro"
import type { HAQ_AppComponents_1, MU_Scaffold } from "@haq/markup"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppRouter, getRootDoc } from "@haq/astro"
import { MyHeader } from "../app-components/MyHeader/MyHeader.js"
import { PerfectNumber } from "../app-components/PerfectNumber/PerfectNumber.js"
import { perfectNumberUpdated } from "./events/perfect-number-updated.js"

//#endregion ----------------------------------------------- Module Imports

const componentsRouter: HAQ_AppComponents_1 = {
	"/": {
		MyHeader
	},

	"/tutorial/custom-elements": {
		MyHeader
	},

	"/tutorial/web-components": {
		MyHeader
	},

	"/tutorial/custom-events": {
		MyHeader
	},

	"/tutorial/app-components": {
		MyHeader,
		PerfectNumber
	}
}

const eventsRouter: HAQ_AppEventsRouter<HAQ_AppComponents_1> = {
	"perfect-number-updated": perfectNumberUpdated
}

AppRouter({
	componentsRouter,
	eventsRouter,
	resizeHandler,

	afterSwapHandler: (route, constructedComponentsRouter, _isInitialLoad) => {
		constructedComponentsRouter[route].MyHeader.updateNav(route)
	}
})

export type Context = AppRouter<HAQ_AppComponents_1>
export type AppEvents = HAQ_AppEvents<HAQ_AppComponents_1>

function resizeHandler(): void {
	const HUNDRED_PERCENT = 100
	const vh = window.innerHeight / HUNDRED_PERCENT
	const RootDoc = getRootDoc<MU_Scaffold>()
	RootDoc.style.setProperty("--__vh", `${vh}px`)
}
