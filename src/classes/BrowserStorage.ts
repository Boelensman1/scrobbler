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
  state: State
  trackInfoCache: TrackInfoCache
}

interface SessionStorage {}
type Storage = SyncStorage & LocalStorage & SessionStorage

const initialSyncStorage: SyncStorage = {
  edittedTracks: {},
  forcedRecognitionTracks: {},
  savedRegexes: [],
  config: defaultConfig,
}
const initialLocalStorage: LocalStorage = {
  state: initialState,
  trackInfoCache: {},
}
const initialSessionStorage: SessionStorage = {}

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
type SessionStorageInBrowser = { [K in keyof SessionStorage]: JSONAble }

const hydrate = <STOR extends SyncStorage | LocalStorage | SessionStorage>(
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

const deHydrate = <STOR extends SyncStorage | LocalStorage | SessionStorage>(
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
  sessionStorage?: SessionStorage

  constructor() {
    // if something changed in another browser instance, also update it here
    // this will also be called if we update the storage, which is not ideal
    // but there doesn't seem to be an easy way to disable/check for that
    browser.storage.sync.onChanged.addListener(this.init.bind(this))
    browser.storage.local.onChanged.addListener(this.init.bind(this))

    // once firefox adds support for session.setAccessLevel, this if can be removed
    if (browser.storage.session) {
      browser.storage.session.onChanged.addListener(this.init.bind(this))
    }
  }

  async init() {
    const browserStorageSync = browser.storage.sync
    const browserStorageLocal = browser.storage.local
    const browserStorageSession = browser.storage.session

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

    // once firefox adds support for session.setAccessLevel, this if can be removed
    if (browserStorageSession) {
      this.sessionStorage = hydrate<SessionStorage>(
        (await browserStorageSession.get()) as SessionStorageInBrowser,
        initialSessionStorage,
      )
    }
  }
  async realSet<
    STOR extends SyncStorage | LocalStorage | SessionStorage,
    KEY extends keyof STOR,
  >(location: 'sync' | 'local' | 'session', key: KEY, value: STOR[KEY]) {
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

  async setInSession<T extends keyof SessionStorage>(
    key: T,
    value: SessionStorage[T],
  ) {
    return this.realSet<SessionStorage, typeof key>('session', key, value)
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

  getInSession<T extends keyof SessionStorage>(key: T): SessionStorage[T] {
    if (!this.sessionStorage) {
      throw new Error(`Storage session is not initialised yet`)
    }
    return this.sessionStorage[key]
  }
}

export default BrowserStorage
