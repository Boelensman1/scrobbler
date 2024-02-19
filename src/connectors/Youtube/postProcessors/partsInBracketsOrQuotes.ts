import type { PostProcessor, PartialSongInfo } from 'interfaces'
import parse, { ArrayTree } from 'parenthesis'

const getParts = (input: ArrayTree, output: string[] = []): string[] => {
  if (input.length === 1) {
    return input as string[]
  }

  // all non array parts are brackets, so remove them
  const partialOutput = input.filter((inp) => Array.isArray(inp))

  // push this level of output to the result
  output.push(
    ...partialOutput
      .map(
        (o) => parse.stringify(o as ArrayTree),
        ['{}', '[]', '()', `""`, `''`],
      )
      .flat(),
  )

  // recurse
  partialOutput
    .filter((o) => o.length > 1)
    .map((nextPart) => {
      getParts(nextPart as ArrayTree, output)
    })

  return output
}

const getPartsInBracketsOrQuotes = (input: string): string[] => {
  const parsed = parse(input)
  if (parsed.length === 1) {
    // no brackets or no matching brackets
    return []
  }
  // get all parts and remove single letter results
  return getParts(parsed).filter((p) => p.length > 1)
}

/*
  우기 (YUQI) -> YUQI
  (여자)아이들((G)I-DLE) -> ['여자', '(G)I-DLE']
*/
const process: PostProcessor = (
  songInfos: PartialSongInfo[],
): PartialSongInfo[] => {
  const additional: PartialSongInfo[] = []
  songInfos.forEach((songInfo) => {
    if (songInfo.artist) {
      const songInfoArtist = songInfo.artist
      getPartsInBracketsOrQuotes(songInfo.artist).forEach((inBrackets) => {
        additional.push({
          ...songInfo,
          artist: inBrackets.trim(),
        })

        // also add a version where the in brackets part is removed
        const withBracketPartRemoved = songInfoArtist
          .replace('(' + inBrackets + ')', '')
          .trim()
        if (withBracketPartRemoved.length > 3) {
          additional.push({
            ...songInfo,
            artist: withBracketPartRemoved,
          })
        }
      })
    }

    if (songInfo.track) {
      const songInfoTrack = songInfo.track
      getPartsInBracketsOrQuotes(songInfo.track).forEach((inBrackets) => {
        additional.push({
          ...songInfo,
          track: inBrackets.trim(),
        })

        // also add a version where the in brackets part is removed
        const withBracketPartRemoved = songInfoTrack
          .replace('(' + inBrackets + ')', '')
          .trim()
        if (withBracketPartRemoved.length > 3) {
          additional.push({
            ...songInfo,
            track: withBracketPartRemoved,
          })
        }
      })
    }
  })

  return [...songInfos, ...additional]
}

export default process
