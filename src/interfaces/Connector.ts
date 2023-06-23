import type { SongInfo } from 'interfaces'
import type { LastFm, ConfigContainer } from 'internals'
import type PartialSongInfo from './PartialSongInfo'
import type TimeInfo from './TimeInfo'

export type Getter = (connector: Connector) => Promise<PartialSongInfo[]>
export type PostProcessor = (songInfos: PartialSongInfo[]) => PartialSongInfo[]

export type ConnectorKey = string
export type ConnectorTrackId = string

export interface Connector {
  scrobbler: LastFm
  config: ConfigContainer
  connectorTrackId: ConnectorTrackId | null
  shouldForceRecogniseCurrentTrack: boolean

  getters: Getter[]
  postProcessors: PostProcessor[]

  setup(): Promise<void>
  isPlaying(): Promise<boolean>
  isReady(): Promise<boolean>

  getTimeInfo(): Promise<TimeInfo>
  getCurrentTrackId(): Promise<ConnectorTrackId | null>

  getPopularity(): Promise<number>

  searchQueryList: SongInfo[]

  shouldScrobble(): Promise<boolean>

  updateDisplayOnPage(): Promise<void>
  getInfoBoxElement(): Promise<HTMLDivElement | null>
}

interface ConnectorStatic {
  connectorKey: ConnectorKey
  locationMatch(location: Location): boolean

  new (scrobbler: LastFm, config: ConfigContainer): Connector
}

export default ConnectorStatic
