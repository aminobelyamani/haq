// biome-ignore format: manual alignment for readability
export const GLOBALS = {
	ASTRO_LOCALS_HMR_HEADER        : "x-astro-locals",
	REGEX_EXPRESS_ROUTER_BASE_PATH : /^\/[/a-z0-9_-]+$/,
	REGEX_EXPRESS_ROUTE_PATH       : /(?:^\/[a-z0-9_-]*$)|(?:^\/:[a-z0-9_-]+$)/,
	HAQ_INJECTED_SCRIPT_ATTRIBUTE  : "haq_partial_route"
} as const
