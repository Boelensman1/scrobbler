import type { InformationProvider, InformationProviderInfo } from 'interfaces'
import type { Track } from 'internals'

class MusicBrainzInformationProvider implements InformationProvider {
  fields: (keyof InformationProviderInfo)[] = [
    'musicBrainzReleaseGroupId',
    'album',
  ]

  async lookupReleaseGroup(track: Track) {
    const url = `https://musicbrainz.org/ws/2/recording?fmt=json&query=recording:"${track.name}" AND artist:"${track.artist}"`
    const response = await fetch(url)
    if (!response.ok) {
      return false
    }
    const result = await response.json()

    if (result.count === 0) {
      return false
    }

    return result.recordings[0].releases[0]['release-group']
  }

  async getAdditionalInfo(track: Track): Promise<InformationProviderInfo> {
    const releaseGroup = await this.lookupReleaseGroup(track)

    if (!releaseGroup) {
      return {}
    }

    return {
      musicBrainzReleaseGroupId: releaseGroup.id,
      album: releaseGroup.title,
    }
  }
}

export default MusicBrainzInformationProvider
