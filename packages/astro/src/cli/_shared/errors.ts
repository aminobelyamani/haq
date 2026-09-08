//#region -------------------------------------------------- Type Imports

import type { Diagnostic, I_OutputStyler } from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { HAQLogger } from "./logger.js"

//#endregion ----------------------------------------------- Module Imports

type HAQErrorPayload = {
	message?: string
	description?: string
	sourceFiles?: string[]
	ranges?: Diagnostic["range"][]
	numOfDiagErrors?: number
}

export class HAQError extends Error {
	readonly description
	readonly sourceFiles
	readonly ranges
	readonly numOfDiagErrors

	readonly options

	constructor(
		{ message = "An unexpected error occurred!", description, sourceFiles, ranges, numOfDiagErrors }: HAQErrorPayload,
		options?: ErrorOptions
	) {
		super(message, options)

		this.description = description
		this.sourceFiles = sourceFiles
		this.ranges = ranges
		this.numOfDiagErrors = numOfDiagErrors
		this.options = options

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, HAQError)
		}
	}
}

type ARGS_handleError = {
	err: unknown
	outputStyler: I_OutputStyler
}

export function handleError({ outputStyler, err }: ARGS_handleError): void {
	const Logger = new HAQLogger(outputStyler)

	if (err instanceof HAQError) {
		if (err.numOfDiagErrors) {
			Logger.showDiagSummary(err.numOfDiagErrors)
			return
		}
		Logger.showError({
			message: err.message,
			description: err.description,
			sourceFiles: err.sourceFiles,
			ranges: err.ranges
		})
	} else {
		Logger.showError({ message: "An unexpected error occurred!" })
		console.trace(err)
	}
}

export function handleDiag(numOfDiagErrors: number): void {
	if (numOfDiagErrors > 0) {
		throw new HAQError({ numOfDiagErrors })
	}
}
