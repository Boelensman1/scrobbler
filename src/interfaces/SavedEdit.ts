import type { ConnectorTrackId, ConnectorKey, SongInfo } from 'interfaces'

interface SavedEdit {
  connectorKey: ConnectorKey
  connectorTrackId: ConnectorTrackId
  edittedSongInfo: SongInfo
}

export default SavedEdit
