import _ from 'lodash'
import type { PartialSongInfo, SongInfo } from 'interfaces'

const combineSongInfos = (
  songInfos: (PartialSongInfo | null)[],
): SongInfo[] => {
  const nonNullSongInfos = songInfos.filter(
    (songInfo) => !!songInfo,
  ) as PartialSongInfo[]

  const tracks = _.uniq(
    nonNullSongInfos.map(({ track }) => track).filter((t) => !!t),
  ) as string[]
  const artists = _.uniq(
    nonNullSongInfos.map(({ artist }) => artist).filter((a) => !!a),
  ) as string[]

  return tracks.flatMap((track) =>
    artists.map((artist) => ({
      track,
      artist,
    })),
  )
}

export default combineSongInfos
