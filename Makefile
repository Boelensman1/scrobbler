SRC_FILES=$(shell find src/)

include .env
.EXPORT_ALL_VARIABLES:

VERSION:=$(shell jq .version ./package.json)


node_modules: package.json package-lock.json
	npm ci

clean-cache:
	rm -rf .parcel-cache

clean-dist: clean-cache
	rm -rf ./web-ext-artifacts dist

lint:
	npx prettier . --check
	npx eslint .
ifneq ($(VERSION),$(shell jq .version ./src/manifests/v2/manifest.json))
		$(error Versions in package.json and manifest v2 are not equal)
endif
ifneq ($(VERSION),$(shell jq .version ./src/manifests/v3/manifest.json))
		$(error Versions in package.json and manifest v3 are not equal)
endif

start-firefox: build-firefox
	$(shell DEBUG=1 npx parcel watch src/manifests/v2/manifest.json --host localhost & npx web-ext run --source-dir ./dist/ --target firefox-desktop --keep-profile-changes --firefox-profile=scrobbler-ext-dev)

start-chrome: build-chrome
	$(shell DEBUG=1 npx parcel watch src/manifests/v3/manifest.json --host localhost & npx web-ext run --source-dir ./dist/ --target chromium)

build-firefox: lint clean-cache clean-dist node_modules $(SRC_FILES)
	npx parcel build --no-optimize src/manifests/v2/manifest.json

build-chrome: lint clean-cache clean-dist node_modules $(SRC_FILES)
	npx parcel build --no-optimize src/manifests/v3/manifest.json

web-ext-artifacts:
	rm -rf ./web-ext-artifacts
	npx web-ext build --source-dir ./dist/

sign-firefox: build-firefox
	npx web-ext sign --channel unlisted --api-key $(MOZILLA_API_KEY) --api-secret $(MOZILLA_API_SECRET) --source-dir ./dist/

package-firefox: build-firefox web-ext-artifacts

package-chrome: build-chrome web-ext-artifacts

.PHONY: package-firefox package-chrome sign-firefox build-firefox build-chrome start-firefox start-chrome clean-dist clean-cache lint
