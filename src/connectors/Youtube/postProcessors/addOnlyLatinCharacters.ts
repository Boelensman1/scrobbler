import type { PartialSongInfo, PostProcessor } from 'interfaces'

/*
  PRIMROSE 프림로즈 -> PRIMROSE
*/
// regex replaces matches non latin characters at the start or end of a string
const regex = /^[^\w ()]+|[^\w ()]+$/g

const addOnlyLatinArtist: PostProcessor = (
  songInfos: PartialSongInfo[],
): PartialSongInfo[] => {
  const additonal: PartialSongInfo[] = []
  songInfos.forEach((songInfo) => {
    if (songInfo.artist) {
      if (songInfo.artist.match(regex)) {
        additonal.push({
          ...songInfo,
          artist: songInfo.artist.replace(regex, '').trim(),
        })
      }
    }

    if (songInfo.track) {
      if (songInfo.track.match(regex)) {
        additonal.push({
          ...songInfo,
          track: songInfo.track.replace(regex, '').trim(),
        })
      }
    }
  })

  return [...songInfos, ...additonal]
}

export default addOnlyLatinArtist
