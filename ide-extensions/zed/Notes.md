# Developing Zed Extension

Run once:

```bash
rustup target add wasm32-wasip1
```

To build:

```bash
cargo build --target wasm32-wasip1
```

Run zed: install dev extension from the command pallette.

If the rust part doesn't change, simply restarting the language server (option + R) is enough.

If the rust part changes, then run `pn build` before restarting the language server.
