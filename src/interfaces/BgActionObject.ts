import type { BG_ACTION_KEYS } from 'internals'
import type { Config, SavedEdit, TrackSelector } from 'interfaces'

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
