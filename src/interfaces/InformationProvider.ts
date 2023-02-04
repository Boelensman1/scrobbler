import type { Track } from 'internals'

export type InformationProviderInfo = Partial<
  Pick<Track, 'album' | 'albumArtUrl' | 'musicBrainzReleaseGroupId'>
>

export interface InformationProvider {
  fields: (keyof InformationProviderInfo)[]
  getAdditionalInfo(track: Track): Promise<InformationProviderInfo>
}

export default InformationProvider
