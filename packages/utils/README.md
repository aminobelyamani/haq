# @haq/utils

Compile time and runtime typescript utilities for common use cases.

## Examples

```ts
import { entriesFromObject } from "@haq/utils";

for (const [key, value] of entriesFromObject(obj)) {
	// the type of obj will be inferred
	// provides type-safe access and intellisense to key/value
}
```

```ts
import type { Sealed } from "@haq/utils/types";

type MyObj = {
	name: string;
	email: string;
};

type MySealedObj = Sealed<MyObj>;
// now any object of this type can not accept any excess properties
// useful for avoiding sending in sensitive data by accident
```
