export interface SavedRegex {
  type: 'track' | 'artist'
  match: RegExp
  search: RegExp
  replace: string
  stop: boolean
}

export interface AddSavedRegexValues
  extends Omit<SavedRegex, 'match' | 'search'> {
  match: string
  search: string
}

type SavedRegexes = SavedRegex[]

export default SavedRegexes
