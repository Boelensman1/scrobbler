import type { PartialSongInfo } from 'interfaces'
import sanitizeTitle from './sanitizeTitle'

const defaultSeperators = [
  ' -- ',
  '--',
  ' ~ ',
  ' \u002d ',
  ' \u2013 ',
  ' \u2014 ',
  ' // ',
  '\u002d',
  '\u2013',
  '\u2014',
  ':',
  '|',
  '///',
  '/',
  '~',
]

const ytTitleRegExps = [
  // Artist "Track", Artist: "Track", Artist - "Track", etc.
  {
    pattern: /(.+?)([\s:—-])+\s*"(.+?)"/,
    groups: { artist: 1, track: 3 },
  },
  // Artist「Track」 (Japanese tracks)
  {
    pattern: /(.+?)[『｢「](.+?)[」｣』]/,
    groups: { artist: 1, track: 2 },
  },
  // Track (... by Artist)
  {
    pattern: /(\w[\s\w]*?)\s+\([^)]*\s*by\s*([^)]+)+\)/,
    groups: { artist: 2, track: 1 },
  },
]

const isArtistTrackEmpty = (artistTrack: {
  artist: any
  track: any
}): boolean => {
  return !(artistTrack && artistTrack.artist && artistTrack.track)
}

const findSeparator = (str: string, separators: string[] | null = null) => {
  if (str === null || str.length === 0) {
    return null
  }

  for (const sep of separators || defaultSeperators) {
    const index = str.indexOf(sep)
    if (index > -1) {
      return { index, length: sep.length }
    }
  }

  return null
}

const splitString = (
  str: string,
  separators: string[] | null,
  { swap = false } = {},
): (string | null)[] => {
  let first = null
  let second = null

  if (str) {
    const separator = findSeparator(str, separators)

    if (separator !== null) {
      first = str.substring(0, separator.index)
      second = str.substring(separator.index + separator.length)

      if (swap) {
        ;[second, first] = [first, second]
      }
    }
  }

  return [first, second]
}

const splitArtistTrack = (
  str: string,
  separators: string[] | null = null,
  { swap = false } = {},
) => {
  const [artist, track] = splitString(str, separators, { swap })
  return { artist, track }
}

const processYtVideoTitle = (videoTitle: string): PartialSongInfo | null => {
  let artist = null
  let track = null

  if (!videoTitle) {
    return null
  }

  const title = sanitizeTitle(videoTitle)

  // Try to match one of the regexps
  for (const regExp of ytTitleRegExps) {
    const artistTrack = title.match(regExp.pattern)
    if (artistTrack) {
      artist = artistTrack[regExp.groups.artist]
      track = artistTrack[regExp.groups.track]
      break
    }
  }

  // No match? Try splitting, then.
  if (isArtistTrackEmpty({ artist, track })) {
    ;({ artist, track } = splitArtistTrack(title))
  }

  // No match? Check for 【】
  if (isArtistTrackEmpty({ artist, track })) {
    const artistTrack = title.match(/(.+?)【(.+?)】/)
    if (artistTrack) {
      artist = artistTrack[1]
      track = artistTrack[2]
    }
  }

  if (isArtistTrackEmpty({ artist, track })) {
    track = title
  }

  return { artist, track }
}

export default processYtVideoTitle
