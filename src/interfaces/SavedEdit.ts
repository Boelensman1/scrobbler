import type { ConnectorTrackId, SongInfo } from 'interfaces'

interface SavedEdit {
  connectorKey: string
  connectorTrackId: ConnectorTrackId
  edittedSongInfo: SongInfo
}

export type TrackSelector = Pick<SavedEdit, 'connectorKey' | 'connectorTrackId'>

export default SavedEdit
