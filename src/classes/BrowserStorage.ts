import browser from 'webextension-polyfill'
import type {
  Config,
  EdittedTracks,
  ForceRecognitionTracks,
  JSONAble,
  SavedRegex,
  State,
  TrackInfoCache,
} from 'interfaces'

import {
  defaultConfig,
  hydrateForceRecognitionTracks,
  hydrateSavedRegexes,
  hydrateTrackInfoCache,
  deHydrateForceRecognitionTracks,
  deHydrateSavedRegexes,
  deHydrateTrackInfoCache,
  initialState,
  // notifyConnectors,
} from 'internals'

interface SyncStorage {
  edittedTracks: EdittedTracks
  forcedRecognitionTracks: ForceRecognitionTracks
  savedRegexes: SavedRegex[]
  config: Config
}
interface LocalStorage {
  trackInfoCache: TrackInfoCache
  state: State
}
type Storage = SyncStorage & LocalStorage

const initialSyncStorage: SyncStorage = {
  edittedTracks: {},
  forcedRecognitionTracks: {},
  savedRegexes: [],
  config: defaultConfig,
}
const initialLocalStorage: LocalStorage = {
  trackInfoCache: {},
  state: initialState,
}

type BaseHydrateFunctions = {
  [K in keyof Storage]: (inp: JSONAble) => Storage[K]
}
type BaseDeHydrateFunctions = {
  [K in keyof Storage]: (inp: Storage[K]) => JSONAble
}
const hydrateFunctions: Partial<BaseHydrateFunctions> = {
  savedRegexes: hydrateSavedRegexes,
  forcedRecognitionTracks: hydrateForceRecognitionTracks,
  trackInfoCache: hydrateTrackInfoCache,
}
const deHydrateFunctions: Partial<BaseDeHydrateFunctions> = {
  savedRegexes: deHydrateSavedRegexes,
  forcedRecognitionTracks: deHydrateForceRecognitionTracks,
  trackInfoCache: deHydrateTrackInfoCache,
}

type SyncStorageInBrowser = { [K in keyof SyncStorage]: JSONAble }
type LocalStorageInBrowser = { [K in keyof LocalStorage]: JSONAble }

const hydrate = <STOR extends SyncStorage | LocalStorage>(
  input: {
    [K in keyof STOR]: JSONAble
  },
  initial: STOR,
): STOR => {
  type HydrateFunctions = { [K in keyof STOR]: (inp: JSONAble) => STOR[K] }

  return (Object.keys(input) as (keyof STOR)[]).reduce(
    <T extends keyof STOR>(acc: STOR, key: T) => {
      const value = input[key]
      if (!value) {
        return acc
      }

      // @ts-expect-error typing became too hard
      const hydrateFunc = hydrateFunctions[key] as HydrateFunctions[T]

      if (hydrateFunc) {
        acc[key] = hydrateFunc(value)
      } else {
        acc[key] = value as unknown as STOR[T]
      }
      return acc
    },
    // if no value, use the value in initialStorage
    initial,
  )
}

const deHydrate = <STOR extends SyncStorage | LocalStorage>(
  input: STOR,
): { [K in keyof STOR]: JSONAble } => {
  type StorageInBrowser = { [K in keyof STOR]: JSONAble }
  type DeHydrateFunctions = {
    [K in keyof STOR]: (inp: STOR[K]) => JSONAble
  }

  return (Object.keys(input) as (keyof StorageInBrowser)[]).reduce(
    <T extends keyof StorageInBrowser>(acc: StorageInBrowser, key: T) => {
      const value = input[key]
      if (!value) {
        return acc
      }

      // @ts-expect-error typing became too hard
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
  syncStorage?: SyncStorage
  localStorage?: LocalStorage

  constructor() {
    // if something changed in another browser instance, also update it here
    // this will also be called if we update the storage, which is not ideal
    // but there doesn't seem to be an easy way to disable/check for that
    browser.storage.sync.onChanged.addListener(this.init.bind(this))
    browser.storage.local.onChanged.addListener(this.init.bind(this))
  }

  async init() {
    const browserStorageSync = browser.storage.sync
    const browserStorageLocal = browser.storage.local

    if (!browserStorageSync) {
      throw new Error('Could not access sync browserStorage')
    }
    if (!browserStorageLocal) {
      throw new Error('Could not access local browserStorage')
    }
    this.syncStorage = hydrate<SyncStorage>(
      (await browserStorageSync.get()) as SyncStorageInBrowser,
      initialSyncStorage,
    )
    this.localStorage = hydrate<LocalStorage>(
      (await browserStorageLocal.get()) as LocalStorageInBrowser,
      initialLocalStorage,
    )
  }
  async realSet<
    STOR extends SyncStorage | LocalStorage,
    KEY extends keyof STOR,
  >(location: 'sync' | 'local', key: KEY, value: STOR[KEY]) {
    const browserStorage =
      location === 'sync' ? browser.storage.sync : browser.storage.local
    const classStorage = (
      location === 'sync' ? this.syncStorage : this.localStorage
    ) as STOR

    if (!classStorage) {
      throw new Error(`Storage ${location} is not initialised yet`)
    }

    classStorage[key] = value
    await browserStorage.set(deHydrate(classStorage))
  }

  async setInSync<T extends keyof SyncStorage>(key: T, value: SyncStorage[T]) {
    return this.realSet<SyncStorage, typeof key>('sync', key, value)
  }

  async setInLocal<T extends keyof LocalStorage>(
    key: T,
    value: LocalStorage[T],
  ) {
    return this.realSet<LocalStorage, typeof key>('local', key, value)
  }

  getInSync<T extends keyof SyncStorage>(key: T): SyncStorage[T] {
    if (!this.syncStorage) {
      throw new Error(`Storage sync is not initialised yet`)
    }
    return this.syncStorage[key]
  }

  getInLocal<T extends keyof LocalStorage>(key: T): LocalStorage[T] {
    if (!this.localStorage) {
      throw new Error(`Storage local is not initialised yet`)
    }
    return this.localStorage[key]
  }
}

export default BrowserStorage
