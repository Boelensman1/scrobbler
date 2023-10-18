export interface ConnectorConfig {
  invidious: { hosts: string[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface Config {
  scrobbler: null | 'lastFm'
  minimumScrobblerQuality: number
  scrobblerQualityDynamic: boolean
  scrobblerCompensateForVideoAge: boolean
  scrobblePrivateContent: boolean

  lastfmSessionKey?: string
  debug: boolean

  youtubeApiKey: string

  connectorConfig: ConnectorConfig
}

export default Config
