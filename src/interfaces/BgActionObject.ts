import type { BG_ACTION_KEYS } from 'internals'
import type {
  StringifiedSavedRegex,
  Config,
  SongInfo,
  SavedEdit,
  TrackSelector,
  ConnectorKey,
  ConnectorTrackId,
  LogEntryPayload,
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

export interface GetSavedRegexesActionObject {
  type: typeof BG_ACTION_KEYS.GET_SAVED_REGEXES
}

export interface ResetSavedRegexesActionObject {
  type: typeof BG_ACTION_KEYS.RESET_SAVED_REGEXES
}

export interface AddSavedRegexActionObject {
  type: typeof BG_ACTION_KEYS.ADD_SAVED_REGEX
  data: { regex: StringifiedSavedRegex }
}

export interface UpdateSavedRegexActionObject {
  type: typeof BG_ACTION_KEYS.UPDATE_SAVED_REGEX
  data: { index: number; regex: StringifiedSavedRegex }
}

export interface ApplyRegexesToSongInfoActionObject {
  type: typeof BG_ACTION_KEYS.APPLY_REGEXES_TO_SONGINFO
  data: SongInfo
}

export interface SaveForceRecogniseTrackActionObject {
  type: typeof BG_ACTION_KEYS.SAVE_FORCE_RECOGNISE_TRACK
  data: {
    connectorKey: ConnectorKey
    connectorTrackId: ConnectorTrackId
    shouldForceRecognise: boolean
  }
}

export interface GetIfForceRecogniseTrackActionObject {
  type: typeof BG_ACTION_KEYS.GET_IF_FORCE_RECOGNISE_TRACK
  data: TrackSelector
}

export interface SendLogActionObject {
  type: typeof BG_ACTION_KEYS.SEND_LOG
  data: LogEntryPayload
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
  | GetSavedRegexesActionObject
  | ResetSavedRegexesActionObject
  | AddSavedRegexActionObject
  | ApplyRegexesToSongInfoActionObject
  | UpdateSavedRegexActionObject
  | SaveForceRecogniseTrackActionObject
  | GetIfForceRecogniseTrackActionObject
  | SendLogActionObject
