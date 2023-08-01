import browser from 'webextension-polyfill'
import type {
  Config,
  EdittedTracks,
  ForceRecognitionTracks,
  JSONAble,
  SavedRegex,
} from 'interfaces'

import {
  defaultConfig,
  deHydrateForceRecognitionTracks,
  deHydrateSavedRegexes,
  hydrateForceRecognitionTracks,
  hydrateSavedRegexes,
  notifyConnectors,
} from 'internals'

interface Storage {
  edittedTracks: EdittedTracks
  forcedRecognitionTracks: ForceRecognitionTracks
  savedRegexes: SavedRegex[]
  config: Config
}

const initialStorage: Storage = {
  edittedTracks: {},
  forcedRecognitionTracks: {},
  savedRegexes: [],
  config: defaultConfig,
}

const hydrateFunctions: Partial<HydrateFunctions> = {
  savedRegexes: hydrateSavedRegexes,
  forcedRecognitionTracks: hydrateForceRecognitionTracks,
}
const deHydrateFunctions: Partial<DeHydrateFunctions> = {
  savedRegexes: deHydrateSavedRegexes,
  forcedRecognitionTracks: deHydrateForceRecognitionTracks,
}

type HydrateFunctions = { [K in keyof Storage]: (inp: JSONAble) => Storage[K] }
type DeHydrateFunctions = {
  [K in keyof Storage]: (inp: Storage[K]) => JSONAble
}
type StorageInBrowser = { [K in keyof Storage]: JSONAble }

const hydrate = (input: StorageInBrowser): Storage => {
  return (Object.keys(input) as (keyof Storage)[]).reduce(
    <T extends keyof Storage>(acc: Storage, key: T) => {
      const value = input[key]
      if (!value) {
        return acc
      }

      const hydrateFunc = hydrateFunctions[key] as HydrateFunctions[T]

      if (hydrateFunc) {
        acc[key] = hydrateFunc(value)
      } else {
        acc[key] = value as unknown as Storage[T]
      }
      return acc
    },
    // if no value, use the value in initialStorage
    initialStorage,
  )
}

const deHydrate = (input: Storage): StorageInBrowser => {
  return (Object.keys(input) as (keyof StorageInBrowser)[]).reduce(
    <T extends keyof StorageInBrowser>(acc: StorageInBrowser, key: T) => {
      const value = input[key]
      if (!value) {
        return acc
      }

      const deHydrateFunc = deHydrateFunctions[key] as DeHydrateFunctions[T]

      if (deHydrateFunc) {
        acc[key] = deHydrateFunc(value)
      } else {
        acc[key] = value as unknown as StorageInBrowser[T]
      }
      return acc
    },
    {} as StorageInBrowser,
  )
}

class BrowserStorage {
  storage?: Storage

  constructor() {
    // if something changed in another browser instance, also update it here
    // this will also be called if we update the storage, which is not ideal
    // but there doesn't seem to be an easy way to disable/check for that
    browser.storage.sync.onChanged.addListener(this.init.bind(this))
  }

  async init() {
    const browserStorage = browser.storage.sync || browser.storage.local
    if (!browserStorage) {
      throw new Error('Could not access browserStorage')
    }
    const fromStorage = await browserStorage.get()
    this.storage = hydrate(fromStorage as StorageInBrowser)

    notifyConnectors('configUpdated')
  }

  async set<T extends keyof Storage>(key: T, value: Storage[T]) {
    if (!this.storage) {
      throw new Error('Storage is not initialised yet')
    }

    const browserStorage = browser.storage.sync || browser.storage.local
    this.storage[key] = value
    await browserStorage.set(deHydrate(this.storage))

    notifyConnectors('configUpdated')
  }

  get<T extends keyof Storage>(key: T): Storage[T] {
    if (!this.storage) {
      throw new Error('Storage is not initialised yet')
    }

    return this.storage[key]
  }
}

export default BrowserStorage
