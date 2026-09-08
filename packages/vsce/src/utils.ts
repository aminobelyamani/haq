//#region -------------------------------------------------- Type Imports

import type { HAQ_CursorPos } from "@haq/astro/types"
import type * as vscode from "vscode"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { readFileSync } from "node:fs"
import { GLOBALS } from "@haq/astro/tools"

//#endregion ----------------------------------------------- Module Imports

export function isAstroFile(document: vscode.TextDocument): RegExpMatchArray | null {
	const astroRegexp = new RegExp(GLOBALS.REGEX_ASTRO_EXTENSION)
	return document.fileName.match(astroRegexp)
}

export function isCSSFile(document: vscode.TextDocument): RegExpMatchArray | null {
	const cssRegexp = new RegExp(GLOBALS.REGEX_CSS_EXTENSION)
	return document.fileName.match(cssRegexp)
}

export function loadFile(url: string): Buffer | null {
	try {
		return readFileSync(url)
	} catch (err) {
		if (err) {
			console.error(err)
		}
		return null
	}
}

export function get1BasedIndexPosition(position: vscode.Position): Pick<HAQ_CursorPos, "col" | "line"> {
	return {
		line: position.line + 1,
		col: position.character + 1
	}
}
