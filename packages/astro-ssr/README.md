# @haq/astro-ssr

A lightweight library for building fully type safe HAQ Astro SSR projects in node.

## Getting Started

Install dependencies:

```bash
pnpm i -D jsr:@haq/astro astro @astrojs/check @types/node typescript
pnpm i jsr:@haq/astro-ssr @astrojs/node
```

Setup your Astro config:

```typescript
// astro.config.ts

import node from "@astrojs/node";
import { removeAstroAttributes } from "@haq/astro/tools";
import { defineConfig } from "astro/config";

export default defineConfig({
	output: "server",
	adapter: node({
		mode: "middleware",
	}),
	vite: {
		plugins: [removeAstroAttributes()],
		server: {
			ws: {
				clientPort: 4321, // for Vite's HMR to work properly
			},
		},
	},
	// your settings
});
```

Add a `middleware.ts` file in your Astro `srcDir`.
This will allow you to use Astro's built-in Vite HMR in dev mode. Otherwise you would have to build every time before viewing changes.

```typescript
// middleware.ts

import { devMiddleware } from "@haq/astro-ssr/astro-mw";

export const onRequest = devMiddleware;
```

Then define your types once.

```typescript
// server.ts

import type { HAQ_PartialMarkup_1 } from "path-to-your-generated-haq-markup";
import type { HAQ_RenderedRoute } from "path-to-your-generated-haq-routes";

import { makeServer } from "@haq/astro-ssr";
import { mainRouter } from "./main/index.js";

const Server = makeServer<HAQ_RenderedRoute, HAQ_PartialMarkup_1>();
export type T_Server = typeof Server;

const App = Server.App(
	{
		PORT: Number(ENV.PORT),
		IS_DEV_MODE: ENV.NODE_ENV === "development",
		ASTRO_CONFIG: {
			SSR_HANDLER: ssrHandler,
			CLIENT_DIR: "@dist/@astro/client",
		},
	},
	[
		// your routers
		mainRouter(Server),
	],
);

export type AppTypes = typeof App;
```

Then extend the Astro Locals interface:

```typescript
import type { AppTypes } from "./server.js"

declare global {
	namespace App {
		interface Locals extends AppTypes["ASTRO_LOCALS"] {}
	}
}
```

Then define your client side types once:

```typescript
// client/index.ts

import { makeFetch } from "@haq/astro-ssr/client";

export const Fetch = makeFetch<AppTypes["CLIENT"]>();
```

## Define your first PAGE route

For this following example, we assume you have an `index.astro` page in the Astro `/pages` directory. Otherwise it will show a compile time error.

Define the router first:

```typescript
// main/index.ts

import type { T_Server } from "../server.js";
import { indexPage } from "./index-page.js";

function makeRouter(Server: T_Server) {
	return Server.defineRouter("/");
}

export type T_Router = ReturnType<typeof makeRouter>;

export function mainRouter(Server: T_Server) {
	const Router = makeRouter(Server);

	return [indexPage(Router)];
}
```

Define your PAGE route:

```typescript
// main/index-page.ts

import type { T_Router } from "./index.js";

export function indexPage(Router: T_Router) {
	type AstroProps = { title: string };

	const route = Router.definePAGEContext<AstroProps>()({
		route: "/",
	});

	type RT = typeof route.T_response;

	route.PAGE({
		controller: (context): RT => {
			// do stuff
			return {
				title: "Hellow, World!",
			};
		},
	});

	return route;
}
```

And now the Astro page will know about `title`.

```html
// index.astro --- const data = Astro.locals["/"] // data.title is of type string const { title } = data ---
<div>
	<span>{title}</span>
</div>
```

## Define your first POST route

```typescript
// main/post-profile.ts

import type { T_Router } from "./index.js";

export function postProfile(Router: T_Router) {
	type Response = {
		imgSrc: string;
	};

	const route = Router.definePOSTContext<AstroProps>()({
		route: "/profile",
		body: z.object({
			userName: z.string(),
		}),
	});

	type RT = typeof route.T_response;

	route.POST({
		controller: async (context): Promise<RT> => {
			const { userName } = context.getBody();

			const imgSrc = await getImgSrcFromSomePlace(userName);

			// do stuff
			return {
				imgSrc,
			};
		},
	});

	return route;
}
```

And now we'll add this route to our main router:

```typescript
// main/index.ts

import type { T_Server } from "../server.js";
import { indexPage } from "./index-page.js";
import { postProfile } from "./post-profile.js";

function makeRouter(Server: T_Server) {
	return Server.defineRouter("/");
}

export type T_Router = ReturnType<typeof makeRouter>;

export function mainRouter(Server: T_Server) {
	const Router = makeRouter(Server);

	return [indexPage(Router), postProfile(Router)];
}
```

And now we can safely make a POST request call from the client side.

```typescript
// client/profile.ts

import { Fetch } from "./index.js";

const response = await Fetch.post("/profile", { userName: "John Doe" });
if (!response.success) {
	// handle error
	return;
}

// now response has imgSrc
```

## Donate

This project has been developed and maintained by me alone.

A coffee would be much appreciated - [Buy me a coffee](https://ko-fi.com/aminobelyamani)

Thanks!
