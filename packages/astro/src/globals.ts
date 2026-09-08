/*******************************************************************************
 *
 * Global constants used accross package.
 *
 ******************************************************************************/

export const GLOBALS = {
	/* config file */

	HAQ_CONFIG_JSON_FILE_NAME: "haq.config.json",

	/* folder names */

	GENERATED_TYPES_FOLDER: "_haq",
	INTERNAL_GENERATED_TYPES_FOLDER: "_static",

	/* generated once */

	NATIVE_ELEMENTS_JSON_FILE_NAME: "__native_elements.json",
	GLOBAL_DECLARATIONS_TXT_FILE_NAME: "__global.txt",
	GLOBAL_DECLARATIONS_FILE_NAME: "__global.ts",
	NULLABLE_COMPONENT_NAME: "Nullable",

	/* generated files */

	GEN_ATTRIBUTES_FILE_NAME: "attributes.ts",
	GEN_CUSTOM_ELEMENTS_FILE_NAME: "custom-elements.ts",
	GEN_MARKUP_FILE_NAME: "markup.ts",
	GEN_WEB_C_FILE_NAME_PREFIX: "webc-",
	GEN_APP_C_FILE_NAME_PREFIX: "appc-",
	GEN_ROUTES_TYPES_FILE_PREFIX: "routes-",
	GEN_CUSTOM_ELEMENTS_JSON_FILE_NAME: "custom_elements.json",
	GEN_ASTRO_COMPONENTS_JSON_FILE_NAME: "astro_components.json",
	GEN_LISTS_JSON_FILE_NAME: "lists.json",
	GEN_CSS_JSON_FILE_NAME: "css.json",
	LOG_FILE_NAME: "haq_log.txt",

	/* haq env */

	HAQ_ENV_TYPES_FILE_NAME: "env-types.ts",
	HAQ_ENV_ZOD_OBJ_FILE_NAME: "env-schema.ts",

	/* regex */

	REGEX_ASTRO_EXTENSION: /(.+.)(.astro)$/,
	REGEX_CSS_EXTENSION: /.+.(.css)$/,
	REGEX_HAQ_JSON_EXTENSION: /.+.(.haq\.json)$/,
	REGEX_STRING_NUMBER: /^[0-9]+$/,
	REGEX_FILE_NAME: /(.+?)(\.[^.]*$|$)/,
	REGEX_CLASS_LIST_SPECIAL_CHARS: /[^A-Za-z0-9-|]/,
	REGEX_CSS_SPECIAL_CHARS: /[(){}:,;\s]/,
	REGEX_HTML_CUSTOM_ELEMENT: /^([a-z]+-[a-z]+)*$/,
	REGEX_ASTRO_DYNAMIC_ROUTE: /(\[[a-z]+\])/,
	REGEX_TRAILING_SLASH: /\/$/,
	REGEX_UPPER_CASE: /[A-Z]/,
	REGEX_ASTRO_PAGES_PATH: /\/pages(\/?.*)$/,
	REGEX_ASTRO_INDEX_PAGE: /\/index.*/,
	REGEX_NO_SPACES: /^\S*$/,
	REGEX_PAGES_WITHOUT_PARTIAL: /\/pages\/(?!@partial).*/,
	REGEX_PAGES_WITHOUT_PARTIAL_AND_EMAIL: /\/pages\/(?!@partial|@email).*/,
	REGEX_PARTIAL_PAGES: /\/pages(\/@partial.+)\.astro/,
	REGEX_HAQ_ROUTE_DECLARATION: /\s*const\s*HAQ_ROUTE\s*=\s*["'](.*)["']/,
	REGEX_ASTRO_LOCALS_DECLARATION: /\s*Astro\.locals\[(.+.)\]/,
	REGEX_CSS_IMPORT: /\s*import\s["'](.+.(?:.css))["']/,
	REGEX_ASTRO_COMPONENT_IMPORT: /import\s+([^\s.]+)\s+from\s+["'][^\s.]+\/(.+)\.astro["']/,
	REGEX_ASTRO_PROPS_DECLARATION: /(?:type|interface)\sProps/,
	REGEX_ASTRO_CSS_CLASSNAMES: /"([0-9a-z-A-Z_\s]+)"/,

	/* char literal */

	EMPTY_CHAR: " ",
	PIPE_CHAR: "|",
	DASH_CHAR: "-",
	STAR_CHAR: "*",

	/* HAQ directive char lengths */

	X_HAQ_DIRECTIVE_CHAR_LENGTH: 5, // x_haq
	X_WEBC_DIRECTIVE_CHAR_LENGTH: 6, // x_webc
	X_APPC_DIRECTIVE_CHAR_LENGTH: 6, // x_appc
	X_ALIAS_DIRECTIVE_CHAR_LENGTH: 7, // x_alias
	X_SLOT_DIRECTIVE_CHAR_LENGTH: 6, // x_slot
	X_SEL_DIRECTIVE_CHAR_LENGTH: 5, // x_sel
	X_DYN_SEL_DIRECTIVE_CHAR_LENGTH: 9, // x_dyn_sel
	X_EV_TYPES_DIRECTIVE_CHAR_LENGTH: 10, // x_ev_types
	X_INPUT_VALUES_DIRECTIVE_CHAR_LENGTH: 14, // x_input_values
	X_ATTR_VALUES_DIRECTIVE_CHAR_LENGTH: 13, // x_attr_values
	X_PAGE_DIRECTIVE_CHAR_LENGTH: 6, // x_page
	CLASS_LIST_ATTRIBUTE_CHAR_LENGTH: 10, // class:list

	/* HAQ directive char offsets */

	X_SLOT_DIRECTIVE_OFFSET: 8, // x_slot="
	X_CLASS_LIST_DIRECTIVE_OFFSET: 14, // x_class_list="
	X_ATTR_VALUES_DIRECTIVE_OFFSET: 15, // x_attr_values="
	X_EV_TYPES_DIRECTIVE_OFFSET: 12, // x_ev_types="
	SLOT_ATTRIBUTE_OFFSET: 6, // slot="
	CLASS_ATTRIBUTE_OFFSET: 7, // class="
	CLASS_LIST_ATTRIBUTE_OFFSET: 12, // class:list={
	CSS_VAR_FUNCTION_OFFSET: 5, // var(

	/* HAQ directives */

	HAQ_DIRECTIVES: [
		"x_haq",
		"x_webc",
		"x_alias",
		"x_appc",
		"x_slot",
		"x_sel",
		"x_dyn_sel",
		"x_ev_types",
		"x_class_list",
		"x_input_values",
		"x_attr_values",
		"x_page"
	],

	/* Other literals */

	HAQ_MARKUP_TYPE_PREFIX: "MU_",
	CSS_STATIC_VARIABLE_PREFIX: "--_",
	CSS_DYNAMIC_VARIABLE_PREFIX: "--__",
	HAQ_DATA_ATTRIBUTE_PREFIX: "d_",
	DATA_ATTRIBUTE_PREFIX: "data-",
	ASTRO_DEFAULT_SLOT_NAME: "default",
	HAQ_CSS_RAW_ATTRIBUTE_PLACEHOLDER: "__haq__",
	HAQ_CHECK_IGNORE_ENTIRE_FILE_DIRECTIVE: "haq-check-ignore-all",
	HAQ_CHECK_IGNORE_DIRECTIVE: "haq-check-ignore",
	HAQ_ROUTE_VAR_NAME: "HAQ_ROUTE",
	VS_CODE_EXTENSION_NAME: "HAQ Astro",
	CSS_SIBLING_CHARS: ["+", "~"] as string[],
	FRAGILE_HTML_TAGS: [
		"a",
		"audio",
		"body",
		"button",
		"canvas",
		"footer",
		"form",
		"head",
		"header",
		"html",
		"img",
		"input",
		"label",
		"link",
		"main",
		"nav",
		"picture",
		"select",
		"style",
		"table",
		"tbody",
		"td",
		"textarea",
		"tfoot",
		"th",
		"thead",
		"tr",
		"video"
	] as string[],
	IGNORABLE_TYPE_SELECTORS: ["script"] as string[],
	IGNORABLE_FOLDERS: [
		"node_modules",
		".git",
		".turbo",
		".astro",
		".vscode",
		".zed",
		"dist",
		"@dist",
		"out",
		"tmp"
	] as string[]
} as const

/*******************************************************************************
 *
 * HAQ Directives used as attributes on Astro components.
 *
 ******************************************************************************/

export type MarkupDirective = (typeof GLOBALS)["HAQ_DIRECTIVES"][number]
