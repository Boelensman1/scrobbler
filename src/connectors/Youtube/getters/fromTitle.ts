import type { Connector, PartialSongInfo } from 'interfaces'

import getTextFromSelector from '../util/getTextFromSelector'
import processYtVideoTitle from '../util/processYtVideoTitle'

const videoTitleSelector = '.html5-video-player .ytp-title-link'
const channelNameSelector = '#top-row .ytd-channel-name a'

const getTrackInfoFromTitle = async (
  _connector: Connector,
): Promise<PartialSongInfo[]> => {
  const title = getTextFromSelector(videoTitleSelector)
  if (!title) {
    return []
  }

  const additionalSongInfos = []
  const baseSongInfo = processYtVideoTitle(title)
  if (baseSongInfo && !baseSongInfo.artist) {
    baseSongInfo.artist = getTextFromSelector(channelNameSelector)
  }

  if (!baseSongInfo) {
    return []
  }

  if (baseSongInfo.artist) {
    baseSongInfo.artist = baseSongInfo.artist.trim()
  }

  if (baseSongInfo.track) {
    baseSongInfo.track = baseSongInfo.track.trim()

    // within brackets is usually extra info, for example version info, lets try removing it, this does cause some information to be lost, eg if this is the japanese version of a song
    const regex = /\([^)]*\)/g
    if (baseSongInfo.track.match(regex)) {
      additionalSongInfos.push({
        ...baseSongInfo,
        track: baseSongInfo.track.replace(regex, '').trim(),
      })
    }
  }

  return [baseSongInfo, ...additionalSongInfos]
}

export default getTrackInfoFromTitle
