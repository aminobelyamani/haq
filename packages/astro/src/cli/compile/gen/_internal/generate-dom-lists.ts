// //#region -------------------------------------------------- Type Imports

// import type { JSON_Attribute, JSON_CustomElement } from "../../_shared/validation.js"

// //#endregion ----------------------------------------------- Type Imports

// //#region -------------------------------------------------- Module Imports

// import fs from "node:fs"
// import process from "node:process"
// import ts from "typescript"
// import { GLOBALS } from "../../../globals.js"

// //#endregion ----------------------------------------------- Module Imports

// function generateDOMLists(): void {
// 	const astroTypeDeclarationFilePath =
// 		"node_modules/.pnpm/astro@5.18.0_@types+node@25.3.2_rollup@4.59.0_typescript@5.9.3_yaml@2.8.2/node_modules/astro/astro-jsx.d.ts"

// 	const generatedAttributes = generateNativeAttributes({ fileName: astroTypeDeclarationFilePath })

// 	addTemplateAttributes(generatedAttributes)
// 	fs.writeFileSync(
// 		`${process.cwd()}/${GLOBALS.INTERNAL_GENERATED_TYPES_FOLDER}/${GLOBALS.NATIVE_ELEMENTS_JSON_FILE_NAME}`,
// 		JSON.stringify(generatedAttributes)
// 	)
// }

// function addTemplateAttributes(result: JSON_CustomElement[]): void {
// 	result.push({
// 		tag: "template"
// 	})
// }

// type GenerateNativeAttributesArgs = {
// 	fileName: string
// }

// function generateNativeAttributes({ fileName }: GenerateNativeAttributesArgs): JSON_CustomElement[] {
// 	const program = ts.createProgram([fileName], {})
// 	const sourceFile = program.getSourceFile(fileName)
// 	const typeChecker = program.getTypeChecker()

// 	const result: JSON_CustomElement[] = []
// 	function visit(node: ts.Node): void {
// 		if (ts.isInterfaceDeclaration(node) && node.name.text === "DefinedIntrinsicElements") {
// 			for (const member of node.members) {
// 				addAttributesFromTagType({ result, typeChecker, member })
// 			}
// 		} else {
// 			ts.forEachChild(node, visit)
// 		}
// 	}

// 	if (sourceFile) {
// 		ts.forEachChild(sourceFile, visit)
// 	}
// 	return result
// }

// type AddAttributesArgs = {
// 	member: ts.TypeElement
// 	typeChecker: ts.TypeChecker
// 	result: JSON_CustomElement[]
// }

// function addAttributesFromTagType({ result, member, typeChecker }: AddAttributesArgs): void {
// 	const name = member.name
// 	const isValidName = name && (ts.isStringLiteral(name) || ts.isIdentifier(name))

// 	if (!isValidName) return

// 	const type = typeChecker.getTypeAtLocation(member)
// 	const serializedType = serializeType({ type, typeChecker })

// 	if (typeof serializedType === "string") return
// 	result.push({
// 		tag: name.text,
// 		attrs: serializedType
// 	})
// }

// type SerializeTypeArgs = {
// 	type: ts.Type
// 	typeChecker: ts.TypeChecker
// }

// type SerializeTypeReturn = JSON_Attribute[]

// function serializeType({ type, typeChecker }: SerializeTypeArgs): SerializeTypeReturn {
// 	const interfacesToIgnore = [
// 		"AstroSlotAttributes",
// 		"AstroScriptAttributes",
// 		"AstroDefineVarsAttribute",
// 		"AstroStyleAttributes",
// 		"Iterable",
// 		"Array",
// 		"AstroBuiltinAttributes",
// 		"URL",
// 		"URLSearchParams",
// 		"CSSProperties",
// 		"TransitionDirectionalAnimations",
// 		"TransitionAnimationPair",
// 		"TransitionAnimation"
// 	]
// 	const attributesToIgnore = [
// 		"children",
// 		"transition:animate",
// 		"transition:name",
// 		"transition:persist",
// 		"class:list",
// 		"set:html",
// 		"set:text",
// 		"is:raw"
// 	]
// 	if (type.isIntersection()) {
// 		return type.types.map((t) => serializeType({ type: t, typeChecker })) as unknown as SerializeTypeReturn
// 	}
// 	if (type.isUnion()) {
// 		return type.types.map((t) => serializeType({ type: t, typeChecker })) as unknown as SerializeTypeReturn
// 	}

// 	if (type.isClassOrInterface() && !interfacesToIgnore.includes(type.symbol.getName())) {
// 		const properties: JSON_CustomElement["attrs"] = []
// 		for (const symbol of type.getProperties()) {
// 			if (
// 				!symbol.valueDeclaration ||
// 				attributesToIgnore.includes(symbol.getName()) ||
// 				symbol.getName().startsWith("on")
// 			)
// 				continue
// 			const propertyType = typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)
// 			properties.push({
// 				name: symbol.getName(),
// 				value: serializeType({ type: propertyType, typeChecker }) as unknown as JSON_Attribute["value"]
// 			})
// 		}

// 		return cleanUpTypeValues(properties)
// 	}

// 	const typeStringValue = typeChecker.typeToString(type).replaceAll('"', "")
// 	return typeStringValue as unknown as SerializeTypeReturn
// }

// function cleanUpTypeValues(properties: JSON_Attribute[]): JSON_Attribute[] {
// 	const booleanValues = ["true", "false"]
// 	for (const property of properties) {
// 		if (!Array.isArray(property.value)) continue
// 		const indexOfStringLiteral = property.value.indexOf("string")
// 		if (property.value.length === 0 || property.value.some((v) => booleanValues.includes(v))) {
// 			// biome-ignore lint/performance/noDelete: We don't want to clutter the output with undefined, so we use delete to remove the property
// 			delete property.value
// 			continue
// 		}
// 		if (indexOfStringLiteral >= 0) {
// 			property.value = "string"
// 			continue
// 		}
// 		cleanUpArrayValues(property.value)

// 		if (property.value.length === 0) {
// 			// biome-ignore lint/performance/noDelete: We don't want to clutter the output with undefined, so we use delete to remove the property
// 			delete property.value
// 		}
// 	}
// 	return properties
// }

// function cleanUpArrayValues(values: string[]): void {
// 	for (const [index, value] of values.entries()) {
// 		if (Array.isArray(value) || value === "") {
// 			values.splice(index)
// 		}
// 	}
// }

// generateDOMLists()
