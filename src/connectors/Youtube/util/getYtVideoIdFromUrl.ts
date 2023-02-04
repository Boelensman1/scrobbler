/**
 * Regular expression used to get Youtube video ID from URL. It covers
 * default, shortened and embed URLs.
 */
const ytVideoIdRegExp =
  /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?.*v=))([^#&?]*).*/

const getYtVideoIdFromUrl = (videoUrl: string): string | null => {
  if (!videoUrl) {
    return null
  }

  const match = videoUrl.match(ytVideoIdRegExp)
  if (match) {
    return match[7]
  }

  return null
}

export default getYtVideoIdFromUrl
