import type { PartialSongInfo } from 'interfaces'

import getTextFromSelector from '../util/getTextFromSelector'
import processYtVideoTitle from '../util/processYtVideoTitle'

const videoTitleSelector = '.html5-video-player .ytp-title-link'
const channelNameSelector = '#top-row .ytd-channel-name a'

const getTrackInfoFromTitle = async (/* connector: Connector, */): Promise<
  PartialSongInfo[]
> => {
  const title = getTextFromSelector(videoTitleSelector)
  if (!title) {
    return []
  }

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

  return [baseSongInfo]
}

export default getTrackInfoFromTitle
