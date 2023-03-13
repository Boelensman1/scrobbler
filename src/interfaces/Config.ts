interface Config {
  scrobbler: null | 'lastFm'
  minimumScrobblerQuality: number
  scrobblerQualityDynamic: boolean

  lastfmSessionKey?: string
  debug: boolean
}

export default Config
