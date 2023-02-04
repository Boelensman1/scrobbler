import type { ScrobblerLinks } from 'interfaces'

export class Track {
  connectorId: string
  name: string
  artist: string
  scrobblerMatchQuality: number
  scrobblerLinks: ScrobblerLinks

  album?: string
  duration?: number
  albumArtUrl?: string
  musicBrainzReleaseGroupId?: string

  constructor({
    connectorId,
    name,
    artist,
    album,
    duration,
    scrobblerMatchQuality,
    scrobblerLinks,
    albumArtUrl,
    musicBrainzReleaseGroupId,
  }: {
    connectorId: string
    name: string
    artist: string
    album?: string
    duration?: number
    scrobblerMatchQuality: number
    albumArtUrl?: string
    musicBrainzReleaseGroupId?: string
    scrobblerLinks: ScrobblerLinks
  }) {
    this.connectorId = connectorId
    this.name = name
    this.artist = artist
    this.album = album
    this.duration = duration
    this.scrobblerMatchQuality = scrobblerMatchQuality
    this.scrobblerLinks = scrobblerLinks

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
      'duration',
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
}

export default Track
