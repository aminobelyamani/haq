import { copyFile, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"

const relativeFilePath = "./out/src/extension.js"
let fileContent = readFileSync(path.join(process.cwd(), relativeFilePath)).toString()

const cssTreeRegexp = new RegExp(/\("css-tree"\)/, "gi")
const astroCompilerRegexp = new RegExp(/\("@astrojs\/compiler"\)/, "gi")
const astroCompilerUtilsRegexp = new RegExp(/\("@astrojs\/compiler\/utils"\)/, "gi")

fileContent = fileContent.replace(cssTreeRegexp, '("../node_modules/css-tree/cjs/index.js")')
fileContent = fileContent.replace(astroCompilerRegexp, '("../node_modules/@astrojs/compiler/dist/node/index.js")')
fileContent = fileContent.replace(astroCompilerUtilsRegexp, '("../node_modules/@astrojs/compiler/dist/node/utils.js")')

writeFileSync(relativeFilePath, fileContent)

const relativeAstroWasmPath = path.join(process.cwd(), "./node_modules/@astrojs/compiler/dist/astro.wasm")
const destinationPath = path.join(process.cwd(), "./out/node_modules/@astrojs/compiler/dist/astro.wasm")

copyFile(relativeAstroWasmPath, destinationPath, (e) => {
	if (e) console.trace(e)
	else {
		console.info("------------------------------\n")
		console.info("post bundle script ran successfully\n")
		console.info("------------------------------\n")
	}
})
