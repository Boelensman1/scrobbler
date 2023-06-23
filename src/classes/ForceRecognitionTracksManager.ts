import browser from 'webextension-polyfill'
import type {
  TrackSelector,
  ForceRecognitionTracks,
  ConnectorTrackId,
  ConnectorKey,
} from 'interfaces'

interface ForcedRecognitionTracksInStorage {
  [connectorKey: ConnectorKey]: ConnectorTrackId[]
}

class ForceRecognitionTracksManager {
  forcedRecognitionTracks: ForceRecognitionTracks | null = null

  async loadForceRecognitionTracks() {
    const storageData = await browser.storage.sync.get()

    let forcedRecognitionTracks =
      storageData.forcedRecognitionTracks as ForcedRecognitionTracksInStorage | null

    if (!forcedRecognitionTracks) {
      forcedRecognitionTracks = {}
      this.syncForceRecognitionTracks()
    }
    this.forcedRecognitionTracks = Object.entries(
      forcedRecognitionTracks,
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
  }

  async syncForceRecognitionTracks() {
    if (!this.forcedRecognitionTracks) {
      return
    }

    await browser.storage.sync.set({
      forcedRecognitionTracks: Object.entries(
        this.forcedRecognitionTracks,
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
      ),
    })
  }

  addForcedRecognitionTrack({
    connectorKey,
    connectorTrackId,
  }: TrackSelector): void {
    if (!this.forcedRecognitionTracks) {
      throw new Error('forcedRecognition tracks are not ready yet')
    }

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
    if (!this.forcedRecognitionTracks) {
      throw new Error('forcedRecognition tracks are not ready yet')
    }

    if (this.forcedRecognitionTracks[connectorKey]) {
      this.forcedRecognitionTracks[connectorKey].delete(connectorTrackId)
      this.syncForceRecognitionTracks()
    }
  }

  getIfTrackIsForcedRecognition({
    connectorKey,
    connectorTrackId,
  }: TrackSelector): boolean {
    if (!this.forcedRecognitionTracks) {
      throw new Error('forcedRecognition tracks are not ready yet')
    }

    if (!this.forcedRecognitionTracks[connectorKey]) {
      return false
    }
    return this.forcedRecognitionTracks[connectorKey].has(connectorTrackId)
  }

  getForcedRecognitionTracks(): ForceRecognitionTracks {
    if (!this.forcedRecognitionTracks) {
      throw new Error('forcedRecognition tracks are not ready yet')
    }
    return this.forcedRecognitionTracks
  }
}

export default ForceRecognitionTracksManager
