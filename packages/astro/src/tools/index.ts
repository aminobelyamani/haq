/*******************************************************************************
 *
 * Extra tools.
 *
 * @module
 *
 ******************************************************************************/

import type { z } from "zod"

/*******************************************************************************
 *
 * Helper to validate and provide type safety and intellisense for your environment variables.
 *
 * @typeParam Env - The generated env types from `env-types.ts`.
 *
 * @param {unknown} env The env object from `process.env`.
 * @param {z.ZodType} zodSchema The generated zod schema from `env-schema.ts`.
 *
 * @returns {Readonly<Env>} The fully typed env.
 * @throws {Error} If the passed environment does not match the schema.
 *
 * @example
 * ```ts
 * import type { HAQ_ENV } from "./env-types.js"
 *
 * import { envSchema } from "./env-schema.js"
 * import { validateEnv } from "@haq/astro"
 *
 * export const ENV = validateEnv<HAQ_ENV>(process.env, envSchema)
 * // now you can use it safely anywhere in your project
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function validateEnv<Env extends Record<string, string>>(env: unknown, zodSchema: z.ZodType): Readonly<Env> {
	const ENV = zodSchema.safeParse(env)
	if (ENV.error) throw new Error(ENV.error.message)

	return Object.freeze(ENV.data) as Readonly<Env>
}

// biome-ignore lint/performance/noBarrelFile: These exposed functions are almost always used together so no significant tree shaking effect.
export { GLOBALS as HAQ_GLOBALS } from "../globals.js"
export type { I_LSPTools } from "./lsp/index.js"
export { isHAQError, makeLspTools } from "./lsp/index.js"
export { removeAstroAttributes } from "./remove-attributes.js"
