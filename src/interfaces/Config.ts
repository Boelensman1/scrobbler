interface Config {
  scrobbler: null | 'lastFm'
  minimumScrobblerQuality: number
  scrobblerQualityDynamic: boolean
  scrobblerCompensateForVideoAge: boolean
  scrobblePrivateContent: boolean

  lastfmSessionKey?: string
  debug: boolean

  youtubeApiKey: string
}

export default Config
