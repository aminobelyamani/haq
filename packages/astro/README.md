# @haq/astro

A compile time framework and a lightweight runtime library for building type safe, performant, and scalable vanilla Astro projects.

## Why HAQ Astro?

Some of you developers out there enjoy working with vanilla html/css/js and you just wish that you could build all your projects, from small static websites to fully fledged web applications, in pure vanilla.
What is stopping you from doing so? You've heard it a million times - It is not scalable/maintainable, just use a framework.

Why is it not scalable/maintainable? It boils down to 2 main reasons:

- Multiple sources of truths.
- Poor or loose architecture.

What is a web page really? A web page is essentially the markup, written in html. CSS is then used to style said markup. Javascript code is then written to add interactivity to said markup.
There lies our first problem.
Both the css and js refer to the markup, yet they never know about each other.
What should be 1 source of truth is now 3 different sources of truths.
Make one change to your markup and the rafactoring hell begins.
For example, change one child of an html element and make it a sibling of the parent, and everything brakes. The css that targeted that child no longer applies, the javascript targeting that element will return `undefined`, etc.

As for the architecture, it usually is up to the developer to devise some sort of strategy that would allow better scaling and code maintainability. But we are only human. As the project grows, we find ourselves having to reexamine our strategy and make tons of changes.

HAQ Astro has a solution for both:

- One source of truth.
    - All css and js that refers to a specific markup knows about that markup.
    - There are no arbitrary "magic" strings (selectors, attributes, etc.).
    - Everything is strictly typed.
        - `.astro` and `.ts` files use the typescript compiler.
        - `.astro` and `.css` files use the HAQ Astro compiler.
- Opinionated event-driven achitecture (for websites requiring interactivity).
    - Reusable markup components are the building blocks for any component.
    - Web Components are used when a component requires interactivity.
        - Web Components only know about their children.
        - Web Components can have other Web Components as children.
        - A parent Web Component can not access the DOM of a child Web Component, it can only call its public methods.
        - Web Components can receive custom events from child Web Components.
        - Web Components can emit custom events that bubble to parent.
    - App Components are used when sibling Web Components need to interact with each other.
        - App Components can not access the DOM of a child Web Component, it can only call its public methods.
        - App Components can receive custom events from child Web Components.
        - App Components can emit app events.
    - App events are used when App Components need to interact with each other.
        - App events know about all App Components present in a given page.
        - App events can call methods of App Components.

HAQ Astro has been used to build many static websites and fully fledged applications.

The overall benefit of using HAQ Astro:

- Only ships javascript that you write (a simple static website with only html and css will ship 0kb of js).
- Performant at runtime (uses native browser API).
- Smaller bundle size (no bloated scaffolding and dependencies).
    - For example, a multi-page application with view transitions and hundreds of Web Components (dashboards, calendars, etc...) would come out to be ~30kb (gzipped) of javascript.
    - Less bandwidth costs for everyone (data plans on smart devices & CDN hosting).
- Fast loads, even on slow connections.
- What you code is what you get.
    - Easy to track runtime bugs, no frameworks in the way.
- Code you write lives forever, or as long as browsers exist.
- Fun to code using CAR (compiler-assisted refactoring)
    - Never worry about making changes.
    - Make one change and the errors will guide you.

## Getting Started

### Installation

**NOTE** - Since these dependencies are mostly used at compile time, and Astro builds any runtime code for you, you can install all these dependencies as `devDependencies`.

Install required dependencies:

```bash
pnpm i -D jsr:@haq/astro astro typescript
```

Recommended dependencies:

```bash
pnpm i -D @astrojs/check @haq/utils
```

### CLI

First, you will need to add a launcher wrapper for the CLI.

```ts
// src/haq.ts

import "@haq/astro/cli";
```

Then, add it as a script in your package.json:

```json
"scripts": {
    "haq": "node src/haq.ts",
}
```

Then you can use it like this:

```bash
pnpm haq [command] [...flags]
```

You can run `pnpm haq help` for a full list of available commands.

### HAQ Astro Config

The HAQ Astro config file is named `haq.config.json` and should live in the root of your project.

You can generate one by running `pnpm haq init`.

#### `projectDir`

**Type:** `string`

Set the directory to scan files for type and context generation.

#### `outDir`

**Type:** `string`

Set the directory where HAQ Astro will output its generated files.

**NOTE** - All generated files will be contained in a generated folder named `_haq/`

#### `globalCssDir`

**Type:** `string`

Set the directory where your global css lives.

#### `astroDirs`

**Type:** `string[]`

Array of directories where your Astro `/pages` dir lives.

### Astro Config

**NOTE** - It is recommended to use the `removeAstroAttributes()` plugin from `@haq/astro/tools`. It will remove all the compile time attributes from your markup before rendering, reducing the noise in the markup significantly.

```ts
// astro.config.ts

import { removeAstroAttributes } from "@haq/astro/tools";
import { defineConfig } from "astro/config";

export default defineConfig({
	// your config
	vite: {
		plugins: [removeAstroAttributes()],
	},
});
```

### Typescript Config

In the spirit of this framework, we recommend using the following typescript config options to ensure maximum type safety.

```json
{
	"compilerOptions": {
		/* Language and Environment */
		"target": "ESNext",
		/* Modules */
		"module": "ESNext",
		"moduleResolution": "bundler",
		"moduleDetection": "force",
		"verbatimModuleSyntax": true,
		"resolveJsonModule": true,
		/* Interop Constraints */
		"esModuleInterop": true,
		"isolatedModules": true,
		"forceConsistentCasingInFileNames": true /* Ensure that casing is correct in imports. */,
		/* Type Checking */
		"strict": true /* Enable all strict type-checking options. */,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"allowUnusedLabels": false,
		"noUncheckedSideEffectImports": true,
		"noFallthroughCasesInSwitch": true,
		"allowUnreachableCode": false,
		"noUncheckedIndexedAccess": true /* Add 'undefined' to a type when accessed using an index. */,
		"noPropertyAccessFromIndexSignature": true,
		"erasableSyntaxOnly": true,
		"noImplicitOverride": true,
		"exactOptionalPropertyTypes": true,
		"skipLibCheck": true /* Skip type checking all .d.ts files. */,
		/* Output */
		"noEmit": true /* Astro builds from typescript files, no need to emit. */
	},
	"include": ["src"],
	"exclude": ["node_modules"]
}
```

## Tutorial

Since this project is in its infancy and proper documentation is still in progress, the tutorial serves as the current documentation.

[Start Tutorial](https://github.com/aminobelyamani/haq/tree/master/packages/astro/Tutorial.md)

## IDE Support

- Visual Studio Code - [HAQ Astro Visual Studio Code Extension](https://marketplace.visualstudio.com/items?itemName=aminobelyamani.haq-astro-vsce)
    - Provides completions and inline diagnostics in Astro (`.astro`) and CSS (`.css`) files.
- Zed - No extension at the moment. It is currently being developed.

## Useful Links

- [Astro](https://astro.build/) - The official website of Astro.
- [Astro with Typescript 7](https://github.com/aminobelyamani/astro-with-ts7) - A simple hack to make Astro work with Typescript 7.

## Donate

I am the sole developer and maintainer of this project.

A coffee would be much appreciated - [Buy me a coffee](https://ko-fi.com/aminobelyamani)

Thanks!
