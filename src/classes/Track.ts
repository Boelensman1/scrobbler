import type { ScrobblerLinks, SongInfo } from 'interfaces'

export class Track {
  name: string
  artist: string
  scrobblerMatchQuality: number
  scrobblerLinks: ScrobblerLinks

  album?: string
  albumArtUrl?: string
  musicBrainzReleaseGroupId?: string
  fromCache = false

  constructor({
    name,
    artist,
    album,
    scrobblerMatchQuality,
    scrobblerLinks,
    albumArtUrl,
    musicBrainzReleaseGroupId,
    fromCache,
  }: {
    name: string
    artist: string
    album?: string
    scrobblerMatchQuality: number
    albumArtUrl?: string
    musicBrainzReleaseGroupId?: string
    scrobblerLinks: ScrobblerLinks
    fromCache?: boolean
  }) {
    this.name = name
    this.artist = artist
    this.album = album
    this.scrobblerMatchQuality = scrobblerMatchQuality
    this.scrobblerLinks = scrobblerLinks
    this.fromCache = Boolean(fromCache)

    if (albumArtUrl) {
      this.albumArtUrl = albumArtUrl
    }
    if (musicBrainzReleaseGroupId) {
      this.musicBrainzReleaseGroupId = musicBrainzReleaseGroupId
    }
  }

  getMissingFields(): string[] {
    const possibleMissingFields: (keyof Track)[] = [
      'album',
      'albumArtUrl',
      'musicBrainzReleaseGroupId',
    ]
    return possibleMissingFields.filter((field) => !this[field])
  }

  toLastFmTrack() {
    return {
      track: this.name,
      artist: this.artist,
    }
  }

  toSongInfo(): SongInfo {
    return {
      track: this.name,
      artist: this.artist,
      album: this.album,
      matchQuality: this.scrobblerMatchQuality,
    }
  }

  getAllPropsForCache() {
    return {
      name: this.name,
      artist: this.artist,
      scrobblerMatchQuality: this.scrobblerMatchQuality,
      scrobblerLinks: this.scrobblerLinks,
      album: this.album,
      albumArtUrl: this.albumArtUrl,
      musicBrainzReleaseGroupId: this.musicBrainzReleaseGroupId,
      fromCache: true,
    }
  }
}

export default Track
