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
          meta: { ...trackInCache.meta },
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
            meta: { ...trackInCache.meta },
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

  expiresAfter = 1000 * 60 * 60 * 24 * 30 // 30 days

  constructor(browserStorage: BrowserStorage) {
    this.browserStorage = browserStorage
    this.trackInfoCache = this.browserStorage.getInLocal('trackInfoCache')

    // delete all entries older than a month
    Object.entries(this.trackInfoCache).forEach(([connectorKey, tracks]) => {
      Object.entries(tracks).forEach(([connectorTrackId, trackInCache]) => {
        if (Date.now() - trackInCache.meta.added > this.expiresAfter) {
          this.delete({ connectorKey, connectorTrackId }, true)
        }
      })
    })
    this.syncCache()
  }

  async syncCache() {
    const cacheFromStorage = this.browserStorage.getInLocal('trackInfoCache')
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
    await this.browserStorage.setInLocal('trackInfoCache', mergedCache)
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
      meta: { added: Date.now() },
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
    if (!this.trackInfoCache[connectorKey]) {
      return false
    }
    const result = this.trackInfoCache[connectorKey][connectorTrackId]
    if (!result) {
      logger.debug(`Trackinfocache result for "${connectorTrackId}": false`)
      return false
    }

    const track = result.track
    const age = result.meta.added

    if (Date.now() - age > this.expiresAfter) {
      // delete the expired cache and try again
      logger.debug(`Expired cache for: "${track.name}", deleting cache result`)
      await this.delete({ connectorKey, connectorTrackId })
      return false
    }

    logger.debug(
      `Trackinfocache result for "${connectorTrackId}": ${
        result ? `${track.artist} - ${track.name}` : false
      }`,
    )
    return track
  }

  async getAge({
    connectorKey,
    connectorTrackId,
  }: TrackSelector): Promise<number | false> {
    if (!this.trackInfoCache[connectorKey]) {
      return false
    }
    const result =
      this.trackInfoCache[connectorKey][connectorTrackId]?.meta.added || false

    logger.debug(
      `Trackinfocache age result for "${connectorTrackId}": ${
        result ? new Date(result).toISOString() : false
      }`,
    )
    return result
  }

  async delete(
    { connectorKey, connectorTrackId }: TrackSelector,
    noSync: boolean = false,
  ): Promise<void> {
    if (!noSync) {
      await this.syncCache()
    }
    if (this.trackInfoCache[connectorKey]) {
      delete this.trackInfoCache[connectorKey][connectorTrackId]
      if (!noSync) {
        await this.syncCache()
      }
    }
  }
}

export default TrackInfoCacheManager
