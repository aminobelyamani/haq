/*******************************************************************************
 *
 * This module provides typed runtime utility functions for common use cases.
 *
 * @module
 *
 ******************************************************************************/

/*******************************************************************************
 *
 * Typed helper function for `Object.entries()`.
 *
 * @param object The object.
 * @returns The typed `IterableIterator`.
 *
 * @example
 * ```ts
 * import { entriesFromObject } from "@haq/utils";
 *
 * for (const [key, value] of entriesFromObject(obj)) {
 *   // the type of obj will be inferred
 *   // provides type-safe access and intellisense to key/value
 * }
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function entriesFromObject<IA_Obj extends object, IA_Key extends keyof IA_Obj>(
	object: IA_Obj
): IterableIterator<[IA_Key, IA_Obj[IA_Key]]> {
	return Object.entries(object) as unknown as IterableIterator<[IA_Key, IA_Obj[IA_Key]]>
}

/*******************************************************************************
 *
 * Typed helper function for `Object.keys()`.
 *
 * @param object The object.
 * @returns The typed array of the object's keys.
 *
 * @example
 * ```ts
 * import { keysFromObject } from "@haq/utils";
 *
 * for (const key of keysFromObject(obj)) {
 *   // the type of obj will be inferred
 *   // provides type-safe access and intellisense to key
 * }
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function keysFromObject<IA_Obj extends object>(object: IA_Obj): (keyof IA_Obj)[] {
	return Object.keys(object) as (keyof IA_Obj)[]
}

/*******************************************************************************
 *
 * Typed helper function for checking if a given property exists in a given object.
 *
 * @param obj The object.
 * @param prop The property to access.
 * @returns The typed object with the prop as a required key.
 *
 * @example
 * ```ts
 * import { hasProperty } from "@haq/utils";
 *
 * type TObj = {
 *   name: string
 *   age?: number
 * }
 *
 * const obj:TObj = {
 *   name: "Bob"
 * }
 *
 * if(hasProperty(obj, "age")){
 *   // obj.age will be defined and of type `number`
 * }
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function hasProperty<IA_Record extends Record<string, unknown>, Prop extends keyof IA_Record>(
	obj: IA_Record,
	prop: Prop
): obj is Required<IA_Record> {
	return prop in obj
}

/*******************************************************************************
 *
 * Typed helper function that returns a string array that contains all unique values from a given string literal type union.
 *
 * @typeParam T - The string literal type union.
 * @returns The typed readonly array.
 *
 * @example
 * ```ts
 * import { stringArray } from "@haq/utils";
 *
 * type MyList = "one" | "two" | "three"
 *
 * const myList = stringArray<MyList>()(["one", "two"]) // will show missing value error
 * const myList = stringArray<MyList>()(["one", "two", "three", "one"]) // will show duplicate value error
 * const myList = stringArray<MyList>()(["one", "two", "three"]) // valid
 * ```
 *
 * @author Amino Belyamani
 ******************************************************************************/

export function stringArray<T extends string>(): StringArrayReturn<T> {
	//@ts-expect-error: Return type matches exactly the signature below
	return <const A extends readonly T[]>(array: A & Validate<T, A>): readonly T[] => array
}
type StringArrayReturn<T extends string> = <const A extends readonly T[]>(array: A & Validate<T, A>) => readonly T[]

type Validate<T extends string, A extends readonly T[]> =
	DuplicateValues<A> extends never
		? [T] extends [A[number]]
			? [A[number]] extends [T]
				? unknown
				: { __error__: ["❌ Extra values", Exclude<A[number], T>] }
			: { __error__: ["❌ Missing some", Exclude<T, A[number]>] }
		: { __error__: ["❌ Duplicate values", DuplicateValues<A>] }

type DuplicateValues<T extends readonly unknown[], Seen = never> = T extends readonly [infer Head, ...infer Tail]
	? Head extends Seen
		? Head
		: DuplicateValues<Tail, Seen | Head>
	: never

/*******************************************************************************
 *
 * Typed helper function for asserting unreachable code. Useful for exhaustive switch statements.
 *
 * @param x A param that resolves to a `never` type.
 *
 ******************************************************************************/

export function assertUnreachable(x: never): void {
	console.trace("Unreachable code!\n\n", x)
}

/*******************************************************************************
 *
 * Typed helper function for throwing an error when asserting unreachable code. Useful for exhaustive switch statements.
 *
 * @param _x A param that resolves to a `never` type.
 * @param err An Error constructor that extends `Error`.
 * @throws {Error} Throws an Error.
 *
 ******************************************************************************/

export function assertUnreachableAndThrow(_x: never, err: Error): never {
	throw err
}

/*******************************************************************************
 *
 * A utility function to create a type in a runtime context. Useful for inferring types from runtime objects.
 *
 * @typeParam T - The type.
 *
 * @returns The passed type.
 *
 ******************************************************************************/

export function _T<T>(): T {
	return TYPE as unknown as T
}
const TYPE = Symbol("type")
