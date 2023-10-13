import type {
  TrackSelector,
  ForceRecognitionTracks,
  ConnectorTrackId,
  ConnectorKey,
  JSONAble,
} from 'interfaces'
import { BrowserStorage } from 'internals'

interface ForcedRecognitionTracksInStorage {
  [connectorKey: ConnectorKey]: ConnectorTrackId[]
}

export const hydrate = (forcedRecognitionTracks: JSONAble) =>
  Object.entries(
    forcedRecognitionTracks as unknown as ForcedRecognitionTracksInStorage,
  ).reduce<ForceRecognitionTracks>(
    (
      acc,
      [connectorKey, connectorTrackIds]: [ConnectorKey, ConnectorTrackId[]],
    ) => {
      acc[connectorKey] = new Set<ConnectorTrackId>(connectorTrackIds)
      return acc
    },
    {},
  )

export const deHydrate = (forcedRecognitionTracks: ForceRecognitionTracks) =>
  Object.entries(
    forcedRecognitionTracks,
  ).reduce<ForcedRecognitionTracksInStorage>(
    (
      acc,
      [connectorKey, connectorTrackIds]: [
        ConnectorKey,
        ForceRecognitionTracks[ConnectorKey],
      ],
    ) => {
      acc[connectorKey] = Array.from(connectorTrackIds)
      return acc
    },
    {},
  )

class ForceRecognitionTracksManager {
  browserStorage: BrowserStorage
  forcedRecognitionTracks: ForceRecognitionTracks

  constructor(browserStorage: BrowserStorage) {
    this.browserStorage = browserStorage

    this.forcedRecognitionTracks = browserStorage.getInSync(
      'forcedRecognitionTracks',
    )
  }

  async syncForceRecognitionTracks() {
    await this.browserStorage.setInSync(
      'forcedRecognitionTracks',
      this.forcedRecognitionTracks,
    )
  }

  addForcedRecognitionTrack({
    connectorKey,
    connectorTrackId,
  }: TrackSelector): void {
    if (!this.forcedRecognitionTracks[connectorKey]) {
      this.forcedRecognitionTracks[connectorKey] = new Set<ConnectorTrackId>()
    }
    this.forcedRecognitionTracks[connectorKey].add(connectorTrackId)
    this.syncForceRecognitionTracks()
  }

  removeForcedRecognitionTrack({
    connectorKey,
    connectorTrackId,
  }: TrackSelector): void {
    if (this.forcedRecognitionTracks[connectorKey]) {
      this.forcedRecognitionTracks[connectorKey].delete(connectorTrackId)
      this.syncForceRecognitionTracks()
    }
  }

  getIfTrackIsForcedRecognition({
    connectorKey,
    connectorTrackId,
  }: TrackSelector): boolean {
    if (!this.forcedRecognitionTracks[connectorKey]) {
      return false
    }
    return this.forcedRecognitionTracks[connectorKey].has(connectorTrackId)
  }

  getForcedRecognitionTracks(): ForceRecognitionTracks {
    return this.forcedRecognitionTracks
  }
}

export default ForceRecognitionTracksManager
