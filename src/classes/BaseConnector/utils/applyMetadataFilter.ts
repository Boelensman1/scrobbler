import { Entries } from 'type-fest'

import * as MetadataFilter from 'metadata-filter'
import type { PartialSongInfo, SongInfo } from 'interfaces'

const mvOptions = [' mv', ' m/v', '(mv)', '(m/v)'].map(
  (opt) => new RegExp(opt, 'i'),
)
const removeMv = (text: string): string => {
  for (const mvOption of mvOptions) {
    const temp = text.replace(mvOption, '')
    if (text !== temp) {
      return temp
    }
  }
  return text
}

const removeQuotes = (text: string): string => {
  return text.replace(/^‘(.*)’$/, '$1')
}

const metadataFilter = MetadataFilter.createFilter(
  MetadataFilter.createFilterSetForFields(
    ['artist', 'track', 'album', 'albumArtist'],
    [(text) => text.trim(), MetadataFilter.replaceNbsp],
  ),
)
metadataFilter.append({ track: MetadataFilter.youtube })
metadataFilter.append({ track: removeMv })
metadataFilter.append({ track: removeQuotes })

type InputType = PartialSongInfo | SongInfo

const applyMetadataFilter = <T extends InputType>(songInfo: T): T => {
  return Object.fromEntries(
    (Object.entries(songInfo) as Entries<T>).map(([key, value]) => {
      if (!value) {
        return [key, null]
      }
      return [key, metadataFilter.filterField(key, String(value))]
    }),
  ) as unknown as T
}

export default applyMetadataFilter
