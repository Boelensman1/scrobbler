import type { PartialSongInfo } from 'interfaces'

import getTextFromSelector from '../util/getTextFromSelector'

const videoDescriptionSelector = '#meta-contents #description'

const ytDescFirstLine = 'Provided to YouTube'
const ytDescLastLine = 'Auto-generated by YouTube.'
const ytDescSeparator = ' · '
const ARTIST_SEPARATOR = ', '

const parseYtVideoDescription = (desc: string | null) => {
  // check if valid
  if (
    !(
      desc &&
      (desc.startsWith(ytDescFirstLine) || desc.endsWith(ytDescLastLine))
    )
  ) {
    return []
  }

  const lines = desc
    .split('\n')
    .filter((line: string) => {
      return line.length > 0
    })
    .filter((line: string) => {
      return !line.startsWith(ytDescFirstLine)
    })

  const firstLine = lines[0]
  const secondLine = lines[1]

  const trackInfo = firstLine.split(ytDescSeparator)
  const numberOfFields = trackInfo.length

  const album = secondLine
  let artist: string | null = null
  let track: string | null = null
  let featArtists = null

  if (numberOfFields < 2) {
    ;[track] = trackInfo
  } else if (numberOfFields === 2) {
    ;[track, artist] = trackInfo
  } else {
    ;[track, artist, ...featArtists] = trackInfo

    const areFeatArtistPresent = featArtists.some(
      (artist) => track && track.includes(artist),
    )

    if (!areFeatArtistPresent) {
      const featArtistsStr = featArtists.join(ARTIST_SEPARATOR)
      track = `${track} (feat. ${featArtistsStr})`
    }
  }

  return [{ artist, track, album }]
}

const getTrackInfoFromDescription = async (/* connector: Connector */): Promise<
  PartialSongInfo[]
> => {
  const description = getTextFromSelector(videoDescriptionSelector)
  return parseYtVideoDescription(description)
}

export default getTrackInfoFromDescription
