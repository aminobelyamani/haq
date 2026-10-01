rm -f pnpm-lock.yaml &&
rm -rf node_modules .turbo &&
rm -rf packages/astro/node_modules packages/astro/.turbo packages/astro/@dist &&
rm -rf packages/astro-ssr/node_modules packages/astro-ssr/.turbo packages/astro-ssr/@dist &&
rm -rf packages/language-server/node_modules packages/language-server/.turbo packages/language-server/@dist &&
rm -rf packages/utils/node_modules packages/utils/.turbo packages/utils/@dist &&
rm -rf ide-extensions/vscode/node_modules ide-extensions/vscode/.turbo ide-extensions/vscode/out &&
rm -rf examples/astro/node_modules examples/astro/.turbo examples/astro/.astro examples/astro/dist
