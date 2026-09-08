/* This is a simple Mock Response Object to send to Astro SSR Handler
We do this because there is no way yet to use Astro's Container API outside of the Astro runtime, so we use it as routes that we call after sending responses from Express. This mock response avoids errors from headers already been sent....
-----------------------------------------------*/

import { HTTP_STATUS_CODE } from "../../../errors/index.js"

type Headers = { [key: string]: string }

export class MockResponse {
	statusCode: number
	headers: Headers
	body: string | null
	headersSent: boolean
	finished: boolean

	constructor() {
		this.statusCode = HTTP_STATUS_CODE.OK
		this.headers = {}
		this.body = null
		this.headersSent = false // Mimic native res behavior
		this.finished = false // Track if the response is finished
	}

	setHeader(name: string, value: string): void {
		if (this.headersSent) {
			throw new Error("Cannot set headers after they are sent to the client")
		}
		this.headers[name.toLowerCase()] = value
	}

	getHeader(name: string): string | null {
		return this.headers[name.toLowerCase()] || null
	}

	removeHeader(name: string): void {
		if (this.headersSent) {
			throw new Error("Cannot remove headers after they are sent to the client")
		}
		delete this.headers[name.toLowerCase()]
	}

	writeHead(statusCode: number, headers: Headers = {}): void {
		if (this.headersSent) {
			throw new Error("Cannot write headers after they are sent to the client")
		}
		this.statusCode = statusCode
		for (const [name, value] of Object.entries(headers)) {
			this.setHeader(name, value)
		}
		this.headersSent = true
	}

	write(data: string): void {
		if (!this.headersSent) {
			this.headersSent = true // Implicitly send headers
		}
		this.body = (this.body ?? "") + data // Append to body
	}

	end(data?: string): void {
		if (data) this.write(data)
		this.finished = true
	}
}
