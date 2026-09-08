/** biome-ignore-all lint/style/noDefaultExport: Astro config requires default export */
import { removeAstroAttributes } from "@haq/astro/tools"
import { defineConfig } from "astro/config"

export default defineConfig({
	output: "static",
	srcDir: "./src",
	vite: {
		plugins: [removeAstroAttributes()]
	},
	build: {
		format: "file"
	}
})
