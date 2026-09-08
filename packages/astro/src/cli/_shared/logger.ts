//#region -------------------------------------------------- Type Imports

import type {
	Diagnostic,
	ErrorDisplayPayload,
	HelpDisplayPayload,
	I_OutputStyler,
	SuccessDisplayPayload
} from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import process from "node:process"
import { PACKAGE_VERSION } from "./version.js"

//#endregion ----------------------------------------------- Module Imports

export class HAQLogger {
	readonly #OUTPUT_STYLER: I_OutputStyler

	constructor(outputStyler: I_OutputStyler) {
		this.#OUTPUT_STYLER = outputStyler
	}
	//* ---------- Exposed Methods -----------------------------------------------

	showHelp({ headline, usage, tables, description }: HelpDisplayPayload): void {
		const whiteTitle = (label: string): string =>
			`${this.#tab()}${this.#OUTPUT_STYLER.bgWhite(this.#OUTPUT_STYLER.black(` ${label} `))}`
		const yellowTitle = (label: string): string =>
			`${this.#tab()}${this.#OUTPUT_STYLER.bgYellow(this.#OUTPUT_STYLER.black(` ${label} `))}`

		const table = (rows: [string, string][], { padding }: { padding: number }): string => {
			const split = process.stdout.columns < 60
			let raw = ""

			for (const row of rows) {
				if (split) {
					raw += `    ${row[0]}\n    `
				} else {
					raw += `${`${row[0]}`.padStart(padding)}`
				}
				raw += `  ${this.#OUTPUT_STYLER.dim(row[1])}\n`
			}

			return raw.slice(0, -1) // remove latest \n
		}

		const message: string[] = []

		if (headline) {
			message.push(
				this.#lineBreak(),
				`${this.#OUTPUT_STYLER.bold(this.#OUTPUT_STYLER.bgGreen(" HAQ "))} ${this.#OUTPUT_STYLER.green(`v${PACKAGE_VERSION}`)} ${headline}`
			)
		}

		if (usage) {
			message.push(
				this.#lineBreak(),
				yellowTitle("Usage"),
				this.#lineBreak(),
				`${this.#tab()}${this.#tab()}${this.#OUTPUT_STYLER.bold(usage)}`
			)
		}

		if (tables) {
			function calculateTablePadding(rows: [string, string][]): number {
				return rows.reduce((val, [first]) => Math.max(val, first.length), 0) + 2
			}

			message.push(this.#lineBreak(), yellowTitle("Commands"), this.#lineBreak())

			for (const tableCmd of tables) {
				const TWO_TABS = 4
				message.push(`${this.#tab()}${this.#tab()}${this.#OUTPUT_STYLER.bold(tableCmd.cmd)}`)
				message.push(`${this.#tab()}${this.#tab()}${this.#OUTPUT_STYLER.dim(tableCmd.description)}`)
				if (tableCmd.note) {
					message.push(
						`${this.#tab()}${this.#tab()}${this.#OUTPUT_STYLER.bold(this.#OUTPUT_STYLER.dim(`** NOTE ** ${tableCmd.note}`))}`
					)
				}
				if (tableCmd.flags) {
					message.push(this.#lineBreak())
					const padding = calculateTablePadding(tableCmd.flags) + TWO_TABS
					message.push(`${this.#tab()}${this.#tab()}${whiteTitle("Flags")}`)
					message.push(this.#lineBreak(), table(tableCmd.flags, { padding }))
				}
				message.push(this.#lineBreak())
				message.push(this.#lineBreak())
			}
		}

		if (description) {
			message.push(this.#lineBreak(), `${description}`)
		}

		message.push(this.#lineBreak(), this.#blockSeparation())

		console.info(`${message.join("\n")}\n`)
	}

	showInfo({ message }: { message: string }): void {
		const output: string[] = []
		output.push(this.#lineBreak(), `${this.#OUTPUT_STYLER.dim(message)}`)
		console.info(`${output.join("\n")}\n`)
	}

	showSuccessSummary({ message, description, parsed, generated, duration, dir }: SuccessDisplayPayload): void {
		const output: string[] = []

		if (message) {
			output.push(this.#lineBreak(), `${this.#OUTPUT_STYLER.bold(this.#OUTPUT_STYLER.bgGreen(` ${message} `))}`)
		}

		if (description) {
			output.push(this.#lineBreak(), `${this.#OUTPUT_STYLER.green(`${this.#tabWithArrow()}${description}`)}`)
		}

		if (parsed) {
			output.push(
				this.#lineBreak(),
				`${this.#OUTPUT_STYLER.bold(this.#OUTPUT_STYLER.bgGreen(` PARSED FILES: ${parsed} `))}`
			)
		}

		if (generated) {
			output.push(
				this.#lineBreak(),
				`${this.#OUTPUT_STYLER.bold(this.#OUTPUT_STYLER.bgGreen(` GENERATED FILES: ${generated} `))}`
			)
		}

		if (duration) {
			output.push(
				this.#lineBreak(),
				`${this.#OUTPUT_STYLER.bold(this.#OUTPUT_STYLER.bgGreen(` DURATION: ${duration} ms `))}`
			)
		}

		if (dir) {
			output.push(
				this.#lineBreak(),
				`${this.#OUTPUT_STYLER.green(`${this.#tabWithArrow()}`)}${this.#OUTPUT_STYLER.bgGreen(" DIR: ")} ${this.#OUTPUT_STYLER.bold(this.#OUTPUT_STYLER.green(dir))}`
			)
		}

		console.info(`${output.join("\n")}\n`)
	}

	showError({ message, description, sourceFiles, ranges }: ErrorDisplayPayload): void {
		const output: string[] = []

		output.push(this.#lineBreak(), `${this.#OUTPUT_STYLER.bold(this.#OUTPUT_STYLER.bgRed(` ERROR: ${message} `))}`)

		if (description) {
			output.push(this.#lineBreak(), `${this.#OUTPUT_STYLER.red(`${this.#tabWithArrow()}${description}`)}`)
		}

		if (sourceFiles) {
			for (const [index, sourceFile] of sourceFiles.entries()) {
				const currentRange = ranges?.at(index)
				if (currentRange) {
					output.push(
						this.#lineBreak(),
						`${this.#OUTPUT_STYLER.red(this.#tabWithArrow())}${this.#OUTPUT_STYLER.bgRed(" FILE: ")} ${this.#OUTPUT_STYLER.bold(
							`${this.#OUTPUT_STYLER.red(sourceFile)}:${this.#OUTPUT_STYLER.yellow(
								`${currentRange.start.line}:${currentRange.start.column}`
							)}`
						)}`
					)
				} else {
					output.push(
						this.#lineBreak(),
						`${this.#OUTPUT_STYLER.red(`${this.#tabWithArrow()}`)}${this.#OUTPUT_STYLER.bgRed(" FILE: ")} ${this.#OUTPUT_STYLER.bold(this.#OUTPUT_STYLER.red(sourceFile))}`
					)
				}
			}
		}

		output.push(this.#lineBreak(), this.#blockSeparation(true))
		const stringOutput = output.join("\n")

		console.info(`${stringOutput}\n`)
	}

	showDiag({ message, range, sourceFile }: Diagnostic): void {
		const output: string[] = []

		output.push(
			this.#lineBreak(),
			`${this.#OUTPUT_STYLER.bold(this.#OUTPUT_STYLER.red(sourceFile))}:${this.#OUTPUT_STYLER.yellow(`${range.start.line}:${range.start.column}`)}`,
			this.#lineBreak(),
			this.#OUTPUT_STYLER.red(`${this.#tabWithArrow()}${message}`)
		)

		console.info(`${output.join("\n")}\n`)
	}

	showDiagSummary(numOfErrors: number): void {
		if (numOfErrors === 0) return

		const output: string[] = []
		const errorCountSuffix = numOfErrors > 1 ? "s" : ""
		output.push(this.#lineBreak(), `${this.#OUTPUT_STYLER.red(`Found ${numOfErrors} error${errorCountSuffix}.`)}`)

		output.push(this.#lineBreak(), this.#blockSeparation(true))

		console.info(`${output.join("\n")}\n`)
	}

	clear(): void {
		process.stdout.write("\x1Bc")
	}

	//* ---------- Helpers -----------------------------------------------

	readonly #lineBreak = (): string => ""
	readonly #tab = (): string => "  "
	readonly #tabWithArrow = (): string => "  → "
	readonly #blockSeparation = (isError?: true): string => {
		const SEPARATOR = "------------------------------------------------------------"
		if (isError) return this.#OUTPUT_STYLER.red(SEPARATOR)

		return this.#OUTPUT_STYLER.dim(SEPARATOR)
	}
}
