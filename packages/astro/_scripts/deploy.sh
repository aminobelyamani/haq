#!/bin/bash

# run node script that handles dependencies versions

PACKAGE_VERSION=$(node ./@dist/ci/index.js astro)
echo -e "Publishing @haq/astro -> v$PACKAGE_VERSION ...\n"

# commit locally, no push

git add . &&

git commit -m "CI Release - @haq/astro v$PACKAGE_VERSION" &&

# publish to jsr

pnpm dlx jsr publish &&

# restore to workspace versions

rm -f package.json &&
mv package-temp.json package.json &&

# commit & push

git add . &&

git commit --amend --no-edit &&

git push
