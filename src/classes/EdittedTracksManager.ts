import browser from 'webextension-polyfill'
import type {
  SavedEdit,
  TrackSelector,
  SongInfo,
  EdittedTracks,
} from 'interfaces'

class EdittedTracksManager {
  edittedTracks: EdittedTracks | null = null

  async loadEdittedTracks() {
    let { edittedTracks } = await browser.storage.sync.get()
    if (!edittedTracks) {
      edittedTracks = {}
      this.syncEdittedTracks()
    }
    this.edittedTracks = edittedTracks
  }

  async syncEdittedTracks() {
    await browser.storage.sync.set({ edittedTracks: this.edittedTracks })
  }

  addEdittedTrack(edittedTrack: SavedEdit): void {
    if (!this.edittedTracks) {
      throw new Error('Editted tracks are not ready yet')
    }

    const { connectorKey, connectorTrackId } = edittedTrack
    if (!this.edittedTracks[connectorKey]) {
      this.edittedTracks[connectorKey] = {}
    }

    this.edittedTracks[connectorKey][connectorTrackId] = edittedTrack
    this.syncEdittedTracks()
  }

  removeEdittedTrack({ connectorKey, connectorTrackId }: TrackSelector): void {
    if (!this.edittedTracks) {
      throw new Error('Editted tracks are not ready yet')
    }

    if (this.edittedTracks[connectorKey]) {
      delete this.edittedTracks[connectorKey][connectorTrackId]
      this.syncEdittedTracks()
    }
  }

  getEdittedTrack({
    connectorKey,
    connectorTrackId,
  }: TrackSelector): SongInfo | false {
    if (!this.edittedTracks) {
      throw new Error('Editted tracks are not ready yet')
    }

    if (!this.edittedTracks[connectorKey]) {
      return false
    }
    const track = this.edittedTracks[connectorKey][connectorTrackId]
    return track ? track.edittedSongInfo : false
  }

  getEdittedTracks(): EdittedTracks {
    if (!this.edittedTracks) {
      throw new Error('Editted tracks are not ready yet')
    }
    return this.edittedTracks
  }
}

export default EdittedTracksManager
