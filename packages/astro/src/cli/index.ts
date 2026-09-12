#!/usr/bin/env node

/*******************************************************************************
 *
 * CLI tools for using HAQ.
 *
 * @module
 *
 ******************************************************************************/

//#region -------------------------------------------------- Type Imports

import type {
	CLI_AppCFlags,
	CLI_CompileFlags,
	CLI_EnvFlags,
	CLI_Flags,
	CLI_SubCommand,
	CLI_WebCFlags
} from "./_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import process from "node:process"
import { assertUnreachable, stringArray } from "@haq/utils"
import yargs from "yargs-parser"
import { handleDiag } from "./_shared/errors.js"
import { outputStyler } from "./_shared/output.js"

//#endregion ----------------------------------------------- Module Imports

function resolveCommand(flags: yargs.Arguments): CLI_SubCommand {
	const cmd = flags._[2] as CLI_SubCommand

	const allCommands = stringArray<CLI_SubCommand>()(["help", "init", "compile", "env", "ce", "webc", "appc"])
	const validCommands: Set<CLI_SubCommand> = new Set(allCommands)

	if (validCommands.has(cmd)) {
		return cmd
	}
	return "help"
}

async function runCommand(cmd: CLI_SubCommand, flags: CLI_Flags): Promise<void> {
	switch (cmd) {
		case "help": {
			const { help } = await import("./help.js")
			help({ outputStyler })

			break
		}

		case "init": {
			const { init } = await import("./init.js")
			await init({ outputStyler })

			break
		}

		case "compile": {
			const { compile } = await import("./compile/index.js")
			const { numOfGenErrors } = await compile({ outputStyler, flags: flags as CLI_CompileFlags })
			handleDiag(numOfGenErrors)

			break
		}

		case "env": {
			const { env } = await import("./env.js")
			env({ outputStyler, flags: flags as CLI_EnvFlags })

			break
		}

		case "ce": {
			const { ce } = await import("./ce.js")
			ce({ outputStyler, flags: flags as CLI_WebCFlags })

			break
		}

		case "webc": {
			const { webc } = await import("./webc.js")
			webc({ outputStyler, flags: flags as CLI_WebCFlags })

			break
		}

		case "appc": {
			const { appc } = await import("./appc.js")
			appc({ outputStyler, flags: flags as CLI_AppCFlags })

			break
		}

		default:
			assertUnreachable(cmd)
	}
}

function handleExit(cmd: CLI_SubCommand, flags: CLI_CompileFlags, exitCode: 0 | 1): void {
	const watchMode = flags.w || flags.watch
	if (cmd === "compile" && watchMode) {
		return
	}
	process.exit(exitCode)
}

async function main(argv: string[]): Promise<void> {
	const flags = yargs(argv)
	const cmd = resolveCommand(flags)
	try {
		await runCommand(cmd, flags as CLI_Flags)
		handleExit(cmd, flags as CLI_CompileFlags, 0)
	} catch (err) {
		const { handleError } = await import("./_shared/errors.js")
		handleError({ err, outputStyler })
		handleExit(cmd, flags as CLI_CompileFlags, 1)
	}
}

main(process.argv).catch(() => process.exit(1))
