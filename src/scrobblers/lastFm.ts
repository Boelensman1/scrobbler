import md5 from 'md5'

import type { SongInfo } from 'interfaces'
import { Track } from 'internals'

const defaultOptions = {
  url: '/2.0',
  host: 'https://ws.audioscrobbler.com',
  format: 'json',
  userAgent: 'web-scrobbler-ext',
  authUrl: 'https://www.last.fm/api/auth/',
  apiKey: '57b2487b405da6fdc3114374b16aff02',
  apiSecret: 'b2662923d62554742133772e3401fbb3',
}

interface Options {
  url?: string
  host?: string
  format?: string
  userAgent?: string
  authUrl?: string
  apiKey?: string
  apiSecret?: string
}

interface Params {
  [key: string]: any
}

export interface GetTrackResult {
  mbid?: string
  name: string
  url: string
  // @ts-ignore
  streamable: { #text: string; fulltrack: string }
  listeners: string
  playcount: string
  artist: { name: string; url: string; mbid?: string }
  album?: {
    mbid?: string
    artist: string
    title: string
    url: string
    image: {
      // @ts-ignore
      #text: string
      size: string
    }[]
  }
  toptags: { name: string; url: string }[]
}

const generateSign = (params: Params, secret: string) => {
  const keys = Object.keys(params).sort()
  let o = ''

  for (const key of keys) {
    if (['format', 'callback'].includes(key)) {
      continue
    }

    o += key + params[key]
  }
  return md5(o + secret)
}

class LastFm {
  url: string
  host: string
  format: string
  userAgent: string
  authUrl: string
  apiKey: string
  apiSecret: string

  scrobbleQueue: { track: Track; startedPlaying: Date }[] = []

  sessionKey?: string | null

  constructor(options: Options = {}) {
    const extOptions = { ...defaultOptions, ...options }
    this.url = extOptions.url
    this.host = extOptions.host
    this.format = extOptions.format
    this.userAgent = extOptions.userAgent
    this.authUrl = extOptions.authUrl
    this.apiKey = extOptions.apiKey
    this.apiSecret = extOptions.apiSecret

    // retry any failed scrobbles every 30 seconds
    setInterval(this.processScrobbleQueue.bind(this), 30 * 1000)
  }

  async getAuthUrl(redirectUrl: string) {
    const url = `${this.authUrl}?api_key=${this.apiKey}&cb=${redirectUrl}`
    return url
  }

  get isAuthenticated(): boolean {
    return !!this.sessionKey
  }

  async getNewSessionKey(token: string): Promise<string> {
    const result = await this.doRequest(
      'auth.getSession',
      {
        token,
      },
      {
        sign: true,
      },
    )
    return result.session.key
  }

  async getSessionKey(token: string) {
    if (!this.isAuthenticated) {
      this.sessionKey = await this.getNewSessionKey(token)
    }
    return this.sessionKey
  }

  setSessionKey(sessionKey: string | null) {
    this.sessionKey = sessionKey
  }

  async doRequest(
    method: string,
    params: Params = {},
    { sign, withSessionKey, ...options }: any = {},
  ) {
    const searchparams = {
      api_key: this.apiKey,
      format: 'json',
      method,
      sk: this.sessionKey!,
      ...params,
    }

    if (!withSessionKey) {
      // @ts-ignore
      delete searchparams.sk
    }
    if (sign) {
      // @ts-ignore
      searchparams.api_sig = generateSign(searchparams, this.apiSecret)
    }

    const url = this.host + this.url + '?' + new URLSearchParams(searchparams)
    return fetch(url, options).then((response) => response.json())
  }

  async searchTrack(input: { track: string; artist?: string }) {
    return this.doRequest('track.search', input)
  }

  async getTrack(songInfo: SongInfo): Promise<Track | null> {
    const result = await this.doRequest('track.getInfo', songInfo)

    if (result.error) {
      return null
    }

    const track = result.track as GetTrackResult

    let albumArtUrl
    if (track.album?.image && track.album?.image.length > 0) {
      // just pick a random one, we display it quite small anyway
      // @ts-ignore
      albumArtUrl = Object.values(track.album.image).pop()!['#text']
    }

    const scrobblerLinks = {
      track: track.url,
      album: track.album?.url,
      artist: track.artist.url,
    }

    return new Track({
      name: track.name,
      artist: track.artist.name,
      album: track.album?.title,
      // we use # of listeners as the match quality
      scrobblerMatchQuality: Number(track.listeners),
      albumArtUrl,
      musicBrainzReleaseGroupId: track.artist.mbid,
      scrobblerLinks: scrobblerLinks,
    })
  }

  async setNowPlaying(track: Track) {
    return this.doRequest('track.updateNowPlaying', track.toLastFmTrack(), {
      sign: true,
      withSessionKey: true,
      method: 'POST',
    })
  }

  async scrobble(track: Track, startedPlaying: Date) {
    this.scrobbleQueue.push({ track, startedPlaying })

    await this.processScrobbleQueue()
  }

  async processScrobbleQueue() {
    const entry = this.scrobbleQueue.shift()
    if (!entry) {
      // queue is empty!
      return
    }

    try {
      const { track, startedPlaying } = entry
      const result = await this.doRequest(
        'track.scrobble',
        {
          ...track.toLastFmTrack(),
          timestamp: Math.floor(startedPlaying.getTime() / 1000),
        },
        {
          sign: true,
          withSessionKey: true,
          method: 'POST',
        },
      )
      if (!result.scrobbles.scrobble) {
        throw new Error(result.error)
      }
    } catch (err) {
      // re-add to queue
      this.scrobbleQueue.push(entry)
      console.error(err)
      return
    }

    // no error, so process next entry
    this.processScrobbleQueue()
  }
}

export default LastFm
