import type { Config, ConnectorConfig, SongInfo } from 'interfaces'
import type { LastFm } from 'internals'
import type PartialSongInfo from './PartialSongInfo'
import type TimeInfo from './TimeInfo'

export type Getter = (connector: Connector) => Promise<PartialSongInfo[]>
export type PostProcessor = (songInfos: PartialSongInfo[]) => PartialSongInfo[]

export type ConnectorKey = string
export type ConnectorTrackId = string

export interface Connector {
  scrobbler: LastFm
  config: Config
  connectorTrackId: ConnectorTrackId | null
  shouldForceRecogniseCurrentTrack: boolean

  getters: Getter[]
  postProcessors: PostProcessor[]

  scrobbleInfoLocationSelector: string | null
  scrobbleInfoStyle: Partial<CSSStyleDeclaration>

  setup(): Promise<void>
  isPlaying(): Promise<boolean>
  isReady(): Promise<boolean>

  getVideoElementSelector(): Promise<string>
  getTimeInfo(): Promise<TimeInfo>
  getCurrentTrackId(): Promise<ConnectorTrackId | null>

  getPopularity(): Promise<number>
  getIsPrivate(): Promise<boolean | null>

  searchQueryList: SongInfo[]

  shouldScrobble(): Promise<boolean>

  updateDisplayOnPage(): Promise<void>
  getInfoBoxElement(): Promise<HTMLDivElement | null>
}

interface ConnectorStatic {
  connectorKey: ConnectorKey
  locationMatch(location: Location, connectorConfig?: ConnectorConfig): boolean

  new (scrobbler: LastFm, config: Config): Connector
}

export default ConnectorStatic
