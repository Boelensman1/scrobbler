import type { PartialSongInfo } from 'interfaces'

/*
  VIVIZ(비비지) -> VIVIZ
  PRIMROSE 프림로즈 -> PRIMROSE
  cignature(시그니처) -> cignature
  드림캐쳐(DREAMCATCHER) -> DREAMCATCHER
*/
// regex replaces matches not latin characters at the start or end of a string
const regex = /^[^\w ]+|[^\w ]+$/g

const addOnlyLatinArtist = (
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
