# Tutorial

Since this project is in its infancy and proper documentation is still in progress, this tutorial serves as the current documentation which demonstrates HAQ Astro's core features.

We'll start with a simple static web page with no javascript, then we'll explore HAQ Astro's features incrementally, until we end up with a multi-page website which includes interactivity and view transitions.

**NOTE** - It is assumed you have basic knowledge of Astro and Typescript.

## Setup

For the purpose of this tutorial, and assuming you followed the [Getting Started](https://github.com/aminobelyamani/haq/tree/master/packages/astro/README.md#getting-started) steps, your HAQ Astro config file should look like this:

```json
// haq.config.json

{
	"$schema": "./node_modules/@haq/astro/_static/haq_config_schema.json",
	"projectDir": "./src",
	"outDir": "./src",
	"globalCssDir": "./src/css",
	"astroDirs": ["./src"]
}
```

And your project structure should look like this:

**NOTE** - Besides the required Astro `src/pages/` folder, all other folders can be organized and renamed to your own liking.

- `package.json`
- `haq.config.json`
- `astro.config.ts`
- `tsconfig.json`
- `src/`
    - `haq.ts` - Your CLI wrapper
    - `pages/` - Your Astro pages.
    - `css/` - Folder where your global css lives.

Now let's add a path alias for the generated HAQ folder.
This will allow us to have clean import paths and the flexibility of changing the `outDir` path for HAQ.

```json
// tsconfig.json

{
	"compilerOptions": {
		"paths": {
			"@haq/*": ["./src/_haq/*"] /* Path alias for generated haq folder */
		}
	}
}
```

Now we are ready to develop our Astro project.

Open a new terminal window and run the following command:

```bash
pnpm haq check -w
```

This will generate files and check for any errors.
We're including the `-w` command to watch for any changes, allowing for a smooth DX.

**NOTE** - It is recommended to add this command (without the watch flag) to your CI pipeline.

## Part 1 - Scaffolding

### Global CSS

Let's start by adding some css to our project that will be used globally.
Unlike the css we will be writing later on for components, this css is markup agnostic.
It is mainly for semantic resets, utility classes, and defining root custom properties.
Your global css should live inside the `globalCssDir` defined in your HAQ Astro config.

Here are some of the rules HAQ Astro enforces in your global css:

- No child type selectors allowed. The following would report an error:
    - ```css
      .some-class button {
      }
      ```
    - ```css
      button div {
      }
      ```
- No id selectors allowed. The following would report an error:
    - ```css
      button#myButton {
      }
      ```
- No custom element type selectors allowed. The following would report an error:
    - ```css
      my-elem {
      }
      ```
- Only valid native type selectors allowed. The following would report an error:
    - ```css
      frame {
      }
      ```

Your global css is the source of truth for the following:

- Custom properties defined in the `:root` pseudo-class selector.
- Utility classes.

#### Custom Properties

- Create a new css file inside `src/css/` named `root.css`.
- Now let's add some custom properties:

```css
/* src/css/root.css  */

:root {
	--clr-primary: hsl(0deg 0% 9.41%);
	--clr-accent: hsl(180.3deg 100% 70.95%);
	--clr-text: white;
	--clr-text-dim: hsl(0deg 0% 23.22%);

	--fontFamily: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
	--fontSize: clamp(1.35rem, 1.298rem + 0.2598vw, 1.4994rem);
}
```

#### Utility Classes

- Create a new css file inside `src/css/` named `utility.css`.
- Now let's add some utility classes:

```css
/* src/css/utility.css  */

.min-full-screen {
	width: 100%;
	min-height: 100vh;
}

.flex {
	display: flex;
}

.flex-center {
	align-items: center;
	justify-content: center;
}

.clr-primary {
	color: var(--clr-primary);
}

.clr-accent {
	color: var(--clr-accent);
}

.text-center {
	text-align: center;
}

.padding-200 {
	padding: 2rem;
}
```

#### CSS Resets

- Create a new css file inside `src/css/` named `reset.css`.
- Now let's add some common resets:

```css
/* src/css/reset.css  */

/* Global Reset
-----------------------------------------------*/

* {
	margin: 0;
}

*,
:after,
:before {
	box-sizing: border-box;
}

/* Semantic Reset
-----------------------------------------------*/

html,
body {
	padding: 0;
}

body {
	color: var(--clr-text);
	font-family: var(--fontFamily);
	font-size: var(--fontSize);
	line-height: 1.5;
	scroll-behavior: smooth;
	overscroll-behavior: none;
	background-color: var(--clr-primary);
}

img,
video,
svg {
	max-width: 100%;
	display: block;
}

img,
video {
	height: auto;
}

h1,
h2,
h3,
h4 {
	line-height: 1.3;
	text-wrap: balance;
	margin-bottom: 2rem;
}

input,
label,
select,
button,
textarea {
	display: inline-block;
	appearance: none;
	margin: 0;
	padding: 0;
	border: none;
	background: none;
	outline: none;
	vertical-align: middle;
	white-space: normal;
	-webkit-tap-highlight-color: transparent;
	font-family: inherit;
	font-size: inherit;
	color: inherit;
}

button {
	cursor: pointer;
}

button:disabled {
	cursor: not-allowed;
}
```

Now let's consolidate these three files into one file that imports all.

- Create a new css file inside `src/css/` named `styles.css`.
- Now let's import our css:

```css
/* src/css/styles.css  */

@import "./root.css";
@import "./reset.css";
@import "./utility.css";
```

### Astro Scaffold

Now we are ready to develop our html scaffold.

- Create a folder inside `src/` named `layouts`.
- Create a new file named `Scaffold.astro`.
- Add the following:

```tsx
---
// src/layouts/Scaffold.astro

import type { HAQ_PageRoute } from "@haq/routes-1";

import "../css/styles.css";

interface Props {
	title: string;
	x_page: HAQ_PageRoute;
}
const { title, x_page } = Astro.props;
---

<html lang="en" {x_page}>
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, minimum-scale=1.0,  maximum-scale=1.0, user-scalable=no" />
		<meta name="mobile-web-app-capable" content="yes" />
		<meta name="msapplication-tap-highlight" content="no" />
		<meta name="HandheldFriendly" content="true" />
		<title>{title}</title>
	</head>
	<body>
		<slot name="body:" />
	</body>
</html>

```

You'll notice that the `x_page` attribute is required and typescript will show an error if the `<html>` tag is missing that attribute or doesn't satisfy `/${string}`. HAQ Astro provides a generated type `HAQ_PageRoute` which is a union of all the existing astro pages in your project. Since we have no pages yet, that type currently resolves to `never`.
We'll be leveraging this type later on in this tutorial as we explore more advanced features.

Another thing to notice is the slot name `"body:"` inside of the `<body>` element. This is another rule enforced by HAQ Astro.
Certain semantic tags are only meant to be used once or not have children of its own kind. For example, there should never be a `<body>` inside of another `<body>`.
So whenever you are adding slots inside these "fragile" tags, HAQ Astro will force you to add a slot name that begins with its tag name followed by a colon, in this case `"body:"`.

Here is a full list of these "fragile" tags:

- a
- audio
- body
- button
- canvas
- footer
- form
- head
- header
- html
- img
- input
- label
- link
- main
- nav
- picture
- select
- style
- table
- tbody
- td
- textarea
- tfoot
- th
- thead
- tr
- video

Now we're all set up to start building Astro pages.

## Part 2 - Hello, World!

Now we are ready for our first Astro page.
In order to keep our watched process (`pnpm haq check -w`) running, open up a new terminal window and start the Astro dev server.
This will allow you to see our changes live in the browser.

```bash
pnpm astro dev
```

### `MainContainer`

Let's add a component that will serve as a wrapper for our content.

- Create a folder inside `src/` named `components`.
- Create a new file inside `src/components/` named `MainContainer.astro`.
- Add the following:

```tsx
---
// src/components/MainContainer.astro

---

<div class="min-full-screens flex flex-center padding-200">
	<slot />
</div>
```

You'll notice 2 errors.

The first error says: `Missing "Props" type or interface in frontmatter.`

This is because Astro is pretty loose when it comes to component props.
For example, if no frontmatter was present, then any prop could be passed in to our `<MainContainer>` component.
Once again, to maximize type safety, HAQ Astro enforces the use of frontmatter and a Props type or interface.

Since our `MainContainer` component is not expecting any props at the moment we can add the following to the frontmatter:

```tsx
---
// src/components/MainContainer.astro

import type { EmptyObject } from "@haq/utils/types";

interface Props extends EmptyObject {}
---
```

**NOTE** - `EmptyObject` is a type alias available in the recommended package `@haq/utils`.
It is simply an alias for `Record<never, never>`.

The second error says: `Invalid class "min-full-screens". Define "min-full-screens" in your global css folder.`.

We have a typo in that class and HAQ Astro enforces that we only use classes that are defined inside our global css folder.

Let's fix the typo. Now your component should look like this:

```tsx
---
// src/components/MainContainer.astro

import type { EmptyObject } from "@haq/utils/types";

interface Props extends EmptyObject {}
---

<div class="min-full-screen flex flex-center padding-200">
	<slot />
</div>

```

### First Astro Page

- Create a new file inside `src/pages/` named `index.astro`.
- Add the following:

```tsx
---
// src/pages/index.astro

import MainContainer from "../components/MainContainer.astro";
import Scaffold from "../layouts/Scaffold.astro";
---

<Scaffold title="Hello, World!" x_page="/">
	<MainContainer>
		<div class="text-center">
			<h1 class="clr-accent">Hello, World!</h1>
		</div>
	</MainContainer>
</Scaffold>

```

You'll first notice that our `<Scaffold>` component now accepts one value (`"/"`) for the `x_page` attribute.
Since our Astro pages are the source of truth, any change to these pages will be reflected accross all places that reference `x_page`.

You'll also notice another error: `"MainContainer" must take in a slot attribute with name: "body:"`.

In addition, if you navigate to `localhost:4321`, you will see an empty screen, meaning our page is not rendering how we expect it to.
Since Astro expected a named slot inside of our `<Scaffold>` component, and we never passed a slot attribute, none of the contents of `<MainContainer>` get rendered.
Let's fix the error by adding the slot attribute with a value of `body:`.

Your markup should look like this now:

```tsx
---
// src/pages/index.astro

import MainContainer from "../components/MainContainer.astro";
import Scaffold from "../layouts/Scaffold.astro";
---

<Scaffold title="Hello, World!" x_page="/">
	<MainContainer slot="body:">
		<div class="text-center">
			<h1 class="clr-accent">Hello, World!</h1>
		</div>
	</MainContainer>
</Scaffold>

```

Now back to the browser, you should see your first page with the "Hello, World!" title in the center of the screen.

## Part 3 - Attributes

### Native Attributes

Astro's internal DOM types allow for type checking attributes in Astro markup.
For example, a `<button>` cannot have an attribute called `sdfs` or a valid attribute like `type` but with an invalid value like `"display"`.

HAQ Astro leverages these types and extends it to all the places it is referenced. So now we have type safe CSS as well!

So now in our css, we can do:

```css
button[type="submit"] {
}
```

And the following will report an error, because `"display"` is not a valid value for the `type` attribute on the `button` element:

```css
button[type="display"] {
}
```

### Custom Attributes

Sometimes it is useful to have our own custom attributes on native html elements, or even on every element (`*` selector).
For example, on a web page that supports multiple languages, it would be useful to have a global attribute that when set, applies the styling text direction (`dir`) from right to left (`rtl`) instead of the default left to right (`ltr`).

Since these custom attributes are applied globally, we lose the markup context and it can get messy.
So it is recommended to use them minimally and with caution.
There will be a much better use for them when we explore custom elements and other advanced features.

For the sake of this tutorial, let's add a global custom attribute for our language scenario and a custom attribute on an anchor element.

The source of truth for custom attributes is defined in a `*.haq.json` file. The file can be anywhere inside the `projectDir` defined in your HAQ Astro config.

- Create a new file inside `src/` named `global.haq.json`.
- Add the following:

```json
{
	"native-elements": [
		{
			"tag": "*",
			"attrs": [
				{
					"name": "d_lang",
					"value": ["ar"]
				}
			]
		},
		{
			"tag": "a",
			"attrs": [
				{
					"name": "d_active"
				}
			]
		}
	]
}
```

The `attrs` key takes in an array of the following object:

- `name` - The attribute name prefixed with `d_` (required).
- `value` - The value type the attribute accepts (required).
    - `string` - Any string.
    - `number` - A string number (`"0"`, `"1"`, ...).
    - An array of literal string values.
- `required` - A boolean value indicating if this attribute is required or not. Defaults to false (optional).

**NOTE** - Since Astro allows for any attribute that starts with `data-`, type safety is unfortunately thrown at the window when using data attributes.
Consequently, HAQ Astro enforces that all custom attributes begin with the prefix `d_`.

**NOTE** - HAQ Astro allows custom attributes on the following native html tags:

- "*" -> star selector, applied to any element
- a
- area
- audio
- base
- blockquote
- button
- canvas
- col
- colgroup
- data
- del
- details
- dialog
- embed
- fieldset
- form
- html
- iframe
- img
- input
- ins
- keygen
- label
- li
- link
- map
- menu
- meta
- meter
- object
- ol
- optgroup
- option
- output
- param
- progress
- q
- select
- source
- table
- td
- textarea
- th
- time
- track
- video

Now let's add some styles to our `d_lang` global custom attribute and our anchor element. Add the following to our `reset.css`:

```css
/* src/css/reset.css  */

a {
	display: inline-block;
	text-decoration: none;
	color: currentColor;
	padding: 0 1rem;
	border-radius: 0.5rem;
	outline: none;
}

@media (hover: hover) {
	a:hover {
		color: var(--clr-accent);
	}
}

a[d_active] {
	cursor: not-allowed;
	background-color: var(--clr-text-dim);
	color: var(--clr-accent);
}

*[d_lang="ar"] {
	direction: rtl;
	font-family: system-ui;
}
```

Now let's add the arabic translation of "Hello, World!" to our `index.astro` page:

```tsx
---
// src/pages/index.astro

import MainContainer from "../components/MainContainer.astro";
import Scaffold from "../layouts/Scaffold.astro";
---

<Scaffold title="Hello, World!" x_page="/">
	<MainContainer slot="body:">
		<div class="text-center">
			<h1 class="clr-accent">Hello, World!</h1>
			<h1 class="clr-accent" d_lang="ar">مرحبا بالعالم!</h1>
		</div>
	</MainContainer>
</Scaffold>


```

In your browser, you should see the arabic "Hello, World!" title styled properly.

## Part 4 - Components

Let's add a simple header and nav to our `Scaffold` component.

### NavLink Component

- Create a new file inside `src/components/` named `NavLink.astro`.
- Add the following:

```tsx
---
// src/components/NavLink.astro

import type { HAQ_PageRoute } from "@haq/routes-1";

interface Props {
	href: HAQ_PageRoute;
	x_page: HAQ_PageRoute;
	text: string;
}
const { href, text, x_page } = Astro.props;
---

<a href={x_page === href ? undefined : href} d_active={x_page === href ? true : undefined}>{text}</a>

```

### MyHeader Component

- Create a new file inside `src/components/` named `MyHeader.astro`.
- Add the following:

```tsx
---
// src/components/MyHeader.astro

import type { HAQ_PageRoute } from "@haq/routes-1";

import NavLink from "./NavLink.astro";

interface Props {
	x_page: HAQ_PageRoute;
}

const { x_page } = Astro.props;
---

<header>
	<nav class="flex flex-center">
		<NavLink text="Home" href="/" {x_page} />
	</nav>
</header>

```

Now we want to style this component, but our css does not know about this component's markup.
This is where the HAQ directives come in to play.

Adding a `x_haq` directive to any element (not aliased component) will generate markup contexts for us to reference that component.

Let's add the directives for the elements we want to target:

```tsx
// src/components/MyHeader.astro

<header x_haq>
	<nav class="flex flex-center" x_haq>
		<NavLink text="Home" href="/" {x_page} />
	</nav>
</header>
```

We immediately get an error: `You must have either an id, or x_sel selector on this native html element: header`.

This is because there could be other components elsewhere in your Astro project that use the `<header>` tag and we don't want any unexpected behavior if we were to target `header` wihout any specific selector.

Let's add an `x_sel` attribute to both `<header>` and `<nav>`.

```tsx
// src/components/MyHeader.astro

<header x_sel="header" x_haq>
	<nav class="flex flex-center" x_sel="nav" x_haq>
		<NavLink text="Home" href="/" {x_page} />
	</nav>
</header>
```

Now let's style our `MyHeader` component.

- Create a new css file inside `src/components/` named `MyHeader.css`.
- Add the following:

```css
/* src/components/MyHeader.css */

header[x_sel="header"] {
	position: fixed;
	top: 0;
	width: 100%;
	padding: 1rem 2rem;
}

header[x_sel="header"] nav[x_sel="nav"] {
	font-size: 1rem;
	flex-wrap: balance;
	column-gap: 2rem;
	row-gap: 0.5rem;
}
```

Now you'll see another error: `No Astro file imports this css file.`.

In order for HAQ Astro to know the context of this css file, the Astro component in question must import the css file in its frontmatter.

```ts
/* src/components/MyHeader.astro */

import "./MyHeader.css";
```

Now we'll get full type safety in our `MyHeader.css` file. Any changes made to the markup, will be reflected in the css.

Now we can add the `<MyHeader>` component to our `Scaffold` component inside the `<body>` tag.

```tsx
---
// src/layouts/Scaffold.astro

import MyHeader from "../components/MyHeader.astro";
---

<body>
	<MyHeader {x_page} />
	<slot name="body:" />
</body>
```

In your browser, you should see a nav at the top of the page with one "Home" link.

## Part 5 - Custom Elements

Custom elements can be very useful in making the markup more readable and understandable.
Let's imagine a scenario where we have a bunch of svg icons that we use in a given project.
Instead of having separate svg components or separate css classes for each icon, it would be much cleaner to have one element, let's call it `<svg-icon>` that handles all the icons.

Just like native elements, the source of truth for custom elements is defined in a `*.haq.json` file.
The file can be anywhere inside the `projectDir` defined in your HAQ Astro config.

### Folder Structure (recommended)

As your project grows it is generally a good idea to start consolidating files that are related into their own folders.
Every custom element component has a config file that defines it (`*.haq.json`), a markup file (`.astro`), and a css file (`.css`).
So for our `<svg-icon>` component, it would be a good idea to put all three files inside a folder named `SvgIcon`.

The contents of that folder would be:

- `SvgIcon.haq.json`
- `SvgIcon.astro`
- `SvgIcon.css`

You can imagine it becoming quite tedious to create a new folder and 3 files every time you want to create a new custom element.

HAQ Astro provides a command to help with scaffolding and generating these folders quickly.
Let's use the `ce` command to generate our custom element folder.

This command takes in 2 flags:

- `-t` or `--tag`: Tag name for your custom element (must be a valid custom element with at least one dash).
- `-o` or `--output`: Output dir path.

Now let's run the following command:

```bash
pnpm haq ce -t svg-icon -o src/components
```

### Custom Element Config

Now let's define some attributes and custom css properties for this custom element:

- Go to the file: `src/components/SvgIcon/SvgIcon.haq.json`.
- Replace the code with the following:

```json
{
	"custom-elements": [
		{
			"tag": "svg-icon",
			"attrs": [
				{
					"name": "d_icon",
					"value": ["html", "css"],
					"required": true
				}
			],
			"cssStaticVars": ["width", "height"]
		}
	]
}
```

The `width` and `height` values in `cssStaticVars` are custom properties that can only be defined in your css where `svg-icon` is the direct parent selector. Then, those custom properties can be used as css variables anywhere where any ancestor of the targeted selector is `svg-icon`.

### Markup

Now let's go to our markup (`SvgIcon.astro`) for this custom element.
You'll notice these 2 lines at the top of the frontmatter:

```ts
// src/components/SvgIcon/SvgIcon.astro

import type { HTMLAttributes } from "astro/types";
type T = HTMLAttributes<"svg-icon">;
```

The type alias `T` will be useful to use in our `Props` interface as we add or modify this custom element's attributes in its config file `SvgIcon.haq.json`.

You might be tempted to simply do this:

```ts
interface Props extends T {}
const { ...attrs } = Astro.props;
```

And then in your markup:

```tsx
<svg-icon {...attrs} x_haq></svg-icon>
```

Unfortunately, there are a couple of problems with that.

First, you'll get an error: `Avoid using spread attributes, type checking is not as precise. Use explicit attributes instead.`

On the other hand, by extending `T` in `Props`, now any component that calls this component can pass any attributes without knowing if the actual component implements those attributes.

Here is an example of our custom element only implementing `d_icon`:

```tsx
<svg-icon d_icon={attrs.d_icon} x_haq></svg-icon>
```

So if somewhere else we call this component like this:

```tsx
<SvgIcon d_icon="html" lang="en" dir="rtl" />
```

We wouldn't get any error reported, even though `<svg-icon>` never implements `lang` or `dir` as an attribute.

As a solution, we recommend explicitly listing the attributes in `Props` and use `T` as a helper.
So now your `SvgIcon.astro` file should look like this:

```tsx
---
import type { HTMLAttributes } from "astro/types";
type T = HTMLAttributes<"svg-icon">;

import "./SvgIcon.css";

interface Props {
	d_icon: T["d_icon"];
}

const { ...attrs } = Astro.props;
---

<svg-icon d_icon={attrs.d_icon} x_haq></svg-icon>
```

Now let's add a couple of icons:

- Create a new file inside `src/components/SvgIcon/` named `html.svg`.
- Add the following:

```html
<!-- src/components/SvgIcon/html.svg -->

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
	<title>HTML Icon</title>
	<path
		d="M128 96L162.9 491.8L319.5 544L477.1 491.8L512 96L128 96zM436.2 223.9L252.4 223.9L256.5 273.3L432.1 273.3L418.5 421.7L320.6 448.7L320.6 449L319.5 449L220.8 421.7L214.8 345.9L262.5 345.9L266 384L319.5 398.5L373.2 384L379.2 321.8L212.3 321.8L199.5 176.2L440.6 176.2L436.2 223.9z"
	/>
</svg>
```

- Create a new file inside `src/components/SvgIcon/` named `css.svg`.
- Add the following:

```html
<!-- src/components/SvgIcon/css.svg -->

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
	<title>CSS Icon</title>
	<path
		d="M544 96L480 464L256.7 544L64 464L83.6 369.2L165.6 369.2L157.6 409.8L274 454.2L408.1 409.8L426.9 312.7L93.5 312.7L109.5 230.7L443.2 230.7L453.7 178L120.3 178L136.6 96L544 96z"
	/>
</svg>
```

### CSS

Now we can add our css:

```css
/* src/components/SvgIcon/SvgIcon.css  */

svg-icon {
	--_width: 200px;
	--_height: 200px;
	display: block;
	width: var(--_width);
	height: var(--_height);
	-webkit-mask-repeat: no-repeat;
	mask-repeat: no-repeat;
	-webkit-mask-position: center;
	mask-position: center;
	background-color: var(--clr-accent);
	pointer-events: none;
}

svg-icon[d_icon="html"] {
	-webkit-mask-image: url(./html.svg);
	mask-image: url(./html.svg);
}

svg-icon[d_icon="css"] {
	-webkit-mask-image: url(./css.svg);
	mask-image: url(./css.svg);
}
```

The `--_width` and `--_height` variables are scoped custom properties and were defined as `cssStaticVars` earlier in our `SvgIcon.haq.json` file.

**NOTE** - Notice that we defined the `width` and `height` custom properties in `cssStaticVars` without the `--_` prefix.
This allows for better readability and lowering the noise in your config files.

### New Astro Page

Now let's use this component in a new page in our project.

- Create a new folder inside `src/pages/` named `tutorial`.
- Create a new file named `custom-elements.astro`.
- Add the following:

```tsx
---
// src/pages/tutorial/custom-elements.astro

import MainContainer from "../../components/MainContainer.astro";
import SvgIcon from "../../components/SvgIcon/SvgIcon.astro";
import Scaffold from "../../layouts/Scaffold.astro";
---

<Scaffold title="Custom Elements" x_page="/">
	<MainContainer slot="body:">
		<div class="text-center">
			<h1>HTML & CSS Are Awesome!</h1>
			<div class="flex flex-center">
				<SvgIcon d_icon="html" />
				<SvgIcon d_icon="css" />
			</div>
		</div>
	</MainContainer>
</Scaffold>

```

You'll notice an error: `"/" doesn't match the current file. Expected "/tutorial/custom-elements".`
`x_page` needs to always refer to the actual Astro page being rendered. Once again, we're applying the "one source of truth" rule.

Let's fix the error:

```tsx
// src/pages/tutorial/custom-elements.astro

<Scaffold title="Custom Elements" x_page="/tutorial/custom-elements">
```

Now let's add a new `<NavLink>` in our `Header` component to view this new page:

```tsx
// src/components/MyHeader.astro

<header x_sel="header" x_haq>
	<nav class="flex flex-center" x_sel="nav" x_haq>
		<NavLink text="Home" href="/" {x_page} />
		<NavLink text="Custom Elements" href="/tutorial/custom-elements" {x_page} />
	</nav>
</header>
```

You'll notice that `<NavLink>` now accepts 2 different values for `href`. That is the core philosophy of HAQ Astro. Add or change something in one place, and all other places where that thing is referenced will know about it.

In your browser, you should see a new link "Custom Elements" at the top. Click on it to navigate to our new page and view those beautiful icons.

So far we haven't used any javascript and we've used HAQ Astro entirely as a compile time framework. With these concepts learned so far, and good knowledge of HTML and CSS, you can achieve a lot before needing any interactivity. But there comes a time where interactivity is a must.

After exploring custom elements, it would make sense to explore adding interactivity to these elements, enter the Web Component!

## Part 6 - Web Components

Web Components are usually used with a shadow DOM and scoped styles.
Meaning, a Web Component's markup is rendered by the browser instead of by the server.
Well what if the markup was regular html rendered by the server, in this case Astro.
Scoped styles would be achieved automatically because of HAQ Astro's opinionated philosophy.
And the javascript logic we write for the Web Component would be type safe.

Let's explore HAQ Astro's take on the Web Component.

### HAQ Astro Web Component

- Web Components are components with encapsulated interactivity.
- Web Components can have child Web Components.
- Web Components can listen to custom events emitted by its child Web Components.
- Web Components can only call public methods of its child Web Components.
- Web Components can emit its own custom events.
- Web Components can expose its own public methods.

Let's try the good old "Hello, World!" of javascript frameworks, the counter!

#### Plus/Minus Buttons

For our counter, we're going to need 2 buttons (plus/minus), and 2 svg icons (plus/minus).

- Create a new file inside `src/components/SvgIcon/` named `plus.svg`.
- Add the following:

```html
<!-- src/components/SvgIcon/plus.svg -->

<svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
	<title>Plus Icon</title>
	<circle cx="13" cy="13" r="12" stroke="#D3D3D3" />
	<path d="M9 13H17" stroke="#181818" stroke-width="1.5" stroke-linecap="round" />
	<path d="M13 9V17" stroke="#181818" stroke-width="1.5" stroke-linecap="round" />
</svg>
```

- Create a new file inside `src/components/SvgIcon/` named `minus.svg`.
- Add the following:

```html
<!-- src/components/SvgIcon/minus.svg -->

<svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
	<title>Minus Icon</title>
	<circle cx="13" cy="13" r="12" stroke="#D3D3D3" />
	<path d="M9 13H17" stroke="#181818" stroke-width="1.5" stroke-linecap="round" />
</svg>
```

Now let's first define these extra values for the `d_icon` attribute we defined earlier in the `SvgIcon.haq.json` file.

```json
// src/components/SvgIcon/SvgIcon.haq.json

{
	"custom-elements": [
		{
			"tag": "svg-icon",
			"attrs": [
				{
					"name": "d_icon",
					"value": ["html", "css", "plus", "minus"],
					"required": true
				}
			],
			"cssStaticVars": ["width", "height"]
		}
	]
}
```

Now let's add the css for these 2 icons:

```css
/* src/components/SvgIcon/SvgIcon.css  */

svg-icon[d_icon="plus"] {
	-webkit-mask-image: url(./plus.svg);
	mask-image: url(./plus.svg);
}

svg-icon[d_icon="minus"] {
	-webkit-mask-image: url(./minus.svg);
	mask-image: url(./minus.svg);
}
```

Now let's create our buttons using these icons:

- Create a new folder inside `src/components/` named `btns`.
- Create a new file named `PlusBtn.astro`.
- Add the following:

```tsx
---
// src/components/btns/PlusBtn.astro

import "./PlusBtn.css";

import SvgIcon from "../SvgIcon/SvgIcon.astro";

interface Props {}
---

<button class="flex flex-center" type="button" aria-label="Add" title="Add" x_sel="plus-btn" x_haq>
	<SvgIcon d_icon="plus" />
</button>

```

Now we would like to style this button, in particular the `svg-icon`.
But right now HAQ Astro does not know that `svg-icon` is a child of `button[x_sel="plus-btn"]`.
So targeting `svg-icon` in our css would report errors.
This is where another HAQ Astro directive comes into play, `x_alias`.

But remember that our `SvgIcon` component is very explicit about the props it accepts, so we must add this directive as a prop first.

```tsx
// src/components/SvgIcon/SvgIcon.astro

import type { HAQ_AliasableComponentProps } from "@haq/astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_alias"> {
	d_icon: T["d_icon"];
}
```

`HAQ_AliasableComponentProps` is a helper type provided by HAQ Astro. It provides compile time props that can be passed to components.
For now we are only interested in aliasing the component, so we can use the typescript utility type `Pick` in order to be as explicit as possible about the props this component accepts.

**NOTE** - Since `x_alias` is a compile time prop, there is no need to add it to the element's attributes.

So now let's add this directive to `<SvgIcon>` in our `PlusBtn` component.
Since we know we'll need to alias the `PlusBtn` component as well for our counter Web Component, let's define it as a prop as well.

Let's also add an optional prop for disabling the button, might be useful for our counter.

Now our `PlusBtn` component should look like this:

```tsx
---
// src/component/btns/PlusBtn.astro

import type { HTMLAttributes } from "astro/types";
import type { HAQ_AliasableComponentProps } from "@haq/astro";
type T = HTMLAttributes<"button">;

import "./PlusBtn.css";

import SvgIcon from "../SvgIcon/SvgIcon.astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_alias"> {
	disabled?: T["disabled"];
}
const { ...attrs } = Astro.props;
---

<button
	class="flex flex-center"
	type="button"
	aria-label="Add"
	title="Add"
	x_sel="plus-btn"
	disabled={attrs.disabled}
	x_haq
>
	<SvgIcon d_icon="plus" x_alias />
</button>

```

Now let's style it.

- Create a new file inside `src/components/btns/` named `PlusBtn.css`.
- Add the following:

```css
/* src/components/btns/PlusBtn.css */

button[x_sel="plus-btn"] svg-icon {
	--_width: 40px;
	--_height: 40px;
}

button[x_sel="plus-btn"][disabled] svg-icon {
	background-color: var(--clr-text-dim);
}

button[x_sel="plus-btn"]:not([disabled]):focus-visible svg-icon {
	background-color: var(--clr-text);
}

@media (hover: hover) {
	button[x_sel="plus-btn"]:not([disabled]):hover svg-icon {
		background-color: var(--clr-text);
	}
}
```

You'll notice that we can safely use `--_width` and `--_height` custom properties because `svg-icon` is the targeted selector and `svg-icon` is a valid child of `button[x_sel="plus-btn"]`.

Now let's do the same for our `MinusBtn` component.

- Create a new file inside `src/components/btns/` named `MinusBtn.astro`.
- Add the following:

```tsx
---
// src/component/btns/MinusBtn.astro

import type { HTMLAttributes } from "astro/types";
import type { HAQ_AliasableComponentProps } from "@haq/astro";
type T = HTMLAttributes<"button">;

import "./MinusBtn.css";

import SvgIcon from "../SvgIcon/SvgIcon.astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_alias"> {
	disabled?: T["disabled"];
}
const { ...attrs } = Astro.props;
---

<button
	class="flex flex-center"
	type="button"
	aria-label="Subtract"
	title="Subtract"
	x_sel="minus-btn"
	disabled={attrs.disabled}
	x_haq
>
	<SvgIcon d_icon="minus" x_alias />
</button>


```

- Create a new file inside `src/components/btns/` named `MinusBtn.css`.
- Add the following:

```css
/* src/components/btns/MinusBtn.css */

button[x_sel="minus-btn"] svg-icon {
	--_width: 40px;
	--_height: 40px;
}

button[x_sel="minus-btn"][disabled] svg-icon {
	background-color: var(--clr-text-dim);
}

button[x_sel="minus-btn"]:not([disabled]):focus-visible svg-icon {
	background-color: var(--clr-text);
}

@media (hover: hover) {
	button[x_sel="minus-btn"]:not([disabled]):hover svg-icon {
		background-color: var(--clr-text);
	}
}
```

### Folder Structure

HAQ Astro is opinionated in regards to Web Components. Here are a the rules to follow:

- The Astro filename of the Web Component is the main identifier.
    - The Web Component class name must be the same as the Astro filename.
    - The typescript filename where the Web Component class is implemented should be the same as the Astro filename.
- The Web Component class must be exported.
- The typescript file where the Web Component class is implemented should be in the same folder as the Astro file.

HAQ Astro provides another command similar to the one we used previously for custom elements.
It will help generate scaffolding for Web Components.
That way you don't have to worry or think about the rules mentioned above.

Let's create a new folder inside `src/` named `web-components`.

Now let's run the following command:

```bash
pnpm haq webc -t my-counter -o src/web-components
```

You should see a new folder inside `src/web-components/` named `MyCounter` with the following files:

- `MyCounter.astro`: Web Component markup.
- `MyCounter.css`: Styling.
- `MyCounter.ts`: Exported Web Component class.
- `MyCounter.haq.json`: Config.

### Markup

Let's go to our markup file `MyCounter.astro`. You'll notice a new directive `x_webc` on the `<my-counter>` element.
This directive tells HAQ Astro that this is a Web Component. Simply using `x_haq` wouldn't work since we need to distinguish between regular components and Web Components.

Let's add some markup inside `<my-counter></my-counter>`:

```tsx
---
// src/web-components/MyCounter/MyCounter.astro

import type { HAQ_AliasableComponentProps } from "@haq/astro";

import "./MyCounter.css";

import MinusBtn from "../../components/btns/MinusBtn.astro";
import PlusBtn from "../../components/btns/PlusBtn.astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_alias"> {}
---

<my-counter class="flex flex-center" x_webc>
	<MinusBtn disabled x_alias />
	<span class="flex flex-center" x_sel="count" x_haq>0</span>
	<PlusBtn x_alias />
</my-counter>

<script>
	import "./MyCounter";
</script>

```

If you're still running the background process (`pnpm haq check -w`) we started in the very beginning of this tutorial, then you will see an error saying `Duplicate selector identifier` for the `svg-icon` selector.

This is another rule enforced by HAQ Astro.
Selectors must be unique within a context.
Since `svg-icon` has different targetable parents in this context (`MinusBtn` & `PlusBtn`), then it is considered a duplicate selector.
This prevents lots of unexpected behavior when querying the DOM, especially when we'll be exploring event delegation.

So how to solve this problem? HAQ Astro provides another directive allowing for dynamic selectors, `x_dyn_sel`.

Since everything is so strictly typed and HAQ Astro enforces many rules, make one change, like making our `svg-icon` a dynamic selector, and all you have to do is follow the compile time errors.
This is usually referred to as CAR (compiler-assisted refactoring). That is the core philosophy of HAQ Astro.

Let's refactor our `SvgIcon` component:

```tsx
---
// src/components/SvgIcon/SvgIcon.astro

import type { HTMLAttributes } from "astro/types";
import type { HAQ_AliasableComponentProps, HAQ_SelectorProps } from "@haq/astro";
type T = HTMLAttributes<"svg-icon">;

import "./SvgIcon.css";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_alias">, Pick<HAQ_SelectorProps, "x_sel"> {
	d_icon: T["d_icon"];
}

const { ...attrs } = Astro.props;
---

<svg-icon d_icon={attrs.d_icon} x_sel={attrs.x_sel} x_dyn_sel x_haq></svg-icon>
```

`HAQ_SelectorProps` is another helper type for passing **runtime** selector props (`x_sel` or `id`) to components. `id` attributes will be explored later, so all we need for now is `x_sel`.

**NOTE** - You'll notice that unlinke the `x_alias` attribute, we have to add the `x_sel` attribute to the `<svg-icon>` element because its value will be used at runtime.

So now, `svg-icon` can only be targeted within `PlusBtn.css` and `MinusBtn.css`.
Meaning, in our `MyCounter` component, we can not target `svg-icon`.
If we do need to style `svg-icon` from within `MyCounter`, then we would have to pass in a different `x_sel` directive to `<SvgIcon>` in both `PlusBtn.astro` and `MinusBtn.astro` files.

Let's add some styles to our `MyCounter` component:

```css
/* src/web-components/MyCounter/MyCounter.css  */

my-counter {
	gap: 2rem;
}

my-counter span[x_sel="count"] {
	width: 40px;
}
```

### Event Delegation

We're going to need a click event listener on those buttons.
HAQ Astro is opinionated about event handling and enforces the use of event delegation.
Meaning, event listeners must be an object with a method named `handleEvent`.
Since we're in the context of a Web Component class, this is how you would add an event listener:

```ts
this.addEventListener("click", this);
```

The source of truth for event types is in your markup.
HAQ Astro requires to explicitly define the event types on the triggering element.
That is done in the markup by using the `x_ev_types` directive.
Since in most cases, events bubble, you can use the root parent element to listen for events, thus creating event delegation.

Let's add this directive to both our components:

```tsx
// src/component/btns/PlusBtn.astro

<button
	class="flex flex-center"
	type="button"
	aria-label="Add"
	title="Add"
	x_sel="plus-btn"
	disabled={attrs.disabled}
	x_ev_types={["click"]}
	x_haq
>
	<SvgIcon d_icon="plus" x_alias />
</button>
```

```tsx
// src/component/btns/MinusBtn.astro

<button
	class="flex flex-center"
	type="button"
	aria-label="Subtract"
	title="Subtract"
	x_sel="minus-btn"
	disabled={attrs.disabled}
	x_ev_types={["click"]}
	x_haq
>
	<SvgIcon d_icon="minus" x_alias />
</button>
```

Now let's write the logic for this component:

```ts
// src/web-components/MyCounter/MyCounter.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_Event } from "@haq/astro";
import type { MU_MyCounter } from "@haq/markup";

type T = MU_MyCounter; // the generated Web Component markup type

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { defineWebComponent, WebComponent } from "@haq/astro";
import { assertUnreachable } from "@haq/utils";

//#endregion ----------------------------------------------- Module Imports

export class MyCounter extends WebComponent<T>() {
	// initialize your dom variables
	readonly #MinusBtn = this.querySelector("[x_sel='minus-btn']");
	readonly #CountSpan = this.querySelector("[x_sel='count']");

	// initialize private variables
	#COUNT = 0;

	constructor() {
		super();

		this.addEventListener("click", this);
	}

	//* ---------- Listeners ----------------------------------------------------

	handleEvent(e: HAQ_Event<T>): void {
		const type = e.type;
		switch (type) {
			case "click": {
				this.#handleClick(e);
				break;
			}

			default:
				assertUnreachable(type);
		}
	}

	#handleClick(e: HAQ_Event<T, "click">): void {
		if (e.target.closest("[x_sel='minus-btn']")) {
			this.#COUNT--;
			this.#updateCounterText();
		} else if (e.target.closest("[x_sel='plus-btn']")) {
			this.#COUNT++;
			this.#updateCounterText();
		}
	}

	#updateCounterText(): void {
		this.#CountSpan.textContent = this.#COUNT.toString();
		this.#MinusBtn.disabled = this.#COUNT < 1;
	}
}

defineWebComponent(MyCounter, "my-counter");
```

Let's talk about some of that code.

First, you'll notice that we're importing `MU_MyCounter` from the HAQ generated file `"@haq/markup"`. All generated markup types will live in that file and will be prefixed with `MU_` for markup.

Then we create an alias `T` for that type. That is just a recommended thing to do since you might need to access that type's properties multiple times and helps reduce the noise.

Instead of extending the class traditionally with `HTMLElement`, we use a runtime wrapper `WebComponent<T>()`. That is to tell typescript about the context of this component and will correctly type `this` within the class.

So now when we use the native DOM API, like `querySelector`, `getAttribute`, etc., everything will be fully typed.

Another opinionated rule HAQ Astro enforces is that you can **ONLY** query direct child elements.
So if we wanted to target the `<svg-icon>` element inside of `<MinusBtn>`, and assuming we assigned it a selector (`x_sel`) of `"minus-icon"` in the `MinusBtn.astro` file, then we would have to do the following:

```ts
readonly #MinusIcon = this.#MinusBtn.querySelector("[x_sel='minus-icon']");
```

You'll also notice that both `#MinusBtn` and `#CountSpan` DOM variables are non nullable.
That is because typescript knows about the markup and it knows those elements will be rendered at runtime.
If they were conditionally rendered, then HAQ Astro would pick that up, resulting in a nullable type.

Things to remember about nullable components:

- All nullable components have access to the `remove()` method.
- Their direct parent can call `removeChild()` as well.

Now let's look at our `handleEvent()` method used for event delegation.

We imported another HAQ Astro helper type `HAQ_Event` in order to correctly type our events.
This helper type must receive a type argument that satisifes a generated markup type, so we pass it our aliased type `T`.

It is recommended to use an exhaustive switch statement in your delegation with the help of a utility function provided by `@haq/utils` called `assertUnreachable()`.
That way, if a child component in some other file has an `x_ev_types` directive that you missed, the switch statement will report an error and will force you to address that case.

Now let's look at our `#handleClick()` private method.

By passing a second type argument (event type) into `HAQ_Event`, it allows for precise type checking the `target.closest()` method of the event.
Essentially, the valid selectors you can pass as an argument to `e.target.closest()` are all the nested child selectors of a component with an `x_ev_types` directive.
So right now, since we are only using the `"click"` event type on the `PlusBtn` and `MinusBtn` components, the valid selectors are `"[x_sel='minus-btn']" | "[x_sel='plus-btn']"`.
But if let's say we added the `x_ev_types` directive to our root component `my-counter`, then the valid selectors would be all its nested child selectors, namely `"[x_sel='minus-btn']" | "[x_sel='plus-btn']" | "[x_sel='count']" | "my-counter"`.

### New Astro Page

Now let's test out this Web Component in the browser:

- Create a new file inside `src/pages/tutorial/` named `web-components.astro`.
- Add the following:

```tsx
---
// src/pages/tutorial/web-components.astro

import MainContainer from "../../components/MainContainer.astro";
import Scaffold from "../../layouts/Scaffold.astro";
import MyCounter from "../../web-components/MyCounter/MyCounter.astro";
---

<Scaffold title="Web Components" x_page="/tutorial/web-components">
	<MainContainer slot="body:">
		<div class="text-center">
			<h1 class="clr-accent">Web Components Are Awesome!</h1>
			<MyCounter />
		</div>
	</MainContainer>
</Scaffold>

```

Now let's add a new `<NavLink>` in our `Header` component to view this new page:

```tsx
// src/components/MyHeader.astro

<header x_sel="header" x_haq>
	<nav class="flex flex-center" x_sel="nav" x_haq>
		<NavLink text="Home" href="/" {x_page} />
		<NavLink text="Custom Elements" href="/tutorial/custom-elements" {x_page} />
		<NavLink text="Web Components" href="/tutorial/web-components" {x_page} />
	</nav>
</header>
```

In your browser, click on the nav link "Web Components" and test out your first fully typed Web Component!

## Part 7 - Custom Events

Custom events are an excellent way of passing data to components while preserving their reusability.

Let's imagine that we want a component like our counter that displays "odd" or "even" depending on the resulting number from the counter.
By adding that logic to our `MyCounter` Web Component class, we would only be able to use this component with this odd/even feature. Thus, we loose its reusability.

Instead, we can create another Web Component, that has `<my-counter>` as its child.
This new component would then receive a custom event from `<my-counter>` with the data needed for that odd/even logic.

### `MyCounter`

Let's add a custom event to our `MyCounter` component:

```ts
// src/web-components/MyCounter/MyCounter.ts

type E = {
	"my-counter:updated": {
		count: number
	}
}

export class MyCounter extends WebComponent<T, E>() {...}
```

Let's update our `#handleClick` method to emit this event whenever the count updated:

```ts
// src/web-components/MyCounter/MyCounter.ts

#handleClick(e: HAQ_Event<T, "click">): void {
	if (e.target.closest("[x_sel='minus-btn']")) {
		this.#COUNT--
		this.#updateCounterText()
	} else if (e.target.closest("[x_sel='plus-btn']")) {
		this.#COUNT++
		this.#updateCounterText()
	}

	this.emitCustomEvent("my-counter:updated", { count: this.#COUNT })
}
```

**NOTE** - Typescript will report an error if the custom events are not prefixed with the element's tag name followed by a colon.
This prevents event name collisions with other components.

**NOTE** - `emitCustomEvent` is only available as a method if we pass a second type argument to the `WebComponent<T, E>()` wrapper that extends the Web Component class.

If no data needs to be sent with an event, you can can simply add `undefined` to its type. Like the following:

```ts
type E = {
	"my-counter:updated": undefined;
};
```

Then, the `emitCustomEvent` method will only accept one argument.

### `OddEven`

Let's generate a new Web Component:

```bash
pnpm haq webc -t odd-even -o src/web-components
```

Let's add our markup:

```tsx
---
// src/web-components/OddEven/OddEven.astro

import type { HAQ_AliasableComponentProps } from "@haq/astro";

import MyCounter from "../MyCounter/MyCounter.astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_alias"> {}
---

<odd-even class="text-center" x_webc>
	<h2 x_sel="result" x_haq>This number is even!</h2>
	<MyCounter x_alias />
</odd-even>

<script>
	import "./OddEven";
</script>
```

Since we don't need to syle this Web Component at the moment, you can delete the follwing file: `src/web-components/OddEven/OddEven.css`.

Let's implement this Web Component:

```ts
// src/web-components/OddEven/OddEven.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_CustomEvent } from "@haq/astro";
import type { MU_OddEven } from "@haq/markup";

type T = MU_OddEven; // the generated Web Component markup type

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { defineWebComponent, WebComponent } from "@haq/astro";

//#endregion ----------------------------------------------- Module Imports

export class OddEven extends WebComponent<T>() {
	// initialize your dom variables
	readonly #Result = this.querySelector("[x_sel='result']");

	constructor() {
		super();

		this.addWebComponentEventListener("my-counter:updated", this.#counterUpdated);
	}
	//* ---------- Listeners ----------------------------------------------------

	readonly #counterUpdated = (e: HAQ_CustomEvent<T>["my-counter:updated"]): void => {
		const { count } = e.detail;

		if (count % 2 === 0) {
			this.#Result.textContent = "This number is even!";
		} else {
			this.#Result.textContent = "This number is odd!";
		}
	};
}

defineWebComponent(OddEven, "odd-even");
```

The `WebComponent<T>()` wrapper that extends the Web Component class provides another method called `addWebComponentEventListener`. It listens for custom events emitted by child Web Components.

**NOTE** - The listener callback can be an inline anonymous function or a named function. Just keep in mind that in either case you should use an arrow function to preserve `this` within the function's scope.

You'll notice another type helper provided by HAQ Astro called `HAQ_CustomEvent`. It must take in a type param that satisifies a generated markup type, so we pass it `T` in our case. It will expose all the available custom events that the current Web Component can listen to.

We then retrieve the data from the event from the `detail` property of the event object.

Now let's test out this new Web Component in the browser:

- Create a new file inside `src/pages/tutorial/` named `custom-events.astro`.
- Add the following:

```tsx
---
// src/pages/tutorial/custom-events.astro

import MainContainer from "../../components/MainContainer.astro";
import Scaffold from "../../layouts/Scaffold.astro";
import OddEven from "../../web-components/OddEven/OddEven.astro";
---

<Scaffold title="Custom Events" x_page="/tutorial/custom-events">
	<MainContainer slot="body:">
		<OddEven />
	</MainContainer>
</Scaffold>
```

Now let's add a new `<NavLink>` in our `Header` component to view this new page:

```tsx
// src/components/MyHeader.astro

<header x_sel="header" x_haq>
	<nav class="flex flex-center" x_sel="nav" x_haq>
		<NavLink text="Home" href="/" {x_page} />
		<NavLink text="Custom Elements" href="/tutorial/custom-elements" {x_page} />
		<NavLink text="Web Components" href="/tutorial/web-components" {x_page} />
		<NavLink text="Custom Events" href="/tutorial/custom-events" {x_page} />
	</nav>
</header>
```

In your browser, click on the nav link "Custom Events" and test out this new Web Component!

## Part 8 - App Components

You can imagine that you can accomplish a lot with Web Components and with what we've learned so far in this tutorial.
But since HAQ Astro's Web Components are designed to be reusable encapsulated components, they never know about the page's context. So if we have components that trigger changes or updates to other components outside of their scope we don't have a way to handle it. And it would definitely be an overkill to wrap all the Web Components in a given page into a parent root Web Component.

This is where we'll be using App Components.

### View Transitions

Suppose we want to add view transitions to our website and make our `MyHeader` component persist.

Let's add Astro's `<ClientRouter>` component to our `<head>` tag in our `Scaffold` component.

```tsx
---
// src/layouts/Scaffold.astro

import type { HAQ_PageRoute } from "@haq/routes-1";

import { ClientRouter } from "astro:transitions";

import "../css/styles.css";

import MyHeader from "../components/MyHeader.astro";

interface Props {
	title: string;
	x_page: HAQ_PageRoute;
}
const { title, x_page } = Astro.props;
---

<html lang="en" {x_page}>
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, minimum-scale=1.0,  maximum-scale=1.0, user-scalable=no" />
		<meta name="mobile-web-app-capable" content="yes" />
		<meta name="msapplication-tap-highlight" content="no" />
		<meta name="HandheldFriendly" content="true" />
		<title>{title}</title>
		<ClientRouter fallback="none" />
	</head>
	<body>
		<MyHeader {x_page} />
		<slot name="body:" />
	</body>
</html>
```

Let's add a `transition:persist` directive to our `<header>` tag in our `MyHeader` component:

```tsx
---
// src/components/MyHeader.astro

import type { HAQ_PageRoute } from "@haq/routes-1";

import "./MyHeader.css";

import NavLink from "./NavLink.astro";

interface Props {
	x_page: HAQ_PageRoute;
}

const { x_page } = Astro.props;
---

<header transition:persist="MyHeader" x_sel="header" x_haq>
	<nav class="flex flex-center" x_sel="nav" x_haq>
		<NavLink text="Home" href="/" {x_page} />
		<NavLink text="Custom Elements" href="/tutorial/custom-elements" {x_page} />
		<NavLink text="Web Components" href="/tutorial/web-components" {x_page} />
		<NavLink text="Custom Events" href="/tutorial/custom-events" {x_page} />
	</nav>
</header>

```

Now if you go to the browser and navigate to the different pages, you will notice that transitions are working but our nav styling is broken. The active anchor links are not styled how we had it before. This is because of the `transition:persist` directive. Astro only renders the initial anchor states once, so navigating doesn't update their states. We need to transfer the logic we had for our nav to the browser.

We'll need to make our `MyHeader` component an App Component.

### What are App Components?

- App Components are components that are used (aliased) in your Astro `/pages` folder.
- App Components must have a unique `id` selector (HAQ Astro's compiler will make sure of that).
- App Components can listen to custom events emitted by its child Web Components.
- App Components can call public methods of its child Web Components.
- App Components can emit its own custom events (App Events).
- App Components can expose its own public methods.

### Folder Structure

Similar to Web Components, HAQ Astro is opinionated in regards to App Components. Here are a the rules to follow:

- The Astro filename of the App Component is the main identifier.
    - The App Component class name must be the same as the Astro filename.
    - The typescript filename where the App Component class is implemented should be the same as the Astro filename.
- The App Component class must be exported.
- The typescript file where the App Component class is implemented should be in the same folder as the Astro file.

HAQ Astro provides another command similar to the one we used previously for App Components.
It will help generate scaffolding for App Components.
That way you don't have to worry or think about the rules mentioned above.

This command takes in 2 flags:

- `-n` or `--name`: Main identifier for your App Component (must not contain spaces).
- `-o` or `--output`: Output dir path.

Let's create a new folder inside `src/` named `app-components`.

Now let's run the following command:

```bash
pnpm haq appc -n MyHeader -o src/app-components
```

You should see a new folder inside `src/app-compoenents/` named `MyHeader` with the following files:

- `MyHeader.astro`: App Component markup.
- `MyHeader.ts`: App Component class.

### Markup

You'll see an error: `Duplicate astro component. → Identifier: MyHeader`.

Once again HAQ Astro enforces uniqueness as much as possible. Remember, every error that you address, is one less bug.

So let's copy that markup from our original `MyHeader` component to our App Component (you can then delete that original astro file). And replace the `x_sel` directive with an `id` directive in our `<header>` element.

```tsx
---
// src/app-components/MyHeader/MyHeader.astro

import type { HAQ_AliasableComponentProps } from "@haq/astro";
import type { HAQ_PageRoute } from "@haq/routes-1";

import "./MyHeader.css";

import NavLink from "../../components/NavLink.astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_appc"> {
	x_page: HAQ_PageRoute;
}

const { x_page } = Astro.props;
---

<header transition:persist="MyHeader" id="header" x_haq>
	<nav class="flex flex-center" x_sel="nav" x_haq>
		<NavLink text="Home" href="/" {x_page} />
		<NavLink text="Custom Elements" href="/tutorial/custom-elements" {x_page} />
		<NavLink text="Web Components" href="/tutorial/web-components" {x_page} />
		<NavLink text="Custom Events" href="/tutorial/custom-events" {x_page} />
	</nav>
</header>

```

Now move the original `MyHeader.css` file into this folder as well.

You'll notice 3 errors pointing to the `header` selector in the `MyHeader.css` file. Let's address these errors.

```css
/* src/app-components/MyHeader/MyHeader.css */

header#header {
	position: fixed;
	top: 0;
	width: 100%;
	padding: 1rem 2rem;
}

header#header nav[x_sel="nav"] {
	font-size: 1rem;
	flex-wrap: balance;
	column-gap: 2rem;
	row-gap: 0.5rem;
}
```

Since the active anchor state logic will be handled in the browser, and we don't want to handle that state more than once, we can refactor our `NavLink` component as well. In addition, in order to prevent the currently active anchor link to fire, we'll need to declare the click event type on the anchor element using the `x_ev_types` directive:

```tsx
---
// src/components/NavLink.astro

import type { HAQ_AliasableComponentProps } from "@haq/astro";
import type { HAQ_PageRoute } from "@haq/routes-1";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_alias"> {
	href: HAQ_PageRoute;
	text: string;
}
const { href, text } = Astro.props;
---

<a {href} x_sel="nav-link" x_ev_types={["click"]} x_haq>{text}</a>

```

And now we can remove all the `x_page` props that we passed to `<NavLink>` in our `MyHeader` component:

```tsx
---
// src/app-components/MyHeader/MyHeader.astro

import type { HAQ_AliasableComponentProps } from "@haq/astro";

import "./MyHeader.css";

import NavLink from "../../components/NavLink.astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_appc"> {}
---

<header transition:persist="MyHeader" id="header" x_haq>
	<nav class="flex flex-center" x_sel="nav" x_haq>
		<NavLink text="Home" href="/" x_alias />
		<NavLink text="Custom Elements" href="/tutorial/custom-elements" />
		<NavLink text="Web Components" href="/tutorial/web-components" />
		<NavLink text="Custom Events" href="/tutorial/custom-events" />
	</nav>
</header>

```

Now let's refactor every astro page to include our `MyHeader` App Component.

```tsx
---
// src/pages/index.astro

import MyHeader from "../app-components/MyHeader/MyHeader.astro";
import MainContainer from "../components/MainContainer.astro";
import Scaffold from "../layouts/Scaffold.astro";

const HAQ_ROUTE = "/";
---

<Scaffold title="Hello, World!" x_page={HAQ_ROUTE}>
	<MyHeader slot="body:" x_appc />
	<MainContainer slot="body:">
		<div class="text-center">
			<h1 class="clr-accent">Hello, World!</h1>
			<h1 class="clr-accent" d_lang="ar">مرحبا بالعالم!</h1>
		</div>
	</MainContainer>
</Scaffold>

```

Make sure to add `<MyHeader slot="body:" x_appc />` to the following pages:

- `src/pages/tutorial/custom-elements.astro`
- `src/pages/tutorial/web-components.astro`
- `src/pages/tutorial/custom-events.astro`

In order to let HAQ Astro know about the presence of an App Component in a given page, we use the `x_appc` directive.

You'll notice we're using a constant for our `x_page` value. This can be useful when an `x_page` value is used more than once. HAQ Astro only will accept `HAQ_ROUTE` as the constant's identifier.

### class `MyHeader`

```ts
// src/app-components/MyHeader/MyHeader.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_Event } from "@haq/astro";
import type { MU_MyHeader } from "@haq/markup";
import type { HAQ_PageRoute } from "@haq/routes-1";

type T = MU_MyHeader; // the generated App Component markup type

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppComponent } from "@haq/astro";
import { assertUnreachable } from "@haq/utils";

//#endregion ----------------------------------------------- Module Imports

export class MyHeader extends AppComponent<T>() {
	// initialize your dom variables
	readonly #Nav = this.querySelector("[x_sel='nav']");
	readonly #NavLinks = [...this.#Nav.querySelectorAll("[x_sel='nav-link']")];

	constructor() {
		super("header"); // id attribute of Component

		this.addEventListener("click", this);
	}

	override destructor(): void {
		// we only need to do this because this component has a transiion:persist directive and don't want to keep adding listeners on every navigation
		this.removeEventListener("click", this);
	}

	//* ---------- Exposed Methods -----------------------------------------------

	updateNav(currentPage: HAQ_PageRoute): void {
		for (const Link of this.#NavLinks) {
			Link.removeAttribute("d_active");
		}
		const ActiveLink = this.#NavLinks.find((Link) => Link.getAttribute("href") === currentPage);
		ActiveLink?.setAttribute("d_active", true);
	}

	//* ---------- Listeners ----------------------------------------------------

	handleEvent(e: HAQ_Event<T>): void {
		const type = e.type;
		switch (type) {
			case "click": {
				this.#handleClick(e);
				break;
			}

			default:
				assertUnreachable(type);
		}
	}

	#handleClick(e: HAQ_Event<T, "click">): void {
		const NavLink = e.target.closest("[x_sel='nav-link']");
		if (NavLink?.hasAttribute("d_active")) {
			e.preventDefault();
		}
	}
}
```

Let's talk about some of that code.

You'll notice a lot of the similar ideas and structure as our Web Components.

One thing that is different is that you have to pass in a value to the `super` invocation. That value is the `id` selector of this App Component.

Another thing to notice is that this class provides a `destructor` method used for clean up.
In our case, since our `MyHeader` App Component has a `transition:persist` directive on it, we should remove that click event listener on every page navigation. Or else, listeners will keep on piling up leading to unnecessary memory usage.

### App Router

The App Router is your main entry point for your browser scripting. It knows about all the different page contexts. Let's add one to our project.

- Create a new folder inside `src/` named `app-router`.
- Create a new file named `index.ts`.
- Add the following:

```ts
// src/app-router/index.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_AppComponents_1 } from "@haq/markup";

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppRouter } from "@haq/astro";
import { MyHeader } from "../app-components/MyHeader/MyHeader.js";

//#endregion ----------------------------------------------- Module Imports

const componentsRouter: HAQ_AppComponents_1 = {
	"/": {
		MyHeader,
	},

	"/tutorial/custom-elements": {
		MyHeader,
	},

	"/tutorial/web-components": {
		MyHeader,
	},

	"/tutorial/custom-events": {
		MyHeader,
	},
};

AppRouter({
	componentsRouter,

	afterSwapHandler: (route, constructedComponentsRouter, _isInitialLoad) => {
		constructedComponentsRouter[route].MyHeader.updateNav(route);
	},
});
```

Let's talk about that code.

First you'll notice we're importing another generated type `HAQ_AppComponents_1`.
We use this type to correctly type the `componentsRouter` object that we must pass in to `AppRouter`.

Since that generated type always reflects the truth of the markup, any changes to your astro pages will be reflected here.

Now let's look at the `afterSwapHandler` callback we pass in to `AppRouter`. It is a callback that gets fired after Astro's `astro:page-load` event in the view transitions life cycle. If no view transitions are present or are not supported in the browser, it simply gets fired after the native `DOMContentLoaded` event. So essentially, this will get fired at every page navigation, including the initial one.

This callback provides three arguments:

- `route` - The current route the page is on, meaning the value of the `x_page` attribute that was passed to our `<html>` tag in our `Scaffold` component.
- `constructedComponentsRouter` - The components router similar to the one passed in to `AppRouter` but where all classes are constructed, giving you access to their public methods.
- `isInitialLoad` - A boolean value indicating whether this is the initial load or not (will always be true when no view transitions are present or are not supported).

Now let's add this script to our `Scaffold` component and remove the old `<MyHeader>` component we had inside our `<body>` element:

```tsx
---
// src/layouts/Scaffold.astro

import type { HAQ_PageRoute } from "@haq/routes-1";

import { ClientRouter } from "astro:transitions";

import "../css/styles.css";

interface Props {
	title: string;
	x_page: HAQ_PageRoute;
}
const { title, x_page } = Astro.props;
---

<html lang="en" {x_page}>
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, minimum-scale=1.0,  maximum-scale=1.0, user-scalable=no" />
		<meta name="mobile-web-app-capable" content="yes" />
		<meta name="msapplication-tap-highlight" content="no" />
		<meta name="HandheldFriendly" content="true" />
		<title>{title}</title>
		<ClientRouter fallback="none" />
	</head>
	<body>
		<slot name="body:" />
		<script>
			import "../app-router";
		</script>
	</body>
</html>
```

Back to the browser, you can see our nav and active anchor links working perfectly again.

## Part 9 - App Events

Let's imagine that our `OddEven` Web Component needs to trigger some change in our `MyHeader` App Component.
We would first need to create a new App Component that would act as a wrapper for our `OddEven` Web Component.
Then this new App Component can emit an App Event that knows about the presence of our `MyHeader` App Component, and can then call its public methods.

In our case, let's imagine that we would like to trigger confetti all over the page once the `OddEven` Web Component receives the value `6` (first perfect number) from its child `MyCounter` Web Component.

We would need the following:

- A new Web Component (`MyConfetti`) that has an exposed a public method that triggers confetti all over the page.
- Add `MyConfetti` Web Component as a child of our `MyHeader` App Component.
- Another App Component (`PerfectNumber`) that has our `OddEven` Web Component as a child.

### `MyConfetti`

Let's generate scaffolding for our new Web Component:

```bash
pnpm haq webc -t my-confetti -o src/web-components

```

#### `MyConfetti.haq.json`

```json
{
	"custom-elements": [
		{
			"tag": "my-confetti",
			"attrs": [
				{
					"name": "d_particle_count",
					"value": "number",
					"required": true
				},
				{
					"name": "d_animate"
				}
			]
		},
		{
			"tag": "my-confetti-particle",
			"cssDynamicVars": ["bkgColor", "left", "delay", "duration"]
		}
	]
}
```

You'll notice this time we're adding our css custom properties to `cssDynamicVars` instead of the previously used `cssStaticVars`.
This is because we are going to want to interact with these custom properties from within our javascript.

#### Markup

- Create a new file inside `src/web-components/MyConfetti/` named `MyConfettiParticle.astro`.
- Add the following:

```tsx
---
// src/web-components/MyConfetti/MyConfettiParticle.astro

import type { HAQ_AliasableComponentProps } from "@haq/astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_alias"> {}
---

<my-confetti-particle x_haq></my-confetti-particle>

```

Let's add our Web Component markup:

```tsx
---
// src/web-components/MyConfetti/MyConfetti.astro

import type { HAQ_AliasableComponentProps } from "@haq/astro";
import type { HTMLAttributes } from "astro/types";
type T = HTMLAttributes<"my-confetti">;

import "./MyConfetti.css";

import Nullable from "@haq/Nullable.astro";
import MyConfettiParticle from "./MyConfettiParticle.astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_alias"> {
	d_particle_count: T["d_particle_count"];
}

const { ...attrs } = Astro.props;
---

<my-confetti d_particle_count={attrs.d_particle_count} x_webc>
	<Nullable>
		<MyConfettiParticle x_alias />
	</Nullable>
</my-confetti>

<script>
	import "./MyConfetti";
</script>
```

You'll notice we're wrapping the `<MyConfettiParticle>` component in a `<Nullable>` component provided by HAQ Astro.
This component can be used to wrap nullable components. That is, it will return a nullable value when queried, and will be removable (can call `.remove()`).

It can be useful in situations where you'll need to render a component dynamically in the browser. It also has other use cases for more advanced features (using the full stack `@haq/astro-ssr` package).

#### CSS

```css
/* src/web-components/MyConfetti/MyConfetti.css  */

my-confetti {
	position: fixed;
	inset: 0;
	overflow: hidden;
	z-index: 9999;
	pointer-events: none; /* Prevents blocking clicks on elements below */
}

my-confetti my-confetti-particle {
	--__bkgColor: var(--clr-accent);
	--__left: 0%;
	--__delay: 0s;
	--__duration: 0s;
	position: absolute;
	top: -10px;
	width: 20px;
	height: 3px;
	border-radius: 10% 0% 75% 100%;
	opacity: 0;
	background-color: var(--__bkgColor);
	left: var(--__left);
}

my-confetti[d_animate] my-confetti-particle {
	animation: fall 4s linear infinite;
	animation-delay: var(--__delay);
	animation-duration: var(--__duration);
}

@keyframes fall {
	0% {
		top: -5%;
		transform: translateX(0) rotate(0deg);
		opacity: 1;
	}
	50% {
		transform: translateX(100px) rotate(360deg);
		opacity: 1;
	}
	100% {
		top: 110%;
		transform: translateX(-50px) rotate(720deg);
		opacity: 0;
	}
}

@media (prefers-reduced-motion: reduce) {
	my-confetti my-confetti-particle {
		animation: none;
		display: none;
	}
}
```

You'll notice that those custom properties defined as `cssDynamicVars` in our `MyConfetti.haq.json` file have a `--__` prefix.
That is how HAQ Astro distinguishes between static custom properties and dynamic ones (manipulated by browser).

#### `class MyConfetti`

- Go to the file: `src/web-components/MyConfetti/MyConfetti.ts`.
- Replace the code with the following:

```ts
// src/web-components/MyConfetti/MyConfetti.ts

//#region -------------------------------------------------- Type Imports

import type { MU_MyConfetti } from "@haq/markup";

type T = MU_MyConfetti; // the generated Web Component markup type

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { defineWebComponent, WebComponent } from "@haq/astro";

//#endregion ----------------------------------------------- Module Imports

export class MyConfetti extends WebComponent<T>() {
	readonly #ClonableParticle = this.querySelector("my-confetti-particle");

	readonly #PARTICLE_COUNT = Number(this.getAttribute("d_particle_count"));

	readonly #COLORS = ["#ffd700", "#f2d74e", "#95c3de", "#b1c999", "#ea6463", "#a372de", "#a372de"];

	//* ---------- Exposed Methods -----------------------------------------------

	start(): void {
		for (const Particle of [...this.querySelectorAll("my-confetti-particle")]) {
			Particle.remove();
		}
		this.#renderParticles();
		this.setAttribute("d_animate", true);
	}

	stop(): void {
		this.removeAttribute("d_animate");
	}

	//* ---------- Helpers -----------------------------------------------

	#renderParticles(): void {
		if (!this.#ClonableParticle) return;

		const HUNDRED_PERCENT = 100;
		const NINETY_EIGHT_PERCENT = 98;
		const MAX_ANIMATION_DELAY = 4;
		const MIN_ANIMATION_DURATION = 3;
		const MAX_ANIMATION_DURATION = 5;

		for (let i = 1; i <= this.#PARTICLE_COUNT; i++) {
			const NewParticle = this.#ClonableParticle.cloneNode(true);
			// background-color

			const newColor = this.#COLORS[(i - 1) % this.#COLORS.length];
			if (!newColor) continue;

			NewParticle.style.setProperty("--__bkgColor", newColor);

			// left

			const leftIncr = HUNDRED_PERCENT / this.#PARTICLE_COUNT;
			const left = Math.min(NINETY_EIGHT_PERCENT, leftIncr * i);

			NewParticle.style.setProperty("--__left", `${left}%`);

			// animation-delay

			NewParticle.style.setProperty("--__delay", `${this.#getRandomFloat(0, MAX_ANIMATION_DELAY)}s`);

			// animation-duration

			NewParticle.style.setProperty(
				"--__duration",
				`${this.#getRandomFloat(MIN_ANIMATION_DURATION, MAX_ANIMATION_DURATION)}s`,
			);

			this.appendChild(NewParticle);
		}
	}

	#getRandomFloat(min: number, max: number): number {
		return Math.random() * (max - min) + min;
	}
}

defineWebComponent(MyConfetti, "my-confetti");
```

Let's talk about some of that code.

You'll notice that `this.getAttribute("d_particle_count")` returns a non nullable value of type `"${number}"`.
That is because in our `MyConfetti.haq.json` file, we delared that attribute's value as a number and we set `required` to `true`.
If `required` was set to `false` or not set at all, then querying that attribute would return a nullable value.

Then you'll notice that `#ClonableParticle` is nullable due to it being wrapped in a `<Nullable>` component.
Consequently, in our `start()` method, we can safely call `remove()` on each particle to clear the component's contents.
Then you'll notice how we dynamically assign values to our dynamic css custom properties using `style.setProperty`.

**NOTE** - The values that you set to these custom properties are of type `string`, so it is up to you to make sure you add the appropriate units (%, px, s, etc....)

Now let's add this Web Component to our `MyHeader` App Component.

```tsx
---
// src/app-components/MyHeader/MyHeader.astro

import type { HAQ_AliasableComponentProps } from "@haq/astro";

import "./MyHeader.css";

import NavLink from "../../components/NavLink.astro";
import MyConfetti from "../../web-components/MyConfetti/MyConfetti.astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_appc"> {}
---

<header transition:persist="MyHeader" id="header" x_haq>
	<MyConfetti d_particle_count="100" x_alias />
	<nav class="flex flex-center" x_sel="nav" x_haq>
		<NavLink text="Home" href="/" x_alias />
		<NavLink text="Custom Elements" href="/tutorial/custom-elements" />
		<NavLink text="Web Components" href="/tutorial/web-components" />
		<NavLink text="Custom Events" href="/tutorial/custom-events" />
	</nav>
</header>
```

Now let's expose a couple methods in our `MyHeader` App Component:

```ts
// src/app-components/MyHeader/MyHeader.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_Event } from "@haq/astro";
import type { MU_MyHeader } from "@haq/markup";
import type { HAQ_PageRoute } from "@haq/routes-1";

type T = MU_MyHeader; // the generated App Component markup type

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppComponent } from "@haq/astro";
import { assertUnreachable } from "@haq/utils";

//#endregion ----------------------------------------------- Module Imports

export class MyHeader extends AppComponent<T>() {
	// initialize your dom variables
	readonly #Nav = this.querySelector("[x_sel='nav']");
	readonly #NavLinks = [...this.#Nav.querySelectorAll("[x_sel='nav-link']")];

	readonly #MyConfetti = this.querySelector("my-confetti");

	constructor() {
		super("header"); // id attribute of Component

		this.addEventListener("click", this);
	}

	override destructor(): void {
		// we only need to do this because this component has a transiion:persist directive and don't want to keep adding listeners on every navigation
		this.removeEventListener("click", this);
	}

	//* ---------- Exposed Methods -----------------------------------------------

	updateNav(currentPage: HAQ_PageRoute): void {
		for (const Link of this.#NavLinks) {
			Link.removeAttribute("d_active");
		}
		const ActiveLink = this.#NavLinks.find((Link) => Link.getAttribute("href") === currentPage);
		ActiveLink?.setAttribute("d_active", true);
	}

	confettiTime(): void {
		this.#MyConfetti.start();
	}

	stopConfetti(): void {
		this.#MyConfetti.stop();
	}

	//* ---------- Listeners ----------------------------------------------------

	handleEvent(e: HAQ_Event<T>): void {
		const type = e.type;
		switch (type) {
			case "click": {
				this.#handleClick(e);
				break;
			}

			default:
				assertUnreachable(type);
		}
	}

	#handleClick(e: HAQ_Event<T, "click">): void {
		const NavLink = e.target.closest("[x_sel='nav-link']");
		if (NavLink?.hasAttribute("d_active")) {
			e.preventDefault();
		}
	}
}
```

### `OddEven`

Let's emit a custom event from our `OddEven` Web Component whenever the counter is updated.

```ts
// src/web-components/OddEven/OddEven.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_CustomEvent } from "@haq/astro";
import type { MU_OddEven } from "@haq/markup";

type T = MU_OddEven; // the generated Web Component markup type

type E = {
	"odd-even:updated": {
		count: number;
	};
};

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { defineWebComponent, WebComponent } from "@haq/astro";

//#endregion ----------------------------------------------- Module Imports

export class OddEven extends WebComponent<T, E>() {
	// initialize your dom variables
	readonly #Result = this.querySelector("[x_sel='result']");

	constructor() {
		super();

		this.addWebComponentEventListener("my-counter:updated", this.#counterUpdated);
	}

	//* ---------- Listeners ----------------------------------------------------

	readonly #counterUpdated = (e: HAQ_CustomEvent<T>["my-counter:updated"]): void => {
		const { count } = e.detail;

		if (count % 2 === 0) {
			this.#Result.textContent = "This number is even!";
		} else {
			this.#Result.textContent = "This number is odd!";
		}

		this.emitCustomEvent("odd-even:updated", { count });
	};
}

defineWebComponent(OddEven, "odd-even");
```

### `PerfectNumber`

Let's generate scaffolding for our new App Component:

```bash
pnpm haq appc -n PerfectNumber -o src/app-components

```

#### Markup

- Go to the file: `src/app-components/PerfectNumber/PerfectNumber.astro`.
- Replace the code with the following:

```tsx
---
// src/app-components/PerfectNumber/PerfectNumber.astro

import type { HAQ_AliasableComponentProps } from "@haq/astro";

import OddEven from "../../web-components/OddEven/OddEven.astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_appc"> {}
---

<div id="perfectNumber" x_haq>
	<h1 class="text-center" x_class_list="clr-accent" x_sel="result-heading" x_haq>0 is not a perfect number.</h1>
	<OddEven x_alias />
</div>

```

You'll notice a new directive (`x_class_list`) we're using on the `<h1>` element.
It takes in a space separated list of valid class names (those defined in your global css) that can then be used to perform class manipulation in the browser.

#### `class PerfectNumber`

- Go to the file: `src/app-components/PerfectNumber/PerfectNumber.ts`.
- Replace the code with the following:

```ts
// src/app-components/PerfectNumber/PerfectNumber.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_CustomEvent } from "@haq/astro";
import type { MU_PerfectNumber } from "@haq/markup";

type T = MU_PerfectNumber; // the generated App Component markup type

// your defined app events
type E = {
	"perfect-number-updated": {
		isPerfectNumber: boolean;
	};
};

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppComponent } from "@haq/astro";

//#endregion ----------------------------------------------- Module Imports

export class PerfectNumber extends AppComponent<T, E>() {
	// initialize your dom variables
	readonly #ResultHeading = this.querySelector("[x_sel='result-heading']");

	constructor() {
		super("perfectNumber"); // id attribute of Component

		this.addWebComponentEventListener("odd-even:updated", this.#oddEvenUpdated);
	}

	//* ---------- Listeners ----------------------------------------------------

	readonly #oddEvenUpdated = (e: HAQ_CustomEvent<T>["odd-even:updated"]): void => {
		const FIRST_PERFECT_NUMBER = 6;

		const { count } = e.detail;

		if (count === FIRST_PERFECT_NUMBER) {
			this.#ResultHeading.textContent = `${count} is a Perfect Number!`;
			this.#ResultHeading.classList.add("clr-accent");
			this.emitAppEvent("perfect-number-updated", { isPerfectNumber: true });
		} else {
			this.#ResultHeading.textContent = `${count} is not a perfect number.`;
			this.#ResultHeading.classList.remove("clr-accent");
			this.emitAppEvent("perfect-number-updated", { isPerfectNumber: false });
		}
	};
}
```

Similar to to HAQ Astro's Web Component, you must pass in a second type parameter to `AppComponent<T, E>()` in order to have access to the `emitAppEvent` method.

### `eventsRouter`

Let's first add a new Astro page.

- Create a new file inside `src/pages/tutorial/` named `app-components.astro`.
- Add the following:

```tsx
---
// src/pages/tutorial/app-components.astro

import MyHeader from "../../app-components/MyHeader/MyHeader.astro";
import PerfectNumber from "../../app-components/PerfectNumber/PerfectNumber.astro";
import MainContainer from "../../components/MainContainer.astro";
import Scaffold from "../../layouts/Scaffold.astro";

const HAQ_ROUTE = "/tutorial/app-components";
---

<Scaffold title="App Components" x_page={HAQ_ROUTE}>
	<MyHeader slot="body:" x_appc />
	<MainContainer slot="body:">
		<PerfectNumber x_appc />
	</MainContainer>
</Scaffold>

```

Let's update our nav as well.

```tsx
---
// src/app-components/MyHeader/MyHeader.astro

import type { HAQ_AliasableComponentProps } from "@haq/astro";

import "./MyHeader.css";

import NavLink from "../../components/NavLink.astro";
import MyConfetti from "../../web-components/MyConfetti/MyConfetti.astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_appc"> {}
---

<header transition:persist="MyHeader" id="header" x_haq>
	<MyConfetti d_particle_count="100" x_alias />
	<nav class="flex flex-center" x_sel="nav" x_haq>
		<NavLink text="Home" href="/" x_alias />
		<NavLink text="Custom Elements" href="/tutorial/custom-elements" />
		<NavLink text="Web Components" href="/tutorial/web-components" />
		<NavLink text="Custom Events" href="/tutorial/custom-events" />
		<NavLink text="App Components" href="/tutorial/app-components" />
	</nav>
</header>
```

Now let's update our App Router.

```ts
// src/app-router/index.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_AppEvents, HAQ_AppEventsRouter } from "@haq/astro";
import type { HAQ_AppComponents_1 } from "@haq/markup";

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppRouter } from "@haq/astro";
import { MyHeader } from "../app-components/MyHeader/MyHeader.js";
import { PerfectNumber } from "../app-components/PerfectNumber/PerfectNumber.js";

//#endregion ----------------------------------------------- Module Imports

const componentsRouter: HAQ_AppComponents_1 = {
	"/": {
		MyHeader,
	},

	"/tutorial/custom-elements": {
		MyHeader,
	},

	"/tutorial/web-components": {
		MyHeader,
	},

	"/tutorial/custom-events": {
		MyHeader,
	},

	"/tutorial/app-components": {
		MyHeader,
		PerfectNumber,
	},
};

const eventsRouter: HAQ_AppEventsRouter<HAQ_AppComponents_1> = {
	"perfect-number-updated": (context, data) => {
		if (data.isPerfectNumber) {
			context.getCurrentComponents("any").MyHeader.confettiTime();
		} else {
			context.getCurrentComponents("any").MyHeader.stopConfetti();
		}
	},
};

AppRouter({
	componentsRouter,
	eventsRouter,

	afterSwapHandler: (route, constructedComponentsRouter, _isInitialLoad) => {
		constructedComponentsRouter[route].MyHeader.updateNav(route);
	},
});
```

HAQ Astro provides a helper type `HAQ_AppEventsRouter` in order to correctly type all your app events.
It must be passed a valid generated type, in our case we pass it `HAQ_AppComponents_1`.

Every app event's callback provides 2 arguments:

- `context` - An object providing 2 methods:
    - `getCurrentRoute` - Returns the current route, allows for type narrowing.
    - `getCurrentComponents` - Returns the constucted components router for a given route.
- `data` - The data passed with that event.

You'll notice we pass in `"any"` to `context.getCurrentComponents()`.
`"any"` is used to access App Components that are present in every route.
In our case, since `MyHeader` is available in every route, then we can safely call its methods.

We inlined the event implementation here, but you can imagine with a large application with tons of App Events you might want to refactor and separate these events into their own files.

We'll need to create types for our `context` and `data` arguments.

```ts
// src/app-router/index.ts

export type Context = AppRouter<HAQ_AppComponents_1>;
export type AppEvents = HAQ_AppEvents<HAQ_AppComponents_1>;
```

- Create a new folder inside `src/app-router/` named `events`.
- Create a new file named `perfect-number-updated.ts`.
- Move our event logic to this file.

```ts
// src/app-router/events/perfect-number-updated.ts

//#region -------------------------------------------------- Type Imports

import type { AppEvents, Context } from "../index.js";

//#endregion ----------------------------------------------- Type Imports

export function perfectNumberUpdated(context: Context, data: AppEvents["perfect-number-updated"]): void {
	if (data.isPerfectNumber) {
		context.getCurrentComponents("any").MyHeader.confettiTime();
	} else {
		context.getCurrentComponents("any").MyHeader.stopConfetti();
	}
}
```

And now our main entry point should look like this:

```ts
// src/app-router/index.ts

//#region -------------------------------------------------- Type Imports

import type { HAQ_AppEvents, HAQ_AppEventsRouter } from "@haq/astro";
import type { HAQ_AppComponents_1 } from "@haq/markup";

//#endregion ----------------------------------------------- Type Imports

//#region -------------------------------------------------- Module Imports

import { AppRouter } from "@haq/astro";
import { MyHeader } from "../app-components/MyHeader/MyHeader.js";
import { PerfectNumber } from "../app-components/PerfectNumber/PerfectNumber.js";
import { perfectNumberUpdated } from "./events/perfect-number-updated.js";

//#endregion ----------------------------------------------- Module Imports

const componentsRouter: HAQ_AppComponents_1 = {
	"/": {
		MyHeader,
	},

	"/tutorial/custom-elements": {
		MyHeader,
	},

	"/tutorial/web-components": {
		MyHeader,
	},

	"/tutorial/custom-events": {
		MyHeader,
	},

	"/tutorial/app-components": {
		MyHeader,
		PerfectNumber,
	},
};

const eventsRouter: HAQ_AppEventsRouter<HAQ_AppComponents_1> = {
	"perfect-number-updated": perfectNumberUpdated,
};

AppRouter({
	componentsRouter,
	eventsRouter,

	afterSwapHandler: (route, constructedComponentsRouter, _isInitialLoad) => {
		constructedComponentsRouter[route].MyHeader.updateNav(route);
	},
});

export type Context = AppRouter<HAQ_AppComponents_1>;
export type AppEvents = HAQ_AppEvents<HAQ_AppComponents_1>;
```

Now go to your browser and navigate to our new page. Update the counter till you get to the number `6` et voila, confetti time!

## Part 10 - Extra Features

Since proper documentation is still in progress, here are some extra features HAQ Astro provides that were not covered by the tutorial.

### `getRootDoc()`

It can be useful sometimes to apply changes to the root document (`<html>` or `document.documentElement`).

For example, a common trick to account for all the different ways smart phones compute the viewport height is to compute it in the browser and set a css custom property dynamically that represents one unit of the viewport height in pixels.

Let's first start by defining our custom property in our global css.

Go to the file `src/css/root.css` and add the following:

```css
/* src/css/root.css  */

:root {
	/* your custom properties */
	--__vh: 1vh;
}
```

You'll notice that since we want to dynamically set the value of this custom property we prefix it with `--__`, just like with custom elements explored earlier.

Now let's replace all the places where we used the native `vh` unit with this new custom property.
In our case we only used it once in our `src/css/utility.css` file.

```css
/* src/css/utility.css  */

.min-full-screen {
	width: 100%;
	min-height: calc(100 * var(--__vh));
}
```

Now let's add a `x_haq` directive to our `<html>` element in our `Scaffold` component.

```tsx
// src/layouts/Scaffold.astro

<html lang="en" {x_page} x_haq>
```

Now let's create a function that will set this custom property dynamically.
Add the following to `src/app-router/index.ts`:

```ts
// src/app-router/index.ts

import type { HAQ_AppComponents_1, MU_Scaffold } from "@haq/markup";
import { AppRouter, getRootDoc } from "@haq/astro";

function resizeHandler(): void {
	const HUNDRED_PERCENT = 100;
	const vh = window.innerHeight / HUNDRED_PERCENT;
	const RootDoc = getRootDoc<MU_Scaffold>();
	RootDoc.style.setProperty("--__vh", `${vh}px`);
}
```

You'll notice that `getRootDoc()` must take in a type parameter satisfying a generated markup type from an `<html>` element.

### AppRouter - `resizeHandler`

The `AppRouter` we've used previously takes in another optional callback you can pass in called `resizeHandler`.
It is a callback that gets fired on the `"resize"` event on the `window` object.
The callback provides the same 3 arguments as `afterSwapHandler`.

Let's add our `resizeHandler` function to our `AppRouter`:

```ts
// src/app-router/index.ts

AppRouter({
	componentsRouter,
	eventsRouter,
	resizeHandler,

	afterSwapHandler: (route, constructedComponentsRouter, _isInitialLoad) => {
		constructedComponentsRouter[route].MyHeader.updateNav(route);
	},
});
```

Now go to the browser and if you inspect the `<html>` element in the dev tools, you will see our custom property updating as soon as we resize the window.

### `dispatchEvent()`

This native method is fully typed and will only allow you to dispatch events on elements with the `x_ev_types` directive.

For our `MyCounter` Web Component example, you would only be able to dispatch click events on the `MinusBtn` or `PlusBtn` components.

You have to pass in HAQ Astro's `TypedEvent` function that acts as a wrapper for `new Event()`.

```ts
// src/web-components/MyCounter/MyCounter.ts

// add the TypedEvent import
import { defineWebComponent, WebComponent, TypedEvent } from "@haq/astro"

export class MyCounter extends WebComponent<T, E>() {

	constructor() {
		super()

		// we must pass it true to the "useCapture" argument to ensure our event delegation still works
		this.addEventListener("click", this, true)
	}

	// somewhere in the class

	this.#MinusBtn.dispatchEvent(TypedEvent("click"))
}

```

**NOTE** - Since we are listening for the `"click"` event on our root element `<my-counter>`, we must pass in `true` to the "useCapture" argument to preserve our event delegation.

### `window` and `document` Event Listeners

Both `AppComponent` and `WebComponent` classes provide built-in methods to handle event listeners on the `window` and `document` objects.

When you use the `x_ev_types` directive in your markup, you'll notice many events prefixed with `"d:"` or `"w:"`.
Those refer to document and window events respectively.

Let's say you would like to add a `"keyup"` event listener on the document in our `MyCounter` Web Component.

First let's declare this event in our markup.

```tsx
// src/web-components/MyCounter/MyCounter.astro

<my-counter class="flex flex-center" x_ev_types={["d:keyup"]} x_webc>
```

And now let's add this listener to our constructor.

```ts
// src/web-components/MyCounter/MyCounter.ts

export class MyCounter extends WebComponent<T, E>() {
	constructor() {
		super();

		this.addEventListener("click", this);
		this.addDocumentEventListener("keyup", this);
	}
}
```

You'll immediately notice a typescript error in our `handleEvent` method. That is the benefit of using exhaustive switches in our event delegation.
Now we are forced to address this new event.

You can remove event listeners like this:

```ts
this.removeDocumentEventListener("keyup", this);
```

The same applies to the `window` object.

To add an event listener:

```ts
this.addWindowEventListener("resize", this);
```

To remove an event listener:

```ts
this.removeWindowEventListener("resize", this);
```

**NOTE** - When using Astro's view transitions, you must remove any `document` or `window` event listeners in either the `disconnectedCallback` method of the Web Component or the `destructor` method of the App Component.

### DOM Manipulation

HAQ Astro's Web Components and App Components provide a factory method `DOMManipulation` with its own methods for common DOM manipulation use cases.

For example in our `MyHeader` App Component, we can imagine wanting to get the sibling of the clicked anchor element.

```ts
// src/app-components/MyHeader/MyHeader.ts

#handleClick(e: HAQ_Event<T, "click">): void {
	const NavLink = e.target.closest("[x_sel='nav-link']")
	if(!NavLink) return
	if (NavLink?.hasAttribute("d_active")) {
		e.preventDefault()
	}
	const SiblingLink = this.DOMManipulation.getSibling(NavLink, "previous","[x_sel='nav-link']")
	// do something with sibling
}
```

#### `getComputedStyle()`

It can be useful sometimes to get the computed custom property value.
If it was set dynamically (using `El.style.setProperty`), then simply using the `El.style.getProperty` method will return a value, but if it wasn't set that way, then you can use `getComputedStyle` and pass in the element to get/set the custom property to.

```ts
const computedCustomProperty = this.DOMManipulation.getComputedStyle(MyElem).getPropertyValue("--__someProp");
```

### Form Manipulation

Since forms are an essential part of the web, HAQ Astro applies its "one source of truth" philosophy to forms as well.

Any `<form>` element with a `x_haq` directive will generate types for all its nested child form elements (`<input>`, `<select>`, `<textarea>`) that have a `"name"` attribute.

These elements can be aliased or nested however you want and HAQ Astro will detect them.

Here is a simple example:

```tsx
<form id="myForm" x_haq>
	<input type="text" name="fullName" />
	<input type="email" name="email" />
	<input type="password" name="password" />
	<input type="text" name="role" x_input_values={["ADMIN", "CLIENT"]} />
	<input type="file" name="profilePic" />
</form>
```

The generated type would look like this:

```ts
{
	fullName: string;
	email: string;
	password: string;
	role: "ADMIN" | "CLIENT";
	profilePic: File;
}
```

You'll notice we used the `x_input_values` directive to narrow down the possible values accepted by the `role` input. This can be especially useful for checkbox or radio inputs.

You'll also notice that HAQ Astro detected that one of the inputs has `type="file"` and narrowed the value type as `File` instead of `string`.

And now you can collect the data from this form safely in either an App Component or Web component.

Assuming we have an App Component where `this` is our form with an id of `"myForm"`.

```ts
export class MyForm extends AppComponent<T>() {
	constructor() {
		super("myForm");
	}

	// somewhere in your submit logic

	#onSubmit() {
		const FormData = this.FormManipulation.makeFormData(this);
		const emailValue = FormData.get("email"); // string | null
		const roleValue = FormData.get("role"); // "ADMIN" | "CLIENT" | null
		const profilePic = FormData.get("profilePic"); // File | null
	}
}
```

All returned values are nullable because we are not sure that those inputs have values at runtime.

All other native methods of the `FormData` object are available as well and are fully typed.

The `FormManipulation` factory function provides a few other useful methods you can explore on your own.

### `x_attr_values`

Sometimes you may have components that accept plain string attributes or custom attributes with their values as `string` (set in a `*.haq.json` file).
You then might want to access the literal values you pass in to these components for better type safety.

`x_attr_values` takes in a space separated list of attribute names to track.

**NOTE** - This directive can only be used on the root component of a Web Component or App Component. HAQ will scan all nested children, whether aliased or not, and generate types.

Here is a simple example using our `MyHeader` App Component:

```tsx
---
// src/app-components/MyHeader/MyHeader.astro

import type { HAQ_AliasableComponentProps } from "@haq/astro";

import "./MyHeader.css";

import NavLink from "../../components/NavLink.astro";
import MyConfetti from "../../web-components/MyConfetti/MyConfetti.astro";

interface Props extends Pick<HAQ_AliasableComponentProps, "x_appc"> {}
---

<header transition:persist="MyHeader" id="header" x_attr_values="text d_particle_count" x_haq>
	<MyConfetti d_particle_count="100" x_alias />
	<nav class="flex flex-center" x_sel="nav" x_haq>
		<NavLink text="Home" href="/" x_alias />
		<NavLink text="Custom Elements" href="/tutorial/custom-elements" />
		<NavLink text="Web Components" href="/tutorial/web-components" />
		<NavLink text="Custom Events" href="/tutorial/custom-events" />
		<NavLink text="App Components" href="/tutorial/app-components" />
	</nav>
</header>
```

The generated type would look like this:

```ts
{
	d_particle_count: "100";
	text: "Home" | "Custom Elements" | "Web Components" | "Custom Events" | "App Components";
}
```

You can then access these types like this:

```ts
// src/app-components/MyHeader/MyHeader.ts

import type { MU_MyHeader } from "@haq/markup";

type T = MU_MyHeader; // the generated web component markup type
type TextValues = T["HAQ_attributeValues"]["text"];
```

### `x_slot`

Sometimes you may want to restrict what kind of Astro components get passed in as slots to other components.

By adding a `x_slot` directive to a `<slot>` element, it enforces to pass in at least one slotted component when aliasing the component.

`x_slot` can also take in a space separated list of valid typed components (components with a `x_haq` or `x_webc` directive).
In that case, then the aliasing component must pass in at least one component that satisfies the values passed in to `x_slot`.

For example, in our `Scaffold` component, we can enforce that we must pass in a `MyHeader` component to our `<body>`.

```tsx
// src/layouts/Scaffold.astro

<body>
	<slot name="body:" x_slot="MyHeader" />
</body>
```

Now if we don't pass in a `<MyHeader>` component inside a `<Scaffold>` component, we would get an error saying: `"Scaffold" must have at least one of the following slot children: "MyHeader".`

Keep in mind that HAQ Astro will scan all nested aliased components. So for example, `<MyHeader>` can exist in another component/file, let's call it `OtherHeader.astro`, and then wherever you use `<Scaffold>`, it can have a child like this: `<OtherHeader slot="body:">` and it will be valid. Because ultimately you did pass a `<MyHeader>` component.

In addition, the components listed in `x_slot` will be available in your browser logic (Web Components or App Components).

If only one value is passed in to `x_slot`, then that component will be non nullable, since it will be rendered.
Otherwise, all the components listed will be nullable when queried.

You can explore other `DOMManipulation` methods on your own.

### Ignore HAQ Errors

HAQ Astro provides comment directives to suppress errors in your Astro (`.astro`) and CSS (`.css`) files.

- `haq-check-ignore` - Ignores the next line.
- `haq-check-ignore-all` - Ignores the entire file. Must be placed at the top of the file.

### Helper Types

#### `HAQ_AnyDOMElement`

In certain abstract contexts, you might need to pass in any kind of DOM element. This type alias allows you to do that while preserving the type safety within the HAQ Astro compile time context.

```ts
function someFunc(Elem: HAQ_AnyDOMElement) {
	// you have access to basic markup agnostic methods like getBoundingClientRect, offsetHeight, etc....
}
```

#### `HAQ_DOMElement`

This helper type accepts a type param that satisfies a generated markup type and returns its valid DOM element type.

```ts
import type { HAQ_DOMElement } from "@haq/astro";

type T = MU_MyComponent; // the generated  markup type

type MyComponentElem = HAQ_DOMElement<T>;
```

#### `HAQ_FlattenChildren`

If you inspect a generated markup type, you will see that each component has a `HAQ_children` or `HAQ_slotChildren` property with the component's children types. If you want to access a deeply nested child's type, it can become pretty noisy.

Imagine we want to access the `NavLink` component from our `MyHeader` App Component.

```ts
// src/app-components/MyHeader/MyHeader.ts
//
type T = MU_MyHeader; // the generated App Component markup type

type NavLink = T["HAQ_children"]["Nav"]["HAQ_children"]["NavLink"];
```

We can do this instead:

```ts
// src/app-components/MyHeader/MyHeader.ts

import type { HAQ_FlattenChildren } from "@haq/astro";

type T = MU_MyHeader; // the generated App Component markup type

type X = HAQ_FlattenChildren<T>;
type NavLinkType = X["Nav"]["NavLink"]["_T"]; // the NavLink markup type
type NavLinkElem = X["Nav"]["NavLink"]["_EL"]; // the actual typed NavLink DOM elem
```

This helper type exposes two properties for every component:

- `_T` - The raw markup type
- `_EL` - The typed DOM element

#### `HAQ_NativeDOMElement`

This helper type accepts a type parameter satisfying a valid native html tag and returns the typed DOM element.

For example, you can imagine you want to pass around a form element to an abstract handler but need to make sure it is a valid form element within the HAQ Astro compile time context.

```ts
import type { HAQ_NativeDOMElement } from "@haq/astro";

function someFormHandler(Form: HAQ_NativeDOMElement<"form">) {
	// your logic

	Form.submit(); // this is valid
	const isDisabled = Form.disabled; // not valid, "disabled" does not exist as a property of the form element
}
```
