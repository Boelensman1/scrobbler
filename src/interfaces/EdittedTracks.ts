import type { SavedEdit } from 'interfaces'

interface EdittedTracks {
  [connectorKey: string]: {
    [connectorTrackId: string]: SavedEdit
  }
}

export default EdittedTracks
