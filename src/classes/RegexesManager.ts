import type {
  SavedRegex,
  StringifiedSavedRegex,
  SongInfo,
  JSONAble,
} from 'interfaces'
import { BrowserStorage } from 'internals'

const stringifyRegexes = (savedRegex: SavedRegex) => ({
  ...savedRegex,
  matchArtist: savedRegex.matchArtist.source,
  matchTrack: savedRegex.matchTrack.source,
  searchArtist: savedRegex.searchArtist.source,
  searchTrack: savedRegex.searchTrack.source,
})

const parseSavedRegexes = (savedRegex: StringifiedSavedRegex): SavedRegex => ({
  ...savedRegex,
  matchArtist: RegExp(savedRegex.matchArtist),
  matchTrack: RegExp(savedRegex.matchTrack),
  searchArtist: RegExp(savedRegex.searchArtist),
  searchTrack: RegExp(savedRegex.searchTrack),
})

export const hydrate = (savedRegexes: JSONAble) =>
  (savedRegexes as unknown as StringifiedSavedRegex[]).map(parseSavedRegexes)

export const deHydrate = (savedRegexes: SavedRegex[]) =>
  savedRegexes.map(stringifyRegexes)

class RegexesManager {
  browserStorage: BrowserStorage
  savedRegexes: SavedRegex[]

  constructor(browserStorage: BrowserStorage) {
    this.browserStorage = browserStorage

    this.savedRegexes = browserStorage.get('savedRegexes')
  }

  async resetSavedRegexes() {
    this.savedRegexes = []
    this.syncSavedRegexes()
  }

  async syncSavedRegexes() {
    await this.browserStorage.set('savedRegexes', this.savedRegexes)
  }

  addRegex(regex: StringifiedSavedRegex): void {
    this.savedRegexes.push(parseSavedRegexes(regex))
    this.syncSavedRegexes()
  }

  updateRegex(index: number, regex: StringifiedSavedRegex): void {
    if (!this.savedRegexes[index]) {
      throw new Error(`Saved regex ${index} not found`)
    }

    this.savedRegexes[index] = parseSavedRegexes(regex)
    this.syncSavedRegexes()
  }

  removeRegex(index: number): void {
    if (this.savedRegexes[index]) {
      this.savedRegexes.splice(index, 1)
      this.syncSavedRegexes()
    }
  }

  reOrderRegexes(ordering: number[]): void {
    this.savedRegexes = ordering.map((oldIndex) => {
      if (!this.savedRegexes[oldIndex]) {
        throw new Error('Index out of range, cannot re-order')
      }
      return this.savedRegexes[oldIndex]
    })
  }

  applyRegexesToSongInfo(songInfo: SongInfo): SongInfo {
    if (!this.savedRegexes) {
      throw new Error('Saved Regexes are not ready yet')
    }
    const newSongInfo = { ...songInfo }
    for (const regex of this.savedRegexes) {
      // have to do like this, otherwise typescript gets confused
      if (
        regex.matchArtist.test(songInfo.artist) &&
        regex.matchTrack.test(songInfo.track)
      ) {
        newSongInfo.artist = songInfo.artist.replace(
          regex.searchArtist,
          regex.replaceArtist,
        )
        newSongInfo.track = songInfo.track.replace(
          regex.searchTrack,
          regex.replaceTrack,
        )
        if (regex.stop) {
          break
        }
      }
    }
    return newSongInfo
  }

  getSavedRegexes(): StringifiedSavedRegex[] {
    if (!this.savedRegexes) {
      throw new Error('Saved Regexes are not ready yet')
    }
    return this.savedRegexes.map(stringifyRegexes)
  }
}

export default RegexesManager
