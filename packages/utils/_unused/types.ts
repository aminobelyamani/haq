/* Flatten complex type for better viewing on hover
-----------------------------------------------*/

export type Flatten<T> = {
	[K in keyof T]: T[K]
}

/* Prettify Intersection types
-----------------------------------------------*/

export type Prettify<T> = {
	[K in keyof T]: T[K]
} & NonNullable<unknown>

/* Sealed empty, doesn't allow any properties
-----------------------------------------------*/

// export type SealedEmptyObject = Sealed<EmptyObject>

/* Swap all propertiy types that have Date with string
-----------------------------------------------*/

export type SwapDatesWithStrings<T> = {
	[K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K]
}

/* Ensure a type literal extends another type literal
-----------------------------------------------*/

export type EnsureLiteral<T, U extends string> = T extends U ? T : never

/* Remove id property from object
-----------------------------------------------*/

export type NoId<T> = Omit<T, "id">

/*******************************************************************************
 *
 * Extract param route from GET route that have a colon as a param ['./route/:param']
 *
 ******************************************************************************/

export type InferredParamRoutes<T> = T extends `${infer P}/:${infer R}` ? `${P}/[${R}]` : T

// export type AllOrNothing<T> = T | { [K in keyof T]?: never }

export type IsFullUnion<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false

export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

// export type IsObjectUnion<T> = [T] extends [object] ? IsUnion<T> : false

// export type Exact<A, B> = A extends B ? (B extends A ? A : never) : never

/* Omit properties recursively
-----------------------------------------------*/

export type UnionOmit<T, K extends string | number | symbol> = T extends unknown ? Omit<T, K> : never
export type NullUnionOmit<T, K extends string | number | symbol> = null extends T
	? UnionOmit<NonNullable<T>, K>
	: UnionOmit<T, K>
export type RecursiveOmitHelper<T, K extends string | number | symbol> = {
	[P in keyof T]: RecursiveOmit<T[P], K>
}

export type RecursiveOmit<T, K extends string | number | symbol> = T extends {
	[P in K]: unknown //any, if unknown doesn't work
}
	? NullUnionOmit<RecursiveOmitHelper<T, K>, K>
	: RecursiveOmitHelper<T, K>
