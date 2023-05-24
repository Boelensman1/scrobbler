import type { BG_ACTION_KEYS } from 'internals'
import type {
  AddSavedRegexValues,
  Config,
  SongInfo,
  SavedEdit,
  TrackSelector,
} from 'interfaces'

export interface RequestAuthenticationActionObject {
  type: typeof BG_ACTION_KEYS.REQUEST_AUTHENTICATION
}

export interface GetStateActionObject {
  type: typeof BG_ACTION_KEYS.GET_STATE
}

export interface GetConfigActionObject {
  type: typeof BG_ACTION_KEYS.GET_CONFIG
}

export interface ResetConfigActionObject {
  type: typeof BG_ACTION_KEYS.RESET_CONFIG
}

export interface SaveConfigActionObject {
  type: typeof BG_ACTION_KEYS.SAVE_CONFIG
  data: Partial<Config>
}

export interface SetLoadingNewTrackActionObject {
  type: typeof BG_ACTION_KEYS.SET_LOADING_NEW_TRACK
}

export interface RequestBecomeActiveTabActionObject {
  type: typeof BG_ACTION_KEYS.REQUEST_BECOME_ACTIVE_TAB
  data: { force: boolean }
}

export interface GetIsActiveTabActionObject {
  type: typeof BG_ACTION_KEYS.GET_IS_ACTIVE_TAB
}

export interface SaveTrackEditBGActionObject {
  type: typeof BG_ACTION_KEYS.SAVE_TRACK_EDIT
  data: SavedEdit
}

export interface GetTrackFromEdittedTracksActionObject {
  type: typeof BG_ACTION_KEYS.GET_TRACK_FROM_EDITTED_TRACKS
  data: TrackSelector
}

export interface GetEdittedTracksActionObject {
  type: typeof BG_ACTION_KEYS.GET_EDITTED_TRACKS
}

export interface GetSavedRegexes {
  type: typeof BG_ACTION_KEYS.GET_SAVED_REGEXES
}

export interface ResetSavedRegexes {
  type: typeof BG_ACTION_KEYS.RESET_SAVED_REGEXES
}

export interface AddSavedRegex {
  type: typeof BG_ACTION_KEYS.ADD_SAVED_REGEX
  data: { regex: AddSavedRegexValues }
}

export interface UpdateSavedRegex {
  type: typeof BG_ACTION_KEYS.UPDATE_SAVED_REGEX
  data: { index: number; regex: AddSavedRegexValues }
}

export interface ApplyRegexesToSongInfo {
  type: typeof BG_ACTION_KEYS.APPLY_REGEXES_TO_SONGINFO
  data: SongInfo
}

export type BgActionObject =
  | RequestAuthenticationActionObject
  | GetStateActionObject
  | GetConfigActionObject
  | ResetConfigActionObject
  | SaveConfigActionObject
  | SetLoadingNewTrackActionObject
  | RequestBecomeActiveTabActionObject
  | GetIsActiveTabActionObject
  | SaveTrackEditBGActionObject
  | GetTrackFromEdittedTracksActionObject
  | GetEdittedTracksActionObject
  | GetSavedRegexes
  | ResetSavedRegexes
  | AddSavedRegex
  | ApplyRegexesToSongInfo
  | UpdateSavedRegex
