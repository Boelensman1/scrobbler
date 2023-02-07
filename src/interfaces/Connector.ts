import type { ConnectorMiddleware, LastFm, ConfigContainer } from 'internals'
import PartialSongInfo from './PartialSongInfo'
import TimeInfo from './TimeInfo'

export type Getter = (connector: Connector) => Promise<PartialSongInfo[]>
export type PostProcessor = (songInfos: PartialSongInfo[]) => PartialSongInfo[]

export interface Connector {
  connectorMiddleware: ConnectorMiddleware
  scrobbler: LastFm
  config: ConfigContainer

  getters: Getter[]
  postProcessors: PostProcessor[]

  setup(): Promise<HTMLElement | null>
  isPlaying(): Promise<boolean>
  isReady(): Promise<boolean>

  getTimeInfo(): Promise<TimeInfo>
  getCurrentTrackId(): Promise<any>

  getPopularity?(): Promise<number>
}

interface ConnectorStatic {
  hostMatch(host: string): boolean

  new (scrobbler: LastFm, config: ConfigContainer): Connector
}

export default ConnectorStatic
