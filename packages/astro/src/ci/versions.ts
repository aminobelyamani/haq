//#region -------------------------------------------------- Type Imports

import type { CI_Flag, CI_PackageJson } from "../cli/_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { copyFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { loadJSONFile } from "../cli/_shared/fs.js"
import { formatAndWrite } from "../cli/_shared/output.js"

//#endregion ----------------------------------------------- Module Imports

export async function versions(flag: CI_Flag): Promise<string> {
	const currentDir = process.cwd()
	const packageJsonPath = `${currentDir}/package.json`
	const jsrJsonPath = `${currentDir}/jsr.json`

	// copy package.json -> package-temp.json

	await copyFile(new URL(packageJsonPath, import.meta.url), `${currentDir}/package-temp.json`)

	// load current package.json

	const packageJson = (await loadJSONFile(packageJsonPath)) as CI_PackageJson

	// update utils version

	const utilsPackageJsonPath = path.join(currentDir, "../utils/package.json")
	const utilsPackageJson = (await loadJSONFile(utilsPackageJsonPath)) as CI_PackageJson
	const currentUtilsVersion = utilsPackageJson.version
	packageJson.dependencies["@haq/utils"] = `npm:@jsr/haq__utils@^${currentUtilsVersion}`

	// rewrite package.json

	formatAndWrite({ outDir: currentDir, content: JSON.stringify(packageJson), filePath: packageJsonPath })

	// update @haq/astro version global variable

	if (flag === "astro") {
		const globalsPath = `${currentDir}/src/cli/_shared/version.ts`
		const newVersionContent = `export const PACKAGE_VERSION = "${packageJson.version}"`

		formatAndWrite({ outDir: `${currentDir}/src/cli/_shared`, content: newVersionContent, filePath: globalsPath })
	}

	// update jsr.json

	const jsrJson = (await loadJSONFile(jsrJsonPath)) as Pick<CI_PackageJson, "version">
	jsrJson.version = packageJson.version
	formatAndWrite({ outDir: currentDir, content: JSON.stringify(jsrJson), filePath: jsrJsonPath })

	return packageJson.version
}
