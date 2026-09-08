/** biome-ignore-all lint/style/useConsistentMethodSignatures:  We need to use methods for correct augmentation */
/** biome-ignore-all lint/style/noNamespace: We actually need to use namespace */

export type {}

type HAQ_ComponentShape = import("@haq/astro/types").HAQ_ComponentShape
type HAQ_DOMElement<T extends HAQ_ComponentShape> = import("@haq/astro/types").HAQ_DOMElement<T>
type HAQ_NativeEventType = import("@haq/astro/types").HAQ_NativeEventType

declare global {
	namespace astroHTML.JSX {
		//* ---------- HAQ Directives used by type generation -----------------------------------------------

		interface HAQ_Attributes {
			x_haq?: boolean | undefined
			x_webc?: boolean | undefined
			x_alias?: boolean | undefined
			x_appc?: boolean | undefined
			x_slot?: boolean | string | undefined
			x_sel?: string | undefined
			x_dyn_sel?: boolean | string | undefined
			x_ev_types?: HAQ_NativeEventType[] | undefined
			x_class_list?: string | undefined
			x_input_values?: string[] | undefined
			x_attr_values?: string | undefined
		}

		//* ---------- Globally defined custom attributes -----------------------------------------------

		interface HAQ_GlobalAttributes {}

		//* ---------- Extending Astro HTMLAttributes -----------------------------------------------

		interface HTMLAttributes extends HAQ_Attributes, HAQ_GlobalAttributes {}

		interface HtmlHTMLAttributes {
			x_page: `/${string}`
		}

		interface SVGAttributes extends HTMLAttributes {}

		//* ---------- Augmenting Astro DefinedIntrinsicElements -----------------------------------------------

		interface DefinedIntrinsicElements {
			template: HTMLAttributes
		}
	}

	//* ---------- HAQ namespace -----------------------------------------------

	namespace HAQ {
		interface WebComponentTagNameMap {
			[tag: string]: {
				el: unknown
				customEvents: unknown
			}
		}

		interface AppComponentMap {
			[ComponentName: string]: unknown
		}

		interface CustomElementCustomProperties {
			[tag: string]: string
		}
	}

	//* ---------- Augmenting Global Window/globalThis -----------------------------------------------

	interface Window {
		getComputedStyle<IA_Component extends HAQ_ComponentShape>(
			refEl: HAQ_DOMElement<IA_Component>
		): "style" extends keyof HAQ_DOMElement<IA_Component> ? HAQ_DOMElement<IA_Component>["style"] : never
	}

	function getComputedStyle<IA_Component extends HAQ_ComponentShape>(
		refEl: HAQ_DOMElement<IA_Component>
	): "style" extends keyof HAQ_DOMElement<IA_Component> ? HAQ_DOMElement<IA_Component>["style"] : never
}
