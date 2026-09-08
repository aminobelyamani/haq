#!/bin/bash

# run node script that handles dependencies versions

PACKAGE_VERSION=$(node ../astro/@dist/ci/index.js astro-ssr)
echo -e "Publishing @haq/astro-ssr -> v$PACKAGE_VERSION ...\n"

# commit locally, no push

git add .

git commit -m "CI Release - @haq/astro-ssr v$PACKAGE_VERSION"

# publish to jsr

pnpm dlx jsr publish &&

# restore to workspace versions

rm -f package.json &&
mv package-temp.json package.json &&

# commit & push

git add . &&

git commit --amend --no-edit &&

git push


