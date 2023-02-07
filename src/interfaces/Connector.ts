import type { SongInfo } from 'interfaces'
import type { LastFm, ConfigContainer } from 'internals'
import type PartialSongInfo from './PartialSongInfo'
import type TimeInfo from './TimeInfo'

export type Getter = (connector: Connector) => Promise<PartialSongInfo[]>
export type PostProcessor = (songInfos: PartialSongInfo[]) => PartialSongInfo[]

export interface Connector {
  scrobbler: LastFm
  config: ConfigContainer

  getters: Getter[]
  postProcessors: PostProcessor[]

  setup(): Promise<void>
  isPlaying(): Promise<boolean>
  isReady(): Promise<boolean>

  getTimeInfo(): Promise<TimeInfo>
  getCurrentTrackId(): Promise<any>

  getPopularity(): Promise<number>

  searchQueryList: SongInfo[]
}

interface ConnectorStatic {
  hostMatch(host: string): boolean

  new (scrobbler: LastFm, config: ConfigContainer): Connector
}

export default ConnectorStatic
