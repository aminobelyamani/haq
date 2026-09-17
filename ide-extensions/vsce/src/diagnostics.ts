//#region -------------------------------------------------- Type Imports

import type { I_LSPTools } from "@haq/astro/tools"
import type { Diagnostic, DiagnosticCollection, TextDocument } from "vscode"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { DiagnosticSeverity, Position, Range } from "vscode"

//#endregion ----------------------------------------------- Module Imports

export async function updateDiagnostics(
	LspTools: I_LSPTools,
	document: TextDocument,
	collection: DiagnosticCollection
): Promise<number> {
	const diagnostics = await LspTools.getFileDiagnostics({
		documentText: document.getText(),
		filePath: document.uri.fsPath
	})

	const vsCodeDiagnostics: Diagnostic[] = []
	for (const diag of diagnostics) {
		const { range, message, severity, relatedInformation, ...rest } = diag
		vsCodeDiagnostics.push({
			message: message.toString(),
			severity: DiagnosticSeverity.Error,
			range: new Range(
				new Position(range.start.line, range.start.character),
				new Position(range.end.line, range.end.character)
			),
			...rest
		})
	}
	collection.set(document.uri, vsCodeDiagnostics)
	return vsCodeDiagnostics.length
}
