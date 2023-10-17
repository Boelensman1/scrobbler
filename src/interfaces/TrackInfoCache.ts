import type { ConnectorKey, ConnectorTrackId } from 'interfaces'
import type { Track } from 'internals'

export type TrackInStorage = {
  meta: { added: number }
  track: ReturnType<Track['getAllPropsForCache']>
}
export type TracksInStorage = [ConnectorTrackId, TrackInStorage][]

export interface TrackInCache {
  meta: { added: number }
  track: Track
}

interface TrackInfoCache {
  [connectorKey: ConnectorKey]: {
    [connectorTrackId: ConnectorTrackId]: TrackInCache
  }
}

export default TrackInfoCache
