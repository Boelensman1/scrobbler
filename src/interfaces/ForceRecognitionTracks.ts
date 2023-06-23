import type { ConnectorKey, ConnectorTrackId } from 'interfaces'

interface ForceRecognitionTracks {
  [connectorKey: ConnectorKey]: Set<ConnectorTrackId>
}

export default ForceRecognitionTracks
