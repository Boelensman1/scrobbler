SRC_FILES=$(shell find src/)

node_modules: package.json package-lock.json
	npm ci

clean-cache:
	rm -rf .parcel-cache

clean-dist: clean-cache
	rm -rf ./web-ext-artifacts dist

start-firefox: build-firefox
	$(shell DEBUG=1 parcel watch src/manifests/v2/manifest.json --host localhost & web-ext run --source-dir ./dist/ --target firefox-desktop --keep-profile-changes --firefox-profile=scrobbler-ext-dev)

start-chrome: build-chrome
	$(shell DEBUG=1 parcel watch src/manifests/v3/manifest.json --host localhost & web-ext run --source-dir ./dist/ --target chromium)

build-firefox: clean-cache clean-dist node_modules $(SRC_FILES)
	parcel build src/manifests/v2/manifest.json

build-chrome: clean-cache clean-dist node_modules $(SRC_FILES)
	parcel build src/manifests/v3/manifest.json

package:
	web-ext build --source-dir ./dist/

package-firefox: build-firefox package

package-chrome: build-chrome package
