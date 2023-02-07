import type { Connector, Getter, PostProcessor, TimeInfo } from 'interfaces'
import { ConfigContainer, ConnectorMiddleware, LastFm } from 'internals'

abstract class BaseConnector implements Connector {
  connectorMiddleware: ConnectorMiddleware
  scrobbler: LastFm
  config: ConfigContainer

  abstract getters: Getter[]
  abstract postProcessors: PostProcessor[]

  constructor(scrobbler: LastFm, config: ConfigContainer) {
    this.connectorMiddleware = new ConnectorMiddleware(this)
    this.scrobbler = scrobbler
    this.config = config
  }

  abstract setup(): Promise<HTMLElement>
  abstract isPlaying(): Promise<boolean>
  abstract isReady(): Promise<boolean>
  abstract getTimeInfo(): Promise<TimeInfo>
  abstract getCurrentTrackId(): Promise<string>
}

export default BaseConnector
