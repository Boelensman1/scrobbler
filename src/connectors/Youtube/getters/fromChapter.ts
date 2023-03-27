import type { PartialSongInfo } from 'interfaces'

import getTextFromSelector from '../util/getTextFromSelector'

const chapterNameSelector = '.html5-video-player .ytp-chapter-title-content'

const areChaptersAvailable = () => {
  // SponsorBlock extension hijacks chapter element. Ignore it.
  if (
    document.querySelector(
      '.ytp-chapter-title-content.sponsorBlock-segment-title',
    )
  ) {
    return false
  }

  const text = getTextFromSelector(chapterNameSelector)
  return !!text
}

const getTrackInfoFromChapter = async (/* connector: Connector */): Promise<
  PartialSongInfo[]
> => {
  // Short circuit if chapters not available - necessary to avoid misscrobbling with SponsorBlock.
  if (!areChaptersAvailable()) {
    return []
  }

  const chapterName = getTextFromSelector(chapterNameSelector)
  return [{ track: chapterName }]
}

export default getTrackInfoFromChapter
