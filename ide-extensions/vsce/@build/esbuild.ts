import { spawn } from "node:child_process"
import process from "node:process"
import type { PluginBuild } from "esbuild"
import { context } from "esbuild"

const production = process.argv.includes("--production")
const watch = process.argv.includes("--watch")

const postBundlePlugin = {
	name: "post-bundle",
	setup(build: PluginBuild): void {
		build.onEnd(async (result) => {
			if (result.errors.length === 0) {
				await runCommand("node", ["@build/post-bundle.ts", "--experimental-strip-types"])
			}
		})
	}
}

function runCommand(cmd: string, args: string[] = []): Promise<number | null> {
	return new Promise<number | null>((resolve) => {
		const child = spawn(cmd, args, { stdio: "inherit" })

		child.on("data", (data) => {
			console.info(data)
		})

		child.on("error", (error) => {
			console.error(error)
		})

		child.on("close", (code) => {
			resolve(code)
		})
	})
}

async function main(): Promise<void> {
	const ctx = await context({
		entryPoints: [
			"src/extension.ts",
			"node_modules/css-tree/cjs/index.cjs",
			"node_modules/@astrojs/compiler/dist/node/index.cjs",
			"node_modules/@astrojs/compiler/dist/node/utils.cjs"
		],
		outdir: "out",
		bundle: true,
		format: "cjs",
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: "node",
		external: ["vscode", "css-tree", "@astrojs/compiler", "@astrojs/compiler/utils"],
		logLevel: "info",
		plugins: [postBundlePlugin]
	})
	if (watch) {
		await ctx.watch()
	} else {
		await ctx.rebuild()
		await ctx.dispose()
	}
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
