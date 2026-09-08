/*******************************************************************************
 *
 * `HTMLElementTagNameMap` Augmentation.
 *
 * Custom tag-names default to `HTMLElement`.
 *
 ******************************************************************************/

export interface I_HTMLTagTypes extends HTMLElementTagNameMap {
	[name: string]: HTMLElement
}

/*******************************************************************************
 *
 * HAQ generated markup base shape.
 *
 ******************************************************************************/

export interface I_BaseComponentShape {
	HAQ_tag: keyof I_HTMLTagTypes & string
	HAQ_elType: I_HTMLTagTypes[keyof I_HTMLTagTypes]
	HAQ_attributes: unknown
	HAQ_styleProperties: unknown
	HAQ_matchingSelectors: unknown
}

/*******************************************************************************
 *
 * HAQ generated markup shape.
 *
 ******************************************************************************/

export interface I_ComponentShape extends I_BaseComponentShape {
	HAQ_id?: unknown | undefined
	HAQ_selector?: unknown | undefined
	HAQ_classList?: unknown | undefined
	HAQ_formData?: Record<string, string | File | Blob> | undefined
	HAQ_attributeValues?: Record<string, string> | undefined
	HAQ_eventListenerType?: NativeEventType | undefined
	HAQ_customEvents?: Record<string, unknown> | false | undefined
	HAQ_isWebComponent?: true | undefined
	HAQ_isMaybeRendered?: true | undefined
	HAQ_children?: Record<string, unknown> | undefined
	HAQ_slotChildren?: Record<string, unknown> | undefined
}

export type ComponentChildrenShape = Record<string, I_ComponentShape>

/*******************************************************************************
 *
 * Generic HAQ type for the `<html>` element ( `document.documentElement` ).
 *
 ******************************************************************************/

export type MU_RootDocument = {
	HAQ_tag: "html"
	HAQ_elType: I_HTMLTagTypes["html"]
	HAQ_attributes: unknown
	HAQ_styleProperties: unknown
	HAQ_matchingSelectors: unknown
}

/*******************************************************************************
 *
 * Type string literal for spearating event listener kinds.
 *
 ******************************************************************************/

export type NativeEventTypeKind = "native" | "doc" | "win"

/*******************************************************************************
 *
 * Union of allowed native event types passed as values for the `x_ev_types` directive.
 *
 ******************************************************************************/

export type NativeEventType = keyof HTMLElementEventMap | `w:${keyof WindowEventMap}` | `d:${keyof DocumentEventMap}`

/*******************************************************************************
 *
 * Shape of events that will be emitted by a WebComponent or AppComponent.
 *
 ******************************************************************************/

export type ComponentEventsShape = {
	[event: string]: unknown
}

/*******************************************************************************
 *
 * Predefined global app event used for file upload progress.
 *
 ******************************************************************************/

export type FileUploaderEvents = {
	"haq:file-upload-progress-received"?: {
		perc: number
		uId: string
	}
}
