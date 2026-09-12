//#region -------------------------------------------------- Type Imports

import type { CLI_AppCFlags, I_OutputStyler } from "./_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { GLOBALS } from "../globals.js"
import { HAQError } from "./_shared/errors.js"
import { filePathExistsOrThrow } from "./_shared/fs.js"
import { HAQLogger } from "./_shared/logger.js"
import { formatAndWrite } from "./_shared/output.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_appc = {
	outputStyler: I_OutputStyler
	flags: CLI_AppCFlags
}

export function appc({ outputStyler, flags }: ARGS_appc): void {
	const Logger = new HAQLogger(outputStyler)
	const currentDir = process.cwd()

	// validation

	if (!(flags.n || flags.name)) {
		throw new HAQError({
			message: "Missing App Component name flag.",
			description: "You must specify a name for your App Component."
		})
	}

	if (!(flags.o || flags.output)) {
		throw new HAQError({
			message: "Missing output flag.",
			description: "You must specify the output path to where your App Component will live."
		})
	}

	const componentName = flags.n || (flags.name as string) // one of them will be valid
	const outputFlag = flags.o || (flags.output as string) // one of them will be valid

	if (!componentName.match(GLOBALS.REGEX_NO_SPACES)) {
		throw new HAQError({
			message: "Invalid App Component name.",
			description: "App Component name cannot have spaces."
		})
	}

	const outDir = path.join(currentDir, outputFlag)

	filePathExistsOrThrow({
		filePath: outDir,
		kind: "output dir",
		description: "Make sure your output flag points to an existing dir in your project."
	})

	// generation

	const componentDir = `${outDir}/${componentName}`
	_gen()

	// log success

	Logger.showSuccessSummary({
		message: `Generated App Component directory "${componentName}" successfully.`,
		dir: componentDir
	})

	//* ---------- Helpers -----------------------------------------------

	function _gen(): void {
		Logger.showInfo({ message: "Generating App Component dir..." })

		if (fs.existsSync(componentDir)) {
			throw new HAQError({
				message: "Duplicate directory.",
				description: `${componentName} already exists. Please choose another output dir or rename the directory.`,
				sourceFiles: [componentDir]
			})
		}

		const astroContent = `
            ---
            import type { HAQ_AliasableComponentProps } from "@haq/astro"

            interface Props extends Pick<HAQ_AliasableComponentProps, "x_appc"> {}

            ---`

		const tsContent = `
            //#region -------------------------------------------------- Type Imports

            import type { HAQ_CustomEvent, HAQ_Event, HAQ_FlattenChildren } from "@haq/astro"

            type T = MU_${componentName} // the generated App Component markup type

            // your defined app events
            type E = {
                "some-event": undefined
            }

            type X = HAQ_FlattenChildren<T>

            //#endregion ----------------------------------------------- Type Imports

            //#region -------------------------------------------------- Module Imports

            import { AppComponent } from "@haq/astro"
            import { assertUnreachable } from "@haq/utils"

            //#endregion ----------------------------------------------- Module Imports

            export class ${componentName} extends AppComponent<T, E>() {
                // initialize your dom variables
                readonly #Button = this.querySelector("button")

                constructor() {
                    super(""); // id attribute of Component

                    // add native event listeners
                    // add custom event listeners
                    // other setup
                    // safe to invoke methods of child WebComponents, DOM is fully loaded at this point
                }

                override destructor(): void {
               		// remove global listeners here (document, window ...)
                 	// removing global listeners here avoids unexpected behavior when using Astro's view transitions
                	// If Astro's transition:persist directive is used on this App Component
                 	// You should remove any other listeners as well to avoid unexpected behavior
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
            }`

		fs.mkdirSync(componentDir)

		formatAndWrite({
			outDir: componentDir,
			filePath: `${componentDir}/${componentName}.astro`,
			content: astroContent
		})

		formatAndWrite({
			outDir: componentDir,
			filePath: `${componentDir}/${componentName}.ts`,
			content: tsContent
		})
	}
}
