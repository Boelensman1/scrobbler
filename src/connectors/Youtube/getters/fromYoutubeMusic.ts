import type { Connector, PartialSongInfo } from 'interfaces'
import type YoutubeConnector from '..'
import sanitizeTitle from '../util/sanitizeTitle'

const getTrackInfoFromYoutubeMusic = async (
  connector: Connector,
): Promise<PartialSongInfo[]> => {
  const videoId = (connector as YoutubeConnector).getVideoId()

  const body = JSON.stringify({
    context: {
      client: {
        // parameters are needed, you get a 400 if you omit these
        // specific values are just what I got when doing a request
        // using firefox
        clientName: 'WEB_REMIX',
        clientVersion: '1.20221212.01.00',
      },
    },
    captionParams: {},
    videoId,
  })

  const videoInfo = await fetch(
    'https://music.youtube.com/youtubei/v1/player',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    },
  ).then((response) => response.json())

  return [
    {
      artist: videoInfo.videoDetails.author.trim(),
      track: videoInfo.videoDetails.title.trim(),
    },
    {
      artist: videoInfo.videoDetails.author.trim(),
      track: sanitizeTitle(videoInfo.videoDetails.title.trim()),
    },
  ]
}

export default getTrackInfoFromYoutubeMusic
