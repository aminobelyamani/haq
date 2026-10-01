#!/usr/bin/env node

//#region -------------------------------------------------- Type Imports

import type { CI_Flags, CI_SubCommand } from "../cli/_shared/types.js"

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
		const newVersion = await versions({ command: flag, flags: flags as CI_Flags })
		console.info(newVersion)
	} catch (err) {
		const { handleError } = await import("../cli/_shared/errors.js")
		handleError({ err, outputStyler })
	}
}

function resolveCommand(flags: yargs.Arguments): CI_SubCommand {
	const flag = flags._[2] as CI_SubCommand

	const allFlags = stringArray<CI_SubCommand>()(["astro", "astro-ssr", "language-server"])
	const validFlags: Set<CI_SubCommand> = new Set(allFlags)

	if (validFlags.has(flag)) {
		return flag
	}
	throw new HAQError({ message: `Invalid flag: ${flag}` })
}
