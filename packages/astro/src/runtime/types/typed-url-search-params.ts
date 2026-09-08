/** biome-ignore-all lint/style/useConsistentMethodSignatures: DOM properties don't augment well when written out in property style */

export interface I_URLSearchParams<T extends Record<string, unknown>> {
	/**
	 * Appends a new value onto an existing key inside a FormData object, or adds the key if
	 * it does not already exist.
	 *
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/FormData#formdata.append}
	 */
	append<K extends keyof T>(name: K, value: T[K]): void

	/**
	 * Deletes a key/value pair from a FormData object.
	 *
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/FormData#formdata.delete}
	 */
	delete<K extends keyof T>(name: K, value?: T[K]): void

	/**
	 * Returns an iterator allowing to go through all key/value pairs contained in this object.
	 *
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/FormData#formdata.entries}
	 */
	entries<K extends keyof T>(): IterableIterator<[K, T[K]]>

	/**
	 * Returns the first value associated with a given key from within a FormData object.
	 *
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/FormData#formdata.get}
	 */
	get<K extends keyof T>(name: K): T[K] | null

	/**
	 * Returns an array of all the values associated with a given key from within a FormData.
	 *
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/FormData#formdata.getall}
	 */
	getAll<K extends keyof T>(name: K): NonNullable<T[K]>[]

	/**
	 * Returns a boolean stating whether a FormData object contains a certain key.
	 *
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/FormData#formdata.has}
	 */
	has<K extends keyof T>(name: K, value?: T[K]): boolean

	/**
	 * Returns an iterator allowing to go through all keys of the key/value pairs contained in
	 * this object.
	 *
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/FormData#formdata.keys}
	 */
	keys(): IterableIterator<keyof T>

	/**
	 * Sets a new value for an existing key inside a FormData object, or adds the key/value
	 * if it does not already exist.
	 *
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/FormData#formdata.set}
	 */
	set<K extends keyof T>(name: K, value: T[K]): void

	/**
	 * Returns an iterator allowing to go through all values contained in this object.
	 *
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/FormData#formdata.values}
	 */
	values(): IterableIterator<T[keyof T]>

	forEach<K extends keyof T>(
		callbackfn: (value: T[K], key: K, parent: I_URLSearchParams<T>) => void,
		thisArg?: unknown
	): void

	sort(): void

	toString(): string
}
