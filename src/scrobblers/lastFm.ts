import md5 from 'md5'

import type { SongInfo } from 'interfaces'
import { Artist, Track, Logger } from 'internals'

const logger = new Logger('lastFm scrobbler')

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
  [key: string]: any // eslint-disable-line
}

interface Tag {
  name: string
  url: string
}

interface Image {
  // @ts-expect-error this is just how last.fm returns it, can't help it
  #text: string
  size: string
}

export interface GetTrackResult {
  mbid?: string
  name: string
  url: string
  // @ts-expect-error this is just how last.fm returns it, can't help it
  streamable: { #text: string; fulltrack: string }
  listeners: string
  playcount: string
  artist: { name: string; url: string; mbid?: string }
  album?: {
    mbid?: string
    artist: string
    title: string
    url: string
    image: Image[]
  }
  toptags: Tag[]
}

interface GetArtistResult {
  name: string
  url: string
  image: Image[]
  streamable: string
  ontour: string
  stats: {
    listeners: string
    playcount: string
  }
  similar: {
    artist: {
      name: string
      url: string
      image: Image[]
    }[]
  }
  tags: { tag: Tag }[]
  bio: {
    links: {
      link: {
        // @ts-expect-error this is just how last.fm returns it, can't help it
        #text: string
        rel: string
        href: string
      }
    }[]
    published: string
    summary: string
    content: string
  }
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
    { sign, withSessionKey, ...options }: any = {}, // eslint-disable-line
  ) {
    const searchparams: Params = {
      api_key: this.apiKey,
      format: 'json',
      method,
      sk: this.sessionKey,
      ...params,
    }

    if (!withSessionKey) {
      delete searchparams.sk
    }
    if (sign) {
      searchparams.api_sig = generateSign(searchparams, this.apiSecret)
    }

    const url = this.host + this.url + '?' + new URLSearchParams(searchparams)
    return fetch(url, options).then((response) => response.json())
  }

  async searchTrack(input: { track: string; artist?: string }) {
    return this.doRequest('track.search', input)
  }

  async getArtist(artistName: string): Promise<Artist | null> {
    const result = await this.doRequest('artist.getInfo', {
      artist: artistName,
    })
    if (result.error) {
      logger.error(
        new Error(
          `Error while getting last.fm artist for "${artistName}": ${result.error}`,
        ),
      )
      return null
    }

    const artist = result.artist as GetArtistResult
    return new Artist({
      name: artist.name,
      listeners: Number(artist.stats.listeners),
      plays: Number(artist.stats.playcount),
    })
  }

  async getTrack(songInfo: SongInfo): Promise<Track | null> {
    logger.debug(`Getting songInfo for "${songInfo.track}"`)
    const result = await this.doRequest('track.getInfo', songInfo)

    if (result.error) {
      logger.error(
        new Error(
          `Error while getting songInfo for "${songInfo.track}": ${result.error}`,
        ),
      )
      return null
    }

    const track = result.track as GetTrackResult

    let albumArtUrl
    if (track.album?.image && track.album?.image.length > 0) {
      // just pick a random one, we display it quite small anyway
      const albumArt = Object.values(track.album.image).pop()

      if (albumArt) {
        // @ts-expect-error this is just how last.fm returns it, can't help it
        albumArtUrl = albumArt['#text']
      }
    }

    const scrobblerLinks = {
      track: track.url,
      album: track.album?.url,
      artist: track.artist.url,
    }

    logger.debug(
      `Finished getting songInfo for "${songInfo.track}", result: ${track.name}`,
    )
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
      logger.error(err as Error)
      return
    }

    // no error, so process next entry
    await this.processScrobbleQueue()
  }
}

export default LastFm
