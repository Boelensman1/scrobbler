interface Config {
  scrobbler: null | 'lastFm'
  minimumScrobblerQuality: number

  lastfmSessionKey?: string
}

export default Config
