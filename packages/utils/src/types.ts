/*******************************************************************************
 *
 * This module provides type utilities and aliases for common typescript use cases.
 *
 * @module
 *
 ******************************************************************************/

/*******************************************************************************
 *
 * Type alias for `Record<PropertyKey, unknown>`.
 *
 ******************************************************************************/

export type UnknownObj = Record<PropertyKey, unknown>

/*******************************************************************************
 *
 * Type alias for `Record<never, never>`.
 *
 ******************************************************************************/

export type EmptyObject = Record<never, never>

/*******************************************************************************
 *
 * Type utility to convert a union type to an intersection type.
 *
 * @typeParam U - The union type to convert.
 * @returns The converted type as an intersection type.
 *
 ******************************************************************************/

export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void
	? I
	: never

/*******************************************************************************
 *
 * Type utility to convert an object type to union of objects.
 *
 * @typeParam T - The type.
 * @returns The union of objects.
 *
 ******************************************************************************/

export type AsUnion<T> = {
	[K in keyof T]: { [P in K]: T[K] }
}[keyof T]

/*******************************************************************************
 *
 * Type utility to check if a given type object key is optional.
 *
 * @typeParam T - The type.
 * @typeParam K - The key.
 * @returns {boolean} Whether key in type is optional or not.
 *
 ******************************************************************************/

export type IsOptionalKey<T, K extends keyof T> = Record<never, never> extends Pick<T, K> ? true : false

/*******************************************************************************
 *
 * Type utility to check if a given type is a union.
 *
 * @typeParam T - The type.
 * @returns {boolean} Whether passed type is a union type or not.
 *
 ******************************************************************************/

export type IsUnion<T, U = T> = T extends unknown ? ([U] extends [T] ? false : true) : never

/*******************************************************************************
 *
 * Type guard for generic types that resolve to `any`.
 *
 * @typeParam T - The type.
 * @returns `T` if valid, otherwise will return `never` if resolves to `any`.
 *
 ******************************************************************************/

// biome-ignore lint/style/noMagicNumbers: Intentionally using 0 and 1
export type NotAny<T> = 0 extends 1 & T ? never : T

/*******************************************************************************
 *
 * Type utility to enforce no excess properties in runtime objects.
 *
 * @typeParam T - The type.
 * @returns Sealed `T`.
 *
 ******************************************************************************/

export type Sealed<T> = T & { readonly __noExtraProps?: never }

/*******************************************************************************
 *
 * Typed version of the `Omit` utility.
 *
 * @typeParam T - The type.
 * @typeParam K - The union of keys to omit from `T`.
 * @returns Typed `Omit<T, K>`.
 *
 ******************************************************************************/

export type TypedOmit<T, K extends keyof T> = Omit<T, K>

/*******************************************************************************
 *
 * Typed version of the `Extract` utility.
 *
 * @typeParam T - The union type.
 * @typeParam K - The string literal union to include from `T`.
 * @returns Typed `Extract<T, K>`.
 *
 ******************************************************************************/

export type TypedExtract<T extends string, K extends T> = Extract<T, K>

/*******************************************************************************
 *
 * Typed version of the `Exclude` utility.
 *
 * @typeParam T - The union type.
 * @typeParam K - The string literal union to exclude from `T`.
 * @returns Typed `Exclude<T, K>`.
 *
 ******************************************************************************/

export type TypedExclude<T, U extends T> = T extends U ? never : T

/* Transform specific optional properties into required
-----------------------------------------------*/

/*******************************************************************************
 *
 * Type utility to convert specific optional properties into required.
 *
 * @typeParam T - The type.
 * @typeParam K - The string literal union type of the properties to convert.
 * @returns The type with the converted properties.
 *
 ******************************************************************************/

export type RequiredKeys<T, K extends keyof T> = Exclude<T, K> & Required<Pick<T, K>>

/*******************************************************************************
 *
 * Type utility to remove `null` type from a given type.
 *
 * @typeParam T - The type.
 * @returns The type without `null`.
 *
 ******************************************************************************/

export type NoNull<T> = Exclude<T, null>

/* Add null as a union type to each property
-----------------------------------------------*/

/*******************************************************************************
 *
 * Type utility to add `null` type as union type to all properties.
 *
 * @typeParam T - The type.
 * @returns The type with `null` union type added to each property.
 *
 ******************************************************************************/

export type OrNull<T> = {
	[P in keyof T]-?: T[P] | null
}

/*******************************************************************************
 *
 * Type utility to add `undefined` type as union type to all properties.
 *
 * @typeParam T - The type.
 * @returns The type with `undefined` union type added to each property.
 *
 ******************************************************************************/

export type OrUndefined<T> = {
	[P in keyof T]-?: T[P] | undefined
}

/*******************************************************************************
 *
 * Type utility to extract all keys from type as union.
 *
 * @typeParam T - The type.
 * @returns The union type of the type's keys.
 *
 ******************************************************************************/

export type ExtractKeys<T> = {
	[K in keyof T]: K
}[keyof T]

/*******************************************************************************
 *
 * Type utility to extract all values from type as union.
 *
 * @typeParam T - The type.
 * @returns The union type of the type's values.
 *
 ******************************************************************************/

export type ExtractValues<T> = {
	[K in keyof T]: T[K]
}[keyof T]

/*******************************************************************************
 *
 * Type utility to extract all values from array as union.
 *
 * @typeParam T - The type.
 * @returns The union type of array values.
 *
 ******************************************************************************/

export type ExtractStringLiteralFromArray<T> = T extends Array<infer A> ? A : never

/*******************************************************************************
 *
 * Type utility to enforce typed keys in a given type.
 *
 * @typeParam T - The type.
 * @typeParam U - The union type of keys.
 *
 ******************************************************************************/

export type EnsureKeys<T, U extends string> = {
	[K in keyof T]: K extends U ? T[K] : never
}

/*******************************************************************************
 *
 * Type utility to enforce a string type is not empty.
 *
 * @typeParam T - The string type.
 * @returns `never` if empty, otherwise returns `T`.
 *
 ******************************************************************************/

export type NoEmptyString<T extends string> = T extends "" ? never : T

/*******************************************************************************
 *
 * Type utility to enforce a an array is not empty.
 *
 * @typeParam T - The array type.
 *
 ******************************************************************************/

export type NoEmptyArray<T> = [T, ...T[]]

/*******************************************************************************
 *
 * Type utility to extract the argument types of a given function.
 *
 * @typeParam T - The function type.
 * @returns The type of arguments.
 *
 ******************************************************************************/

export type TypeOfArgs<T> = T extends (...args: infer U) => unknown ? U : never

/*******************************************************************************
 *
 * Type utility that given an object type, will convert all `number` types to a string number.
 *
 * @typeParam T - The type.
 * @returns The type with the converted number types.
 *
 ******************************************************************************/

export type NumberToString<T> = {
	[K in keyof T]: T[K] extends number ? `${T[K]}` : T[K]
}
