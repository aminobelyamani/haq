//#region -------------------------------------------------- Module Imports

import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { GLOBALS } from "../../globals.js"
import { HAQError } from "./errors.js"
import { formatDate } from "./strings.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_filePathExistsOrThrow = {
	filePath: string
	kind: string
	message?: string
	description?: string
}
export function filePathExistsOrThrow({ filePath, kind, message, description }: ARGS_filePathExistsOrThrow): void {
	const defaultMessage = `Missing ${kind}.`
	const defaultDescription = `Make sure your ${kind} points to an existing dir in your project.`

	if (!fs.existsSync(filePath)) {
		throw new HAQError({
			message: message ?? defaultMessage,
			description: description ?? defaultDescription,
			sourceFiles: [filePath]
		})
	}
}

export function loadFile(url: string): Buffer<ArrayBuffer> {
	try {
		return fs.readFileSync(url)
	} catch (err) {
		throw new HAQError(
			{
				message: "Reading file failed.",
				sourceFiles: [url]
			},
			{ cause: err }
		)
	}
}

export function loadJsonFile(url: string): unknown {
	try {
		const file = fs.readFileSync(url) as unknown as string
		const parsed = JSON.parse(file)
		return parsed
	} catch (err) {
		throw new HAQError(
			{
				message: "JSON parsing failed.",
				sourceFiles: [url]
			},
			{ cause: err }
		)
	}
}

export function writeLogFile(outDir: string): void {
	fs.writeFileSync(`${outDir}/${GLOBALS.LOG_FILE_NAME}`, `Last updated on -> ${formatDate()}`)
}

export function getAllAstroAndJSONFileNamesInDir(dir: string, files: string[] = []): string[] {
	const fileList = fs.readdirSync(dir, { withFileTypes: true })
	for (const file of fileList) {
		const fullPath = path.join(dir, file.name)
		if (GLOBALS.IGNORABLE_FOLDERS.includes(file.name)) {
			continue
		}
		if (file.isDirectory()) {
			getAllAstroAndJSONFileNamesInDir(fullPath, files)
		} else if (file.isFile() && (fullPath.endsWith(".astro") || fullPath.endsWith(".haq.json"))) {
			files.push(fullPath)
		}
	}
	return files
}

export function getAllCSSFileNamesInDir(dir: string, files: string[] = []): string[] {
	const fileList = fs.readdirSync(dir, { withFileTypes: true })
	for (const file of fileList) {
		const fullPath = path.join(dir, file.name)
		if (GLOBALS.IGNORABLE_FOLDERS.includes(file.name)) {
			continue
		}
		if (file.isDirectory()) {
			getAllCSSFileNamesInDir(fullPath, files)
		} else if (file.isFile() && fullPath.endsWith(".css")) {
			files.push(fullPath)
		}
	}
	return files
}

export function getAstroPages(dir: string, files: string[] = []): string[] {
	const fileList = fs.readdirSync(dir, { withFileTypes: true })
	for (const file of fileList) {
		const fullPath = path.join(dir, file.name)
		if (GLOBALS.IGNORABLE_FOLDERS.includes(file.name)) {
			continue
		}
		if (file.isDirectory()) {
			getAllAstroAndJSONFileNamesInDir(fullPath, files)
		} else if (file.isFile() && fullPath.endsWith(".astro")) {
			files.push(fullPath)
		}
	}
	return files
}

export function getFileNameWithoutExtension(filePath: string): string {
	const astroFileRegex = GLOBALS.REGEX_FILE_NAME
	const matches = path.basename(filePath).match(astroFileRegex)
	const fileNameWithoutExtension = matches?.[1]

	if (!fileNameWithoutExtension)
		throw new HAQError({
			message: "Unable to get astro filename without extension",
			sourceFiles: [filePath]
		})

	return fileNameWithoutExtension
}

export function getRouteFromAstroPage(filePath: string): string | undefined {
	const cleanFilePath = filePath
		.replace(".astro", "")
		.replace(GLOBALS.REGEX_ASTRO_INDEX_PAGE, "")
		.replace("[", ":")
		.replace("]", "")

	// handle root index, add trailing slash to avoid empty string returned from match

	const pathToCheck = cleanFilePath.endsWith("/pages") ? `${cleanFilePath}/` : cleanFilePath

	return pathToCheck.match(GLOBALS.REGEX_ASTRO_PAGES_PATH)?.[1]
}

export function getRelativeFilePath(filePath: string): string {
	return path.relative(process.cwd(), filePath)
}
