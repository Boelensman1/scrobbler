import { Entries } from 'type-fest'

import * as MetadataFilter from 'metadata-filter'
import type { PartialSongInfo } from 'interfaces'

const mv = ['mv', 'm/v', '(mv)', '(m/v)']
const removeMv = (text: string): string => {
  if (mv.includes(text.toLowerCase())) {
    return ''
  }
  return text
}

const metadataFilter = MetadataFilter.createFilter(
  MetadataFilter.createFilterSetForFields(
    ['artist', 'track', 'album', 'albumArtist'],
    [(text) => text.trim(), MetadataFilter.replaceNbsp],
  ),
)
metadataFilter.append({ track: MetadataFilter.youtube })
metadataFilter.append({ track: removeMv })

const applyMetadataFilter = (songInfo: PartialSongInfo): PartialSongInfo => {
  return Object.fromEntries(
    (Object.entries(songInfo) as Entries<typeof songInfo>).map(
      ([key, value]) => {
        if (!value) {
          return [key, null]
        }
        return [key, metadataFilter.filterField(key, String(value))]
      },
    ),
  ) as unknown as PartialSongInfo
}

export default applyMetadataFilter
