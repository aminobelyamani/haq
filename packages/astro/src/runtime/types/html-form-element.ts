/** biome-ignore-all lint/style/useConsistentMethodSignatures: DOM properties don't augment well when written out in property style */

/**
 * A `<form>` element in the DOM; it allows access to and in some cases modification of aspects of the form, as well as access to its component elements.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement)
 */
export interface I_HTMLFormElement extends HTMLElement {
	/**
	 * Sets or retrieves a list of character encodings for input data that must be accepted by the server processing the form.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/acceptCharset)
	 */
	acceptCharset: string
	/**
	 * Sets or retrieves the URL to which the form content is sent for processing.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/action)
	 */
	action: string
	/** Specifies whether autocomplete is applied to an editable text field. */
	autocomplete: AutoFillBase
	/**
	 * Retrieves a collection, in source order, of all controls in a given form.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/elements)
	 */
	readonly elements: HTMLFormControlsCollection
	/**
	 * Sets or retrieves the MIME encoding for the form.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/encoding)
	 */
	encoding: string
	/**
	 * Sets or retrieves the encoding type for the form.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/enctype)
	 */
	enctype: string
	/**
	 * Sets or retrieves the number of objects in a collection.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/length)
	 */
	readonly length: number
	/**
	 * Sets or retrieves how to send the form data to the server.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/method)
	 */
	method: string
	/**
	 * Sets or retrieves the name of the object.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/name)
	 */
	name: string
	/** Designates a form that is not validated when submitted. */
	noValidate: boolean
	rel: string
	readonly relList: DOMTokenList
	/**
	 * Sets or retrieves the window or frame at which to target content.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/target)
	 */
	target: string
	/**
	 * Returns whether a form will validate when it is submitted, without having to submit it.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/checkValidity)
	 */
	checkValidity(): boolean
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/reportValidity) */
	reportValidity(): boolean
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/requestSubmit) */
	requestSubmit(submitter?: HTMLElement | null): void
	/**
	 * Fires when the user resets a form.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/reset)
	 */
	reset(): void
	/**
	 * Fires when a FORM is about to be submitted.
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLFormElement/submit)
	 */
	submit(): void

	// addEventListener(
	// 	type: string,
	// 	listener: EventListenerOrEventListenerObject,
	// 	options?: boolean | AddEventListenerOptions
	// ): void

	// addEventListener(
	// 	type: keyof HTMLElementEventMap,
	// 	listener: NativeEventListenerObject<I_ComponentShape>,
	// 	options?: boolean | AddEventListenerOptions
	// ): void

	// removeEventListener(
	// 	type: string,
	// 	listener: EventListenerOrEventListenerObject,
	// 	options?: boolean | EventListenerOptions
	// ): void

	// removeEventListener(
	// 	type: keyof HTMLElementEventMap,
	// 	listener: NativeEventListenerObject<I_ComponentShape>,
	// 	options?: boolean | AddEventListenerOptions
	// ): void

	[index: number]: Element
}
