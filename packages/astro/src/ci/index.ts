#!/usr/bin/env node

//#region -------------------------------------------------- Type Imports

import type { CI_Flag } from "../cli/_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import process from "node:process"
import { stringArray } from "@haq/utils"
import yargs from "yargs-parser"
import { HAQError } from "../cli/_shared/errors.js"
import { outputStyler } from "../cli/_shared/output.js"

//#endregion ----------------------------------------------- Module Imports

if (import.meta.main) {
	main(process.argv).catch(() => process.exit(1))
}

async function main(argv: string[]): Promise<void> {
	try {
		const flags = yargs(argv)
		const flag = resolveCommand(flags)
		const { versions } = await import("./versions.js")
		const newVersion = await versions(flag)
		console.info(newVersion)
	} catch (err) {
		const { handleError } = await import("../cli/_shared/errors.js")
		handleError({ err, outputStyler })
	}
}

function resolveCommand(flags: yargs.Arguments): CI_Flag {
	const flag = flags._[2] as CI_Flag

	const allFlags = stringArray<CI_Flag>()(["astro", "astro-ssr", "language-server"])
	const validFlags: Set<CI_Flag> = new Set(allFlags)

	if (validFlags.has(flag)) {
		return flag
	}
	throw new HAQError({ message: `Invalid flag: ${flag}` })
}
