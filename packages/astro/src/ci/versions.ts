//#region -------------------------------------------------- Type Imports

import type { CI_Flag, CI_PackageJson } from "../cli/_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { copyFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { loadJsonFile } from "../cli/_shared/fs.js"
import { formatAndWrite } from "../cli/_shared/output.js"

//#endregion ----------------------------------------------- Module Imports

export async function versions(flag: CI_Flag): Promise<string> {
	const currentDir = process.cwd()
	const packageJsonPath = `${currentDir}/package.json`
	const jsrJsonPath = `${currentDir}/jsr.json`

	// copy package.json -> package-temp.json

	await copyFile(new URL(packageJsonPath, import.meta.url), `${currentDir}/package-temp.json`)

	// load current package.json

	const packageJson = (await loadJsonFile(packageJsonPath)) as CI_PackageJson

	if (flag === "astro" || flag === "astro-ssr") {
		// update utils version for @haq/astro & @haq/astro-ssr

		const utilsPackageJsonPath = path.join(currentDir, "../utils/package.json")
		const utilsPackageJson = (await loadJsonFile(utilsPackageJsonPath)) as CI_PackageJson
		const currentUtilsVersion = utilsPackageJson.version
		packageJson.dependencies["@haq/utils"] = `npm:@jsr/haq__utils@^${currentUtilsVersion}`
	} else {
		// update @haq/astro version for @haq/language-server

		const haqAstroPackageJsonPath = path.join(currentDir, "../astro/package.json")
		const haqAstroPackageJson = (await loadJsonFile(haqAstroPackageJsonPath)) as CI_PackageJson
		const currentHaqAstroVersion = haqAstroPackageJson.version
		packageJson.dependencies["@haq/astro"] = `npm:@jsr/haq__astro@^${currentHaqAstroVersion}`
	}

	// rewrite package.json

	formatAndWrite({ outDir: currentDir, content: JSON.stringify(packageJson), filePath: packageJsonPath })

	// update @haq/astro version global variable

	if (flag === "astro") {
		const globalsPath = `${currentDir}/src/cli/_shared/version.ts`
		const newVersionContent = `export const PACKAGE_VERSION = "${packageJson.version}"`

		formatAndWrite({ outDir: `${currentDir}/src/cli/_shared`, content: newVersionContent, filePath: globalsPath })
	}

	// update jsr.json

	const jsrJson = (await loadJsonFile(jsrJsonPath)) as Pick<CI_PackageJson, "version">
	jsrJson.version = packageJson.version
	formatAndWrite({ outDir: currentDir, content: JSON.stringify(jsrJson), filePath: jsrJsonPath })

	return packageJson.version
}
