rm -f pnpm-lock.yaml &&
rm -rf node_modules .turbo &&
rm -rf packages/astro/node_modules packages/astro/.turbo packages/astro/@dist &&
rm -rf packages/astro-ssr/node_modules packages/astro-ssr/.turbo packages/astro-ssr/@dist &&
rm -rf packages/utils/node_modules packages/utils/.turbo packages/utils/@dist &&
rm -rf packages/vsce/node_modules packages/vsce/.turbo packages/vsce/out &&
rm -rf examples/astro/node_modules examples/astro/.turbo examples/astro/.astro examples/astro/dist
