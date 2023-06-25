export interface SavedRegex {
  matchArtist: RegExp
  matchTrack: RegExp
  searchArtist: RegExp
  replaceArtist: string
  searchTrack: RegExp
  replaceTrack: string
  stop: boolean
}

export interface StringifiedSavedRegex
  extends Omit<
    SavedRegex,
    'matchArtist' | 'matchTrack' | 'searchArtist' | 'searchTrack'
  > {
  matchArtist: string
  matchTrack: string
  searchArtist: string
  searchTrack: string
}

export default SavedRegex
