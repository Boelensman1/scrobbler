start-firefox:
	DEBUG=1 parcel watch src/manifests/v2/manifest.json --host localhost & web-ext run --source-dir ./dist/ --target firefox-desktop --keep-profile-changes --firefox-profile=scrobbler-ext-dev

build-firefox:
	rm -rf ./web-ext-artifacts dist .parcel-cache
	parcel build src/manifests/v2/manifest.json && web-ext build --source-dir ./dist/
