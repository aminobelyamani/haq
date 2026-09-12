//#region -------------------------------------------------- Type Imports

import type { CLI_EnvFlags, I_OutputStyler } from "./_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import path from "node:path"
import process from "node:process"
import dotenv from "dotenv"
import { GLOBALS } from "../globals.js"
import { HAQError } from "./_shared/errors.js"
import { filePathExistsOrThrow, loadFile } from "./_shared/fs.js"
import { HAQLogger } from "./_shared/logger.js"
import { formatAndWrite } from "./_shared/output.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_env = {
	outputStyler: I_OutputStyler
	flags: CLI_EnvFlags
}
export function env({ outputStyler, flags }: ARGS_env): void {
	const Logger = new HAQLogger(outputStyler)
	const currentDir = process.cwd()

	// validation

	if (!(flags.i || flags.input)) {
		throw new HAQError({
			message: "Missing input flag.",
			description: "You must specify the input path to your .env file"
		})
	}

	if (!(flags.o || flags.output)) {
		throw new HAQError({
			message: "Missing output flag.",
			description: "You must specify the output path to your .env file"
		})
	}

	const inputFlag = flags.i || (flags.input as string) // one of them will be valid
	const outputFlag = flags.o || (flags.output as string) // one of them will be valid

	const envFile = path.join(currentDir, inputFlag)
	const outDir = path.join(currentDir, outputFlag)

	filePathExistsOrThrow({
		filePath: envFile,
		kind: "env file",
		description:
			"Make sure your input flag is a valid path relative to your project root and there is an existing .env file. "
	})

	filePathExistsOrThrow({
		filePath: outDir,
		kind: "output dir",
		description: "Make sure your output flag points to an existing dir in your project."
	})

	// generation

	_gen()

	//* ---------- Helpers -----------------------------------------------

	function _gen(): void {
		Logger.showInfo({ message: "Generating env types and schema..." })

		const startPerformanceTime = performance.now()

		const fileContents = loadFile(envFile)

		const buf = Buffer.from(fileContents)
		const envData = dotenv.parse(buf)

		const DEFAULT_NODE_ENV_TYPE_LITERALS = `"development" | "production" | "test"`
		const DEFAULT_NODE_ENV_ZOD_LITERALS = `z.literal("development").or(z.literal("production")).or(z.literal("test"))`

		const modesFlag = flags.m || flags.modes

		let generatedTypes = modesFlag
			? `NODE_ENV: ${_genCustomEnvModeTypes(modesFlag.split(","))}\n`
			: `NODE_ENV : ${DEFAULT_NODE_ENV_TYPE_LITERALS}\n`

		let generatedZodObject = modesFlag
			? `NODE_ENV: ${_genCustomEnvModeZodObj(modesFlag.split(","))},\n`
			: `NODE_ENV: ${DEFAULT_NODE_ENV_ZOD_LITERALS},\n`

		for (const [key, value] of Object.entries(envData)) {
			if (key === "NODE_ENV") continue
			if (key === "PORT") {
				generatedTypes += `${key} : \`\${number}\`\n`
			} else {
				generatedTypes += `${key} : \`${value}\`\n`
			}
			generatedZodObject += `${key} : z.string(),\n`
		}

		const envTypes = _injectTypesInScaffold(generatedTypes)
		const zodObj = _injectObjInScaffold(generatedZodObject)

		// format output

		formatAndWrite({
			outDir,
			filePath: `${outDir}/${GLOBALS.HAQ_ENV_ZOD_OBJ_FILE_NAME}`,
			content: zodObj
		})

		formatAndWrite({
			outDir,
			filePath: `${outDir}/${GLOBALS.HAQ_ENV_TYPES_FILE_NAME}`,
			content: envTypes
		})

		// log result

		const endPerformanceTime = performance.now()

		Logger.showSuccessSummary({
			message: "Generated env types and schema successfully.",
			duration: Math.round(endPerformanceTime - startPerformanceTime)
		})
	}

	function _genCustomEnvModeTypes(modes: string[]): string {
		return modes.map((m) => `"${m}"`).join(GLOBALS.PIPE_CHAR)
	}

	function _genCustomEnvModeZodObj(modes: string[]): string {
		let output = ""
		for (const [index, mode] of modes.entries()) {
			if (index === 0) {
				output += `z.literal("${mode}")`
				continue
			}
			output += `.or(z.literal("${mode}"))`
		}
		return output
	}

	function _injectTypesInScaffold(types: string): string {
		return `
    /*******************************************************************************
     *
     * NOTE: Do not commit or publish this file to a public repository.
     * Treat it like a .env file and is only meant to be used locally.
     *
     ******************************************************************************/
    \n\n
        export type HAQ_ENV = {
                ${types}
            }`
	}

	function _injectObjInScaffold(obj: string): string {
		return `
        import { z } from "zod"
        export const envSchema = z.object({
            ${obj}
        })`
	}
}
