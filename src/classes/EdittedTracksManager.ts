import type {
  SavedEdit,
  TrackSelector,
  SongInfo,
  EdittedTracks,
} from 'interfaces'
import { BrowserStorage } from 'internals'

class EdittedTracksManager {
  browserStorage: BrowserStorage
  edittedTracks: EdittedTracks

  constructor(browserStorage: BrowserStorage) {
    this.browserStorage = browserStorage

    this.edittedTracks = browserStorage.getInSync('edittedTracks')
  }

  async syncEdittedTracks() {
    await this.browserStorage.setInSync('edittedTracks', this.edittedTracks)
  }

  async addEdittedTrack(edittedTrack: SavedEdit): Promise<void> {
    const { connectorKey, connectorTrackId } = edittedTrack
    if (!this.edittedTracks[connectorKey]) {
      this.edittedTracks[connectorKey] = {}
    }

    this.edittedTracks[connectorKey][connectorTrackId] = edittedTrack
    await this.syncEdittedTracks()
  }

  removeEdittedTrack({ connectorKey, connectorTrackId }: TrackSelector): void {
    if (this.edittedTracks[connectorKey]) {
      delete this.edittedTracks[connectorKey][connectorTrackId]
      this.syncEdittedTracks()
    }
  }

  getEdittedTrack({
    connectorKey,
    connectorTrackId,
  }: TrackSelector): SongInfo | false {
    if (!this.edittedTracks[connectorKey]) {
      return false
    }
    const track = this.edittedTracks[connectorKey][connectorTrackId]
    return track ? track.edittedSongInfo : false
  }

  getEdittedTracks(): EdittedTracks {
    return this.edittedTracks
  }
}

export default EdittedTracksManager
