//------------------------------------------------------------------------------
//
// Extending native Response interface
//
//------------------------------------------------------------------------------

export interface I_Response extends Response {
	context: I_InternalResContext
}

//------------------------------------------------------------------------------
//
// Context used internally
//
//------------------------------------------------------------------------------

export interface I_InternalResContext {
	readonly getAfterwareData: () => unknown
	readonly setAfterwareData: (data: unknown) => void
}
