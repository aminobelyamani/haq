//#region -------------------------------------------------- Type Imports

import type { CI_Flags, CI_PackageJson, CI_SubCommand } from "../cli/_shared/types.js"

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import fs from "node:fs"
import { copyFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { HAQError } from "../cli/_shared/errors.js"
import { loadJsonFile } from "../cli/_shared/fs.js"
import { formatAndWrite } from "../cli/_shared/output.js"
import { GLOBALS } from "../globals.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_versions = {
	command: CI_SubCommand
	flags: CI_Flags
}
export async function versions({ command, flags }: ARGS_versions): Promise<string> {
	// validation

	if (!(flags.d || flags.dir)) {
		throw new HAQError({
			message: "Missing dir  flag.",
			description: "You must specify a dir for the package."
		})
	}

	const dir = flags.d || (flags.dir as string) // one of them will be valid
	const rootDir = process.cwd()
	const currentDir = path.join(rootDir, dir)

	const packageJsonPath = `${currentDir}/package.json`
	const jsrJsonPath = `${currentDir}/jsr.json`

	// copy package.json -> package-temp.json

	await copyFile(new URL(packageJsonPath, import.meta.url), `${currentDir}/package-temp.json`)

	// load current package.json

	const packageJson = (await loadJsonFile(packageJsonPath)) as CI_PackageJson

	if (command === "astro" || command === "astro-ssr") {
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

	if (command === "astro") {
		const globalsPath = `${currentDir}/src/cli/_shared/version.ts`
		const newVersionContent = `export const PACKAGE_VERSION = "${packageJson.version}"`

		formatAndWrite({ outDir: `${currentDir}/src/cli/_shared`, content: newVersionContent, filePath: globalsPath })

		const versionFilePath = `${currentDir}/_static/${GLOBALS.VERSION_TXT_FILE_NAME}`
		fs.writeFileSync(versionFilePath, packageJson.version)
	}

	// update jsr.json

	const jsrJson = (await loadJsonFile(jsrJsonPath)) as Pick<CI_PackageJson, "version">
	jsrJson.version = packageJson.version
	formatAndWrite({ outDir: currentDir, content: JSON.stringify(jsrJson), filePath: jsrJsonPath })

	return packageJson.version
}
