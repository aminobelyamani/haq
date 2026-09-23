//#region -------------------------------------------------- Type Imports

// NOTE: We export this as a hack so that jsr includes this package during publishing
export type { Bool } from "@biomejs/wasm-nodejs"

import type { I_OutputStyler } from "./types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import fs from "node:fs"
import { Biome } from "@biomejs/js-api/nodejs"
import colors from "piccolore"

//#endregion ----------------------------------------------- Module Imports

//------------------------------------------------------------------------------
//
// CLI Formatting
//
//------------------------------------------------------------------------------

export const outputStyler: I_OutputStyler = colors

//------------------------------------------------------------------------------
//
// Biome Formatting
//
//------------------------------------------------------------------------------

type ARGS_formatAndWrite = {
	outDir: string
	filePath: string
	content: string
}

export function formatAndWrite({ outDir, filePath, content }: ARGS_formatAndWrite): void {
	const formattedContent = formatWithBiome({ outDir, filePath, content })
	fs.writeFileSync(filePath, formattedContent)
}

function formatWithBiome({ outDir, filePath, content }: ARGS_formatAndWrite): string {
	const biome = new Biome()
	const { projectKey } = biome.openProject(outDir)

	biome.applyConfiguration(projectKey, {
		javascript: {
			formatter: {
				semicolons: "asNeeded",
				trailingCommas: "none",
				lineWidth: 120
			}
		},
		json: {
			parser: {
				allowTrailingCommas: true,
				allowComments: true
			},
			formatter: {
				trailingCommas: "none",
				lineWidth: 120
			}
		},
		html: {
			experimentalFullSupportEnabled: true
		}
	})

	const result = biome.formatContent(projectKey, content, {
		filePath
	})

	return result.content
}
