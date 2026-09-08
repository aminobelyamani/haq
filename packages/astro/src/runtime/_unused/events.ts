import type {
	AnyDOMElement,
	ExtractAllNativeEvents,
	ExtractAllSelectors,
	FindNestedChildElBySelector,
	NativeDOMElement,
	RenderedDOMElement,
	RenderedDOMElementOrWebComponent,
	ValidNativeEvType
} from "../types/dynamic.js"

import type { I_ComponentShape } from "../types/static.js"

export type ChangeListenerCBArgs = {
	value: string
}

type CB = (args: ChangeListenerCBArgs) => void

export type ReturnTypeOfEventDelegator<T extends I_ComponentShape> = ReturnType<typeof makeEventDelegator<T>>

/*******************************************************************************
 *
 * TYPED EVENT DELEGATOR
 *
 ******************************************************************************/

type MakeEventDelegatorReturn<T extends I_ComponentShape> = Readonly<{
	getType: () => undefined | ExtractAllNativeEvents<T>
	getEvent: <K extends ExtractAllNativeEvents<T>>(
		_type: K
	) => K extends keyof HTMLElementEventMap ? HTMLElementEventMap[K] : undefined
	closest: <K extends ExtractAllSelectors<T> & string>(selector: K) => FindNestedChildElBySelector<T, K, false> | null
	getTarget: () => AnyDOMElement | null
}>

export function makeEventDelegator<T extends I_ComponentShape>(
	e: Event,
	_RootEl: RenderedDOMElement<T> | RenderedDOMElementOrWebComponent<T>
): MakeEventDelegatorReturn<T> {
	type EL = ExtractAllNativeEvents<T>

	return Object.freeze({
		getType,
		getEvent,
		closest,
		getTarget
	})

	function getType(): undefined | EL {
		return e.type as [EL] extends [never] ? undefined : EL
	}

	function getEvent<K extends EL>(_type: K): K extends keyof HTMLElementEventMap ? HTMLElementEventMap[K] : undefined {
		return e as K extends keyof HTMLElementEventMap ? HTMLElementEventMap[K] : undefined
	}

	function getTarget(): AnyDOMElement | null {
		return e.target as AnyDOMElement | null
	}

	function closest<K extends ExtractAllSelectors<T> & string>(
		selector: K
	): FindNestedChildElBySelector<T, K, false> | null {
		return (e.target as unknown as HTMLElement)?.closest(selector as string) as FindNestedChildElBySelector<
			T,
			K,
			false
		> | null
	}
}

export function emitNativeEvent<T extends I_ComponentShape>(
	el: RenderedDOMElement<T>,
	evType: ValidNativeEvType<T>,
	options?: EventInit
): void {
	if (!evType) return
	const ev = new Event(evType, options)
	;(el as unknown as HTMLElement).dispatchEvent(ev)
}

export function addChangeListenerToForm(
	Form: NativeDOMElement<"form">,
	callback: CB,
	options?: AddEventListenerOptions
): void {
	const formInputs = Form.elements
	for (const input of formInputs) {
		if (input instanceof HTMLInputElement) {
			input.addEventListener(
				"change",
				(e) => {
					const target = e.target
					if (!(target instanceof HTMLInputElement)) return
					callback({ value: target.value })
				},
				options
			)
		}
	}
}

export function addChangeListenerToInput(
	Input: NativeDOMElement<"input">,
	callback: CB,
	options?: AddEventListenerOptions
): void {
	if (Input instanceof HTMLInputElement) {
		Input.addEventListener(
			"change",
			(e) => {
				const target = e.target
				if (!(target instanceof HTMLInputElement)) return
				callback({ value: target.value })
			},
			options
		)
	}
}
