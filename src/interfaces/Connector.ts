import PartialSongInfo from './PartialSongInfo'
import TimeInfo from './TimeInfo'

type Getter = (connector: Connector) => Promise<PartialSongInfo[]>
type PostProcessor = (songInfos: PartialSongInfo[]) => PartialSongInfo[]

export interface Connector {
  getters: Getter[]
  postProcessors: PostProcessor[]

  setup(): Promise<void>
  isPlaying(): Promise<boolean>
  isReady(): Promise<boolean>

  getTimeInfo(): Promise<TimeInfo>
  getCurrentTrackId(): Promise<any>
}

interface ConnectorStatic {
  hostMatch(host: string): boolean

  new (): Connector
}

export default ConnectorStatic
