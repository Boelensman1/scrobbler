import type {
  TrackSelector,
  JSONAble,
  TrackInfoCache,
  ConnectorKey,
  ConnectorTrackId,
  TrackInStorage,
  TracksInStorage,
  TrackInCache,
} from 'interfaces'
import { BrowserStorage, Logger, Track } from 'internals'

type TrackCacheMap = { [connectorTrackId: ConnectorTrackId]: TrackInCache }

const logger = new Logger('TrackInfoCacheManager')

export const hydrate = (trackInfoCache: JSONAble): TrackInfoCache =>
  Object.keys(
    trackInfoCache as unknown as TrackInfoCache,
  ).reduce<TrackInfoCache>((acc, connectorKey: ConnectorKey) => {
    // @ts-expect-error this is just how this object looks in storage
    const tracksForConnector = trackInfoCache[connectorKey] as TracksInStorage
    const result = tracksForConnector.reduce<TrackCacheMap>(
      (
        innerAcc,
        [connectorTrackId, trackInCache]: [ConnectorTrackId, TrackInStorage],
      ) => {
        innerAcc[connectorTrackId] = {
          meta: { added: new Date(trackInCache.meta.added) },
          track: new Track(trackInCache.track),
        }
        return innerAcc
      },
      {},
    )
    acc[connectorKey] = result
    return acc
  }, {})

export const deHydrate = (trackInfoCache: TrackInfoCache): JSONAble =>
  Object.keys(trackInfoCache).reduce<JSONAble>(
    (acc, connectorKey: ConnectorKey) => {
      // @ts-expect-error jsonable is not a great type
      acc[connectorKey] = Object.entries(trackInfoCache[connectorKey]).map(
        ([connectorTrackId, trackInCache]) => [
          connectorTrackId,
          {
            meta: { added: trackInCache.meta.added.getTime() },
            track: trackInCache.track.getAllPropsForCache(),
          },
        ],
      ) as TracksInStorage
      return acc
    },
    {},
  )

class TrackInfoCacheManager {
  browserStorage: BrowserStorage
  trackInfoCache: TrackInfoCache

  constructor(browserStorage: BrowserStorage) {
    this.browserStorage = browserStorage
    this.trackInfoCache = this.browserStorage.get('trackInfoCache')
  }

  async syncCache() {
    const cacheFromStorage = this.browserStorage.get('trackInfoCache')
    const mergedCache = Object.keys(this.trackInfoCache).reduce(
      (acc, connectorKey: ConnectorKey) => {
        if (!acc[connectorKey]) {
          // no cache for connectorkey yet, replace it
          acc[connectorKey] = this.trackInfoCache[connectorKey]
        } else {
          acc[connectorKey] = {
            ...acc[connectorKey],
            ...this.trackInfoCache[connectorKey],
          }
        }
        return acc
      },
      cacheFromStorage,
    )

    this.trackInfoCache = mergedCache
    await this.browserStorage.set('trackInfoCache', mergedCache)
  }

  async addOrUpdate(
    { connectorKey, connectorTrackId }: TrackSelector,
    track: Track,
  ): Promise<void> {
    // check if track already came from cache
    if (track.fromCache) {
      return
    }

    await this.syncCache()

    if (!this.trackInfoCache[connectorKey]) {
      this.trackInfoCache[connectorKey] = {}
    }
    const trackForCache = new Track(track.getAllPropsForCache())
    this.trackInfoCache[connectorKey][connectorTrackId] = {
      meta: { added: new Date() },
      track: trackForCache,
    }
    logger.debug(
      `Inserted "${trackForCache.name}" into cache for "${connectorTrackId}"`,
    )
    await this.syncCache()
  }

  async get({
    connectorKey,
    connectorTrackId,
  }: TrackSelector): Promise<Track | false> {
    await this.syncCache()
    if (!this.trackInfoCache[connectorKey]) {
      return false
    }
    const result =
      this.trackInfoCache[connectorKey][connectorTrackId]?.track || false

    logger.debug(
      `Trackinfocache result for "${connectorTrackId}": ${
        result ? `${result.artist} - ${result.name}` : false
      }`,
    )
    return result
  }

  async delete({
    connectorKey,
    connectorTrackId,
  }: TrackSelector): Promise<void> {
    await this.syncCache()
    if (this.trackInfoCache[connectorKey]) {
      delete this.trackInfoCache[connectorKey][connectorTrackId]
      await this.syncCache()
    }
  }
}

export default TrackInfoCacheManager
