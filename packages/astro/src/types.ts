/*******************************************************************************
 *
 * Comile time types used by type/context generation.
 *
 * @module
 *
 ******************************************************************************/

export type {
	DOMElement as HAQ_DOMElement,
	ExtractNativeEventTypesByKind as HAQ_ExtractNativeEventTypesByKind,
	NativeEventListenerObject as HAQ_NativeEventListenerObject
} from "./runtime/types/dynamic.js"

export type {
	AppComponentByName as HAQ_AppComponentByName,
	AttributesByTag as HAQ_AttributesByTag,
	CustomEventsByTag as HAQ_CustomEventsByTag,
	MarkupAlias as HAQ_MarkupAlias,
	MatchingSelectorsByTag as HAQ_MatchingSelectorsByTag,
	StylePropertiesByTag as HAQ_StylePropertiesByTag
} from "./runtime/types/gen.js"

export type { I_HTMLFormElement as HAQ_HTMLFormElement } from "./runtime/types/html-form-element.js"

export type {
	I_ComponentShape as HAQ_ComponentShape,
	I_HTMLTagTypes as HAQ_HTMLTagTypes,
	NativeEventType as HAQ_NativeEventType,
	NativeEventTypeKind as HAQ_NativeEventTypeKind
} from "./runtime/types/static.js"
