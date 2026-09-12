# @haq/astro

## 0.1.9

### Patch Changes

- - Combined `gen` and `check` cli commands into one `compile` command.
  
  - Improves DX and performance.

## 0.1.8

### Patch Changes

- Updated dependencies
  - @haq/utils@0.1.5

## 0.1.7

### Patch Changes

- `HAQ_HAS_SCRIPT` no longer needed as a directive in Astro pages files.
- Added author to jsdocs.

## 0.1.6

### Patch Changes

- Added global augmentation to `getComputedStyle()` on the window object.

## 0.1.5

### Patch Changes

- Introduced tool that validates your environment variables and provides type safety and intellisense.

## 0.1.4

### Patch Changes

- Fix critical compile time bug where internal types were importing from exported entry points.

## 0.1.3

### Patch Changes

- Introduced AppComponent class as a replacement to the composed component factory the user had to implement.

## 0.1.2

### Patch Changes

- Generated file `__global.d.ts` is now `__global.t.s` so that it is not ignored by the `"skipLibCheck": true` tsconfig option.

- Docs added.

## 0.1.1

### Patch Changes

- Fix critical CLI bug. Now CLI must be invoked using a node launcher wrapper.

    ```typescript
    // src/haq.ts
    import "@haq/astro/cli";
    ```

    Then either in "scripts" in your package.json or directly in the terminal.

    ```bash
    node src/haq.ts [command] [...flags]
    ```
