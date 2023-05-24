import browser from 'webextension-polyfill'
import type { SavedRegex, AddSavedRegexValues, SongInfo } from 'interfaces'

const stringifyRegexes = (savedRegex: SavedRegex) => ({
  ...savedRegex,
  matchArtist: savedRegex.matchArtist.source,
  matchTrack: savedRegex.matchTrack.source,
  searchArtist: savedRegex.searchArtist.source,
  searchTrack: savedRegex.searchTrack.source,
})

const parseSavedRegexes = (savedRegex: AddSavedRegexValues): SavedRegex => ({
  ...savedRegex,
  matchArtist: RegExp(savedRegex.matchArtist),
  matchTrack: RegExp(savedRegex.matchTrack),
  searchArtist: RegExp(savedRegex.searchArtist),
  searchTrack: RegExp(savedRegex.searchTrack),
})

class RegexesManager {
  savedRegexes: SavedRegex[] | null = null

  async loadSavedRegexes() {
    const { savedRegexes } = await browser.storage.sync.get()
    if (!savedRegexes) {
      this.savedRegexes = []
      this.syncSavedRegexes()
    } else {
      this.savedRegexes = savedRegexes.map(parseSavedRegexes)
    }
  }

  async resetSavedRegexes() {
    this.savedRegexes = []
    this.syncSavedRegexes()
  }

  async syncSavedRegexes() {
    if (!this.savedRegexes) {
      throw new Error('Saved Regexes are not ready yet')
    }

    await browser.storage.sync.set({
      savedRegexes: this.savedRegexes.map(stringifyRegexes),
    })
  }

  addRegex(regex: AddSavedRegexValues): void {
    if (!this.savedRegexes) {
      throw new Error('Saved Regexes are not ready yet')
    }

    this.savedRegexes.push(parseSavedRegexes(regex))
    this.syncSavedRegexes()
  }

  updateRegex(index: number, regex: AddSavedRegexValues): void {
    if (!this.savedRegexes) {
      throw new Error('Saved Regexes are not ready yet')
    }

    if (!this.savedRegexes[index]) {
      throw new Error(`Saved regex ${index} not found`)
    }

    this.savedRegexes[index] = parseSavedRegexes(regex)
    this.syncSavedRegexes()
  }

  removeRegex(index: number): void {
    if (!this.savedRegexes) {
      throw new Error('Saved Regexes are not ready yet')
    }

    if (this.savedRegexes[index]) {
      this.savedRegexes.splice(index, 1)
      this.syncSavedRegexes()
    }
  }

  reOrderRegexes(ordering: number[]): void {
    this.savedRegexes = ordering.map((oldIndex) => {
      if (!this.savedRegexes) {
        throw new Error('Saved Regexes are not ready yet')
      }
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

  getSavedRegexes(): AddSavedRegexValues[] {
    if (!this.savedRegexes) {
      throw new Error('Saved Regexes are not ready yet')
    }
    return this.savedRegexes.map(stringifyRegexes)
  }
}

export default RegexesManager
