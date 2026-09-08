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

type ARGS_webc = {
	outputStyler: I_OutputStyler
	flags: CLI_WebCFlags
}

export function webc({ outputStyler, flags }: ARGS_webc): void {
	const Logger = new HAQLogger(outputStyler)
	const currentDir = process.cwd()

	// validation

	if (!(flags.t || flags.tag)) {
		throw new HAQError({
			message: "Missing tag flag.",
			description: "You must specify a tag name for your WebComponent."
		})
	}

	if (!(flags.o || flags.output)) {
		throw new HAQError({
			message: "Missing output flag.",
			description: "You must specify the output path to where your WebComponent will live."
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
		message: `Generated WebComponent directory "${pascalName}" successfully.`,
		dir: componentDir
	})

	//* ---------- Helpers -----------------------------------------------

	function _gen(): void {
		Logger.showInfo({ message: "Generating WebComponent dir..." })

		if (fs.existsSync(componentDir)) {
			throw new HAQError({
				message: "Duplicate directory.",
				description: `${pascalName} already exists. Please choose another output dir or rename the directory.`,
				sourceFiles: [componentDir]
			})
		}

		const astroContent = `
            ---
            import type { HAQ_AliasableComponentProps } from "@haq/astro"
            import type { HTMLAttributes } from "astro/types";
            type T = HTMLAttributes<"${tagName}">;

            import "./${pascalName}.css"

            interface Props extends Pick<HAQ_AliasableComponentProps, "x_alias"> {}
            const {...attrs} = Astro.props

            ---
            <${tagName} x_webc>
                <!-- Your Web Component markup here  -->
            </${tagName}>\n
            <script>
                import "./${pascalName}"
            </script>`

		const cssContent = `${tagName} {}`

		const jsonContent: JSON_Schema = {
			"custom-elements": [
				{
					tag: `${tagName}`
				}
			]
		}

		const tsContent = `
            //#region -------------------------------------------------- Type Imports

            import type { HAQ_CustomEvent, HAQ_Event, HAQ_FlattenChildren } from "@haq/astro"

            type T = MU_${pascalName} // the generated Web Component markup type

            // your defined custom events
            type E = {
                "${tagName}:some-event": undefined
            }

            type X = FlattenChildren<T>

            //#endregion ----------------------------------------------- Type Imports

            //#region -------------------------------------------------- Module Imports

            import { defineWebComponent, WebComponent } from "@haq/astro"
            import { assertUnreachable } from "@haq/utils"

            //#endregion ----------------------------------------------- Module Imports

            export class ${pascalName} extends WebComponent<T, E>() {
                // initialize your dom variables
                readonly #Button = this.querySelector("button")

                constructor() {
                    super();

                    // add native event listeners
                    // add custom event listeners
                    // other setup
                    // NOTE: Do not invoke any methods of child WebComponents. They might not be loaded yet in the DOM.
                }

                disconnectedCallback(): void {
                    // remove global listeners here (document, window ...)
                    // removing global listeners here avoids unexpected behavior when using Astro's view transitions
                }

                //* ---------- Exposed Methods -----------------------------------------------

                //* ---------- Listeners ----------------------------------------------------

                handleEvent(e:HAQ_Event<T>):void{
                	const type = e.type
                    switch (type) {
			            case "click": {
                            // do stuff
                            break
                        }

			            default:
				            assertUnreachable(type)
		                }
                }
            }

            defineWebComponent(${pascalName}, '${tagName}');`

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
			filePath: `${componentDir}/${pascalName}.ts`,
			content: tsContent
		})

		formatAndWrite({
			outDir: componentDir,
			filePath: `${componentDir}/${pascalName}.haq.json`,
			content: JSON.stringify(jsonContent)
		})
	}
}
