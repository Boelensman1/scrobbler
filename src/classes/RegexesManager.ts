import browser from 'webextension-polyfill'
import type {
  SavedRegex,
  SavedRegexes,
  AddSavedRegexValues,
  PartialSongInfo,
} from 'interfaces'

const stringifyRegexes = (savedRegex: SavedRegex) => ({
  ...savedRegex,
  match: savedRegex.match.source,
  search: savedRegex.search.source,
})

const parseSavedRegexes = (savedRegex: AddSavedRegexValues): SavedRegex => ({
  ...savedRegex,
  match: RegExp(savedRegex.match),
  search: RegExp(savedRegex.search),
})

class RegexesManager {
  savedRegexes: SavedRegexes | null = null

  async loadSavedRegexes() {
    let { savedRegexes } = await browser.storage.sync.get()
    if (!savedRegexes) {
      savedRegexes = []
      this.syncSavedRegexes()
    }
    this.savedRegexes = savedRegexes.map(parseSavedRegexes)
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

  applyRegexesToSongInfo(songInfo: PartialSongInfo): PartialSongInfo {
    if (!this.savedRegexes) {
      throw new Error('Saved Regexes are not ready yet')
    }
    const newSongInfo = { ...songInfo }
    for (const regex of this.savedRegexes) {
      // have to do like this, otherwise typescript gets confused
      const value = newSongInfo[regex.type]
      if (typeof value !== 'string') {
        continue
      }
      if (regex.match.test(value)) {
        newSongInfo[regex.type] = value.replace(regex.search, regex.replace)
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
