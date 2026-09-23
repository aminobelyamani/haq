/*******************************************************************************
 *
 * Extra tools.
 *
 * @module
 *
 ******************************************************************************/

// biome-ignore lint/performance/noBarrelFile: These exposed functions are almost always used together so no significant tree shaking effect.
export { GLOBALS } from "../globals.js"
export type { I_LSPTools } from "./lsp/index.js"
export { makeLspTools } from "./lsp/index.js"
export { removeAstroAttributes } from "./remove-attributes.js"
