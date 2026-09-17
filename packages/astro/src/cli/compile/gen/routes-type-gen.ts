//#region -------------------------------------------------- Module Imports

import fs from "node:fs"
import path from "node:path"
import { GLOBALS } from "../../../globals.js"
import { HAQError } from "../../_shared/errors.js"
import { getAstroPages, getRelativeFilePath, isAstroFile } from "../../_shared/fs.js"
import { formatAndWrite } from "../../_shared/output.js"
import { addDisclaimerComment, removeTrailingSlash } from "../../_shared/strings.js"

//#endregion ----------------------------------------------- Module Imports

type ARGS_generateRoutesTypes = {
	astroDir: string
	outDir: string
	index: number
}

export function generateRoutesTypes({ astroDir, index, outDir }: ARGS_generateRoutesTypes): void {
	const AstroPagesDir = findAstroPagesDir(astroDir)
	if (!AstroPagesDir) throw new HAQError({ message: `Could not find Astro "/pages" directory in: ${astroDir}` })

	const routesByFileNames = getRoutesByFilenames(AstroPagesDir)

	const pageRouteType = `export type HAQ_PageRoute = ${routesByFileNames.renderedRoutes.length > 0 ? routesByFileNames.renderedRoutes.map((route) => `"${route}"`).join("|") : "never"} `
	const partialsRouteType = `export type HAQ_PartialRoute = ${routesByFileNames.partialRoutes.length > 0 ? routesByFileNames.partialRoutes.map((route) => `"${route}"`).join("|") : "never"} `
	const emailRouteType = `export type HAQ_EmailRoute = ${routesByFileNames.emailRoutes.length > 0 ? routesByFileNames.emailRoutes.map((route) => `"${route}"`).join("|") : "never"} `
	const allRenderedTypes = "export type HAQ_RenderedRoute = HAQ_PageRoute | HAQ_PartialRoute | HAQ_EmailRoute"

	const routeTypes = `${addDisclaimerComment()}
        // LINK ${getRelativeFilePath(AstroPagesDir)}/index.astro\n\n
        ${pageRouteType}\n\n${partialsRouteType}\n\n${emailRouteType}\n\n${allRenderedTypes}\n\n`

	formatAndWrite({
		outDir,
		filePath: `${outDir}/${GLOBALS.GEN_ROUTES_TYPES_FILE_PREFIX}${index}.ts`,
		content: routeTypes
	})
}

function findAstroPagesDir(projectDir: string): string | undefined {
	const fileList = fs.readdirSync(projectDir)
	let pagesDir: string | undefined
	for (const file of fileList) {
		const name = `${projectDir}/${file}`

		if (fs.statSync(name).isDirectory() && file === "pages") {
			pagesDir = name
			break
		}
	}
	return pagesDir
}

type RT_getRoutesByFilenames = {
	partialRoutes: string[]
	emailRoutes: string[]
	renderedRoutes: string[]
}
function getRoutesByFilenames(dir: string): RT_getRoutesByFilenames {
	let partialRoutes: string[] = []
	let emailRoutes: string[] = []
	let renderedRoutes: string[] = []

	const fileList = fs.readdirSync(dir, { withFileTypes: true })
	for (const file of fileList) {
		const fullPath = path.join(dir, file.name)

		if (file.isDirectory()) {
			const pageFiles = getAstroPages(fullPath)
			if (file.name === "@partial") {
				partialRoutes = [...partialRoutes, ..._sanitizeRoutes(pageFiles, fullPath, file.name)]
			} else if (file.name === "@email") {
				emailRoutes = [...emailRoutes, ..._sanitizeRoutes(pageFiles, fullPath, file.name)]
			} else {
				renderedRoutes = [...renderedRoutes, ..._sanitizeRoutes(pageFiles, fullPath, file.name)]
			}
		} else if (isAstroFile(fullPath)) {
			if (file.name.includes("index")) renderedRoutes.push("/")
			else renderedRoutes.push(`/${file.name.replace(GLOBALS.ASTRO_FILENAME_EXTENSION, "")}`)
		}
	}
	return {
		partialRoutes: Array.from(new Set(partialRoutes)),
		emailRoutes: Array.from(new Set(emailRoutes)),
		renderedRoutes: Array.from(new Set(renderedRoutes))
	}

	//* ---------- Helpers -----------------------------------------------

	function _sanitizeRoutes(pageFiles: string[], fullPath: string, fileName: string): string[] {
		const appRoutes = pageFiles.map((f) => {
			const page = f.replace(`${fullPath}/`, "").replace(GLOBALS.ASTRO_FILENAME_EXTENSION, "")
			if (page.includes("index")) return `/${fileName}/${page.replace("index", "")}`
			if (page.match(GLOBALS.REGEX_ASTRO_DYNAMIC_ROUTE))
				return `/${fileName}/:${page.replace("[", "").replace("]", "")}` // dynamic route .eg /route/[page]
			return `/${fileName}/${page}`
		})

		return appRoutes.map((r) => removeTrailingSlash(r))
	}
}
