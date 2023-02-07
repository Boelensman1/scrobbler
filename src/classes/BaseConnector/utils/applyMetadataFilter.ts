import { Entries } from 'type-fest'

import * as MetadataFilter from 'metadata-filter'
import type { PartialSongInfo } from 'interfaces'

const metadataFilter = MetadataFilter.createFilter(
  MetadataFilter.createFilterSetForFields(
    ['artist', 'track', 'album', 'albumArtist'],
    [(text) => text.trim(), MetadataFilter.replaceNbsp],
  ),
)
metadataFilter.append({ track: MetadataFilter.youtube })

const applyMetadataFilter = (songInfo: PartialSongInfo): PartialSongInfo => {
  ;(Object.entries(songInfo) as Entries<typeof songInfo>).map(
    ([key, value]) => {
      if (!value) {
        return
      }
      songInfo[key] = metadataFilter.filterField(key, value) || value
    },
  )
  return songInfo
}

export default applyMetadataFilter
