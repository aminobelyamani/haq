import { EventEmitter } from "node:events"

type Headers = { [key: string]: string }
type Query = { [key: string]: string | string[] }

class MockSocket extends EventEmitter {
	encrypted: boolean

	constructor(encrypted = false) {
		super()
		this.encrypted = encrypted
	}
}

export class MockRequest extends EventEmitter {
	method: string
	url: string
	headers: Headers
	query: Query
	body: unknown
	readable: boolean
	socket: MockSocket

	constructor(
		options: {
			method?: string
			url?: string
			headers?: Headers
			query?: Query
			body?: unknown
			encrypted?: boolean
		} = {}
	) {
		super()
		this.method = options.method ?? "GET"
		this.url = options.url ?? "/"
		this.headers = options.headers ?? {}
		this.query = options.query ?? {}
		this.body = options.body ?? null
		this.readable = true // Mimics the readable state of a request stream
		this.socket = new MockSocket(options.encrypted)
	}

	setHeader(name: string, value: string): void {
		this.headers[name.toLowerCase()] = value
	}

	getHeader(name: string): string | null {
		return this.headers[name.toLowerCase()] || null
	}

	removeHeader(name: string): void {
		delete this.headers[name.toLowerCase()]
	}

	read(): unknown {
		if (!this.readable) {
			return null
		}
		this.readable = false // Simulate the request being read
		return this.body
	}

	push(data: unknown): void {
		if (!this.readable) {
			throw new Error("Cannot push data after the stream is finished")
		}
		this.body = data
	}

	end(): void {
		this.readable = false
		this.emit("end")
	}
}
