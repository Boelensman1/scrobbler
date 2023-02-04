import type { InformationProvider, InformationProviderInfo } from 'interfaces'
import type { Track } from 'internals'

class CoverArtInformationProvider implements InformationProvider {
  fields: (keyof InformationProviderInfo)[] = ['albumArtUrl']

  async checkCoverArtExists(url: string): Promise<boolean> {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  }

  async getAdditionalInfo(track: Track): Promise<InformationProviderInfo> {
    if (!track.musicBrainzReleaseGroupId) {
      return {}
    }

    const albumArtUrl = `http://coverartarchive.org/release-group/${track.musicBrainzReleaseGroupId}/front-500`
    if (await this.checkCoverArtExists(albumArtUrl)) {
      return { albumArtUrl }
    }
    return {}
  }
}

export default CoverArtInformationProvider
