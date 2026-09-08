//#region -------------------------------------------------- Type Imports

import type { Diagnostic } from "./types"

//#endregion ----------------------------------------------- Type Imports

export function sameDiagRanges(range1: Diagnostic["range"], range2: Diagnostic["range"]): boolean {
	const startIsSame = range1.start.column === range2.start.column && range1.start.line === range2.start.line
	const endIsSame = range1.end.column === range2.end.column && range1.end.line === range2.end.line
	return startIsSame && endIsSame
}
