interface Config {
  scrobbler: null | 'lastFm'
  minimumScrobblerQuality: number
  scrobblerQualityDynamic: boolean

  lastfmSessionKey?: string
  debug: boolean

  youtubeApiKey: string
}

export default Config
