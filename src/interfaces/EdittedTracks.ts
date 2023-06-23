import type { SavedEdit, ConnectorKey, ConnectorTrackId } from 'interfaces'

interface EdittedTracks {
  [connectorKey: ConnectorKey]: {
    [connectorTrackId: ConnectorTrackId]: SavedEdit
  }
}

export default EdittedTracks
