//#region -------------------------------------------------- Type Imports

import type { CLI_WebCFlags, I_OutputStyler } from "../_shared/types.js"
import type { JSON_Schema } from "../_shared/validation.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { GLOBALS } from "../../globals.js"
import { HAQError } from "../_shared/errors.js"
import { filePathExistsOrThrow } from "../_shared/fs.js"
import { HAQLogger } from "../_shared/logger.js"
import { formatAndWrite } from "../_shared/output.js"
import { kebab2Pascal } from "../_shared/strings.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_ce = {
	outputStyler: I_OutputStyler
	flags: CLI_WebCFlags
}

export function ce({ outputStyler, flags }: ARGS_ce): void {
	const Logger = new HAQLogger(outputStyler)
	const currentDir = process.cwd()

	// validation

	if (!(flags.t || flags.tag)) {
		throw new HAQError({
			message: "Missing tag flag.",
			description: "You must specify a tag name for your custom element."
		})
	}

	if (!(flags.o || flags.output)) {
		throw new HAQError({
			message: "Missing output flag.",
			description: "You must specify the output path to where your custom element will live."
		})
	}

	const tagName = flags.t || (flags.tag as string) // one of them will be valid
	const outputFlag = flags.o || (flags.output as string) // one of them will be valid

	if (!tagName.match(GLOBALS.REGEX_HTML_CUSTOM_ELEMENT)) {
		throw new HAQError({
			message: "Invalid tag name.",
			description: "Tag name must be in lowercase and must have at least one hyphen."
		})
	}

	const outDir = path.join(currentDir, outputFlag)

	filePathExistsOrThrow({
		filePath: outDir,
		kind: "output dir",
		description: "Make sure your output flag points to an existing dir in your project."
	})

	// generation

	const pascalName = kebab2Pascal(tagName)
	const componentDir = `${outDir}/${pascalName}`
	_gen()

	// log success

	Logger.showSuccessSummary({
		message: `Generated custom element directory "${pascalName}" successfully.`,
		dir: componentDir
	})

	//* ---------- Helpers -----------------------------------------------

	function _gen(): void {
		Logger.showInfo({ message: "Generating custom element dir..." })

		if (fs.existsSync(componentDir)) {
			throw new HAQError({
				message: "Duplicate directory.",
				description: `${pascalName} already exists. Please choose another output dir or rename the directory.`,
				sourceFiles: [componentDir]
			})
		}

		const astroContent = `
            ---
            import type { HTMLAttributes } from "astro/types";
            type T = HTMLAttributes<"${tagName}">;

            import "./${pascalName}.css"

            interface Props {}
            const {...attrs} = Astro.props

            ---
            <${tagName} x_haq>
                <!-- Your markup here  -->
            </${tagName}>\n`

		const cssContent = `${tagName} {}`

		const jsonContent: JSON_Schema = {
			"custom-elements": [
				{
					tag: `${tagName}`
				}
			]
		}

		fs.mkdirSync(componentDir)

		formatAndWrite({
			outDir: componentDir,
			filePath: `${componentDir}/${pascalName}.astro`,
			content: astroContent
		})

		formatAndWrite({
			outDir: componentDir,
			filePath: `${componentDir}/${pascalName}.css`,
			content: cssContent
		})

		formatAndWrite({
			outDir: componentDir,
			filePath: `${componentDir}/${pascalName}.haq.json`,
			content: JSON.stringify(jsonContent)
		})
	}
}
