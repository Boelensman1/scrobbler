import type { ConnectorMiddleware } from 'classes'
import PartialSongInfo from './PartialSongInfo'
import TimeInfo from './TimeInfo'

type Getter = (connector: Connector) => Promise<PartialSongInfo[]>
type PostProcessor = (songInfos: PartialSongInfo[]) => PartialSongInfo[]

export interface Connector {
  connectorMiddleware: ConnectorMiddleware

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

  new (): Connector
}

export default ConnectorStatic
