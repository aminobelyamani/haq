#!/bin/bash

PACKAGE_NAME=$1
SCRIPT_PATH="./packages/astro/@dist/ci/index.js"
PUBLISH_SCRIPT_NAME=""
PACKAGE_DIR=""

if [[ "$PACKAGE_NAME" == "astro" ]]; then
	PUBLISH_SCRIPT_NAME="publish:astro"
	PACKAGE_DIR="./packages/astro"
elif [[ "$PACKAGE_NAME" == "astro-ssr" ]]; then
	PUBLISH_SCRIPT_NAME="publish:astro-ssr"
	PACKAGE_DIR="./packages/astro-ssr"
elif [[ "$PACKAGE_NAME" == "language-server" ]]; then
	PUBLISH_SCRIPT_NAME="publish:language-server"
	PACKAGE_DIR="./packages/language-server"
else
	exit 1
fi

# run node script that handles dependencies versions

PACKAGE_VERSION=$(node $SCRIPT_PATH $PACKAGE_NAME -d $PACKAGE_DIR)
echo -e "Publishing @haq/$PACKAGE_NAME -> v$PACKAGE_VERSION ...\n"

# commit locally, no push

git add . &&

git commit -m "CI Release - @haq/$PACKAGE_NAME v$PACKAGE_VERSION" &&

# publish to jsr

pnpm $PUBLISH_SCRIPT_NAME &&

# restore to workspace versions

echo -e "Restoring dependencies to workspace versions...\n"

rm -f $PACKAGE_DIR/package.json &&
mv $PACKAGE_DIR/package-temp.json $PACKAGE_DIR/package.json &&

# commit & push

git add . &&

git commit --amend --no-edit &&

git push &&

echo -e "Published @haq/$PACKAGE_NAME successfully!\n"
