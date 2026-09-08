//#region -------------------------------------------------- Module Imports

import { GLOBALS } from "../globals.js"

//#endregion ----------------------------------------------- Module Imports

export function injectHTMLFromServer({
	htmlAsString,
	partialRoute
}: {
	htmlAsString: string
	partialRoute: string
}): HTMLBodyElement | null {
	const html = _safeParseHTML(htmlAsString)
	if (!html) return null

	const { body, head } = html
	if (!body) return null

	// check if injexted scripts exist already, avoid adding them to the DOM more than once
	const currentStyleTags = [...document.body.querySelectorAll("style")]
	const currentScriptTags = [...document.body.querySelectorAll("script")]

	const styleTaxExists = currentStyleTags.some(
		(tag) => tag.getAttribute(GLOBALS.HAQ_INJECTED_SCRIPT_ATTRIBUTE) === partialRoute
	)
	const scriptTagEXISTS = currentScriptTags.some(
		(tag) => tag.getAttribute(GLOBALS.HAQ_INJECTED_SCRIPT_ATTRIBUTE) === partialRoute
	)

	if (styleTaxExists || scriptTagEXISTS) return body

	// Find all script and style tags in body of response and re-insert them
	_injectScriptTags(body)
	_injectStyleTags(body)

	if (!head) return body

	// Find all script and style tags in head of response and re-insert them
	_injectScriptTags(head)
	_injectStyleTags(head)

	return body

	//* ---------- Helpers -----------------------------------------------

	function _safeParseHTML(rawHtml: string): { head: HTMLHeadElement | null; body: HTMLBodyElement | null } | null {
		try {
			const parser = new DOMParser()
			const newDocument = parser.parseFromString(rawHtml, "text/html")

			return { head: newDocument.querySelector("head"), body: newDocument.querySelector("body") }
		} catch (e) {
			console.error(e)
			return null
		}
	}

	function _injectScriptTags(headOrBody: HTMLBodyElement | HTMLHeadElement): void {
		const scripts = headOrBody.querySelectorAll("script")
		for (const oldScript of scripts) {
			// must have type="module" to avoid re-runs if script was already loaded in the browser
			// avoid adding script that already is present
			if (_shouldIgnoreScript(oldScript)) continue

			const newScript = document.createElement("script")
			if (oldScript.src) {
				newScript.src = oldScript.src
			} else {
				newScript.textContent = oldScript.textContent
			}
			// Copy attributes like type, async, etc.
			for (const attr of oldScript.attributes) {
				newScript.setAttribute(attr.name, attr.value)
			}
			newScript.setAttribute(GLOBALS.HAQ_INJECTED_SCRIPT_ATTRIBUTE, partialRoute)

			document.body.prepend(newScript)
		}
	}

	function _shouldIgnoreScript(oldScript: HTMLScriptElement): boolean {
		return (
			!oldScript.hasAttribute("type") ||
			oldScript.getAttribute("type") !== "module" ||
			currentScriptTags.some((s) => s.src === oldScript.src)
		)
	}

	function _injectStyleTags(headOrBody: HTMLBodyElement | HTMLHeadElement): void {
		const styleTags = headOrBody.querySelectorAll("style")
		for (const oldStyleTag of styleTags) {
			const newStyleTag = document.createElement("style")
			newStyleTag.textContent = oldStyleTag.textContent

			// Copy attributes astro/vite generated
			for (const attr of oldStyleTag.attributes) {
				newStyleTag.setAttribute(attr.name, attr.value)
			}
			newStyleTag.setAttribute(GLOBALS.HAQ_INJECTED_SCRIPT_ATTRIBUTE, partialRoute)
			document.body.prepend(newStyleTag)
		}
	}
}
