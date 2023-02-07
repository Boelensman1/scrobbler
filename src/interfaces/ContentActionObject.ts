import type { CONTENT_ACTION_KEYS } from 'internals'
import type { Config, SongInfo, TimeInfo, TrackEditValues } from 'interfaces'

export interface RequestAuthenticationActionObject {
  type: typeof ACTION_KEYS.REQUEST_AUTHENTICATION
}

export interface GetStateActionObject {
  type: typeof ACTION_KEYS.GET_STATE
}

export interface GetConfigActionObject {
  type: typeof ACTION_KEYS.GET_CONFIG
}

export interface ResetConfigActionObject {
  type: typeof ACTION_KEYS.RESET_CONFIG
}

export interface SaveConfigActionObject {
  type: typeof ACTION_KEYS.SAVE_CONFIG
  data: Partial<Config>
}

export interface SetLoadingNewTrackActionObject {
  type: typeof ACTION_KEYS.SET_LOADING_NEW_TRACK
}

export interface SetTrackPlayingActionObject {
  type: typeof ACTION_KEYS.SET_TRACK_PLAYING
  data: {
    songInfos: SongInfo[]
    timeInfo: TimeInfo
    location: string
    popularity: number
    connectorId: string
    onlyIfNoneIsPlaying: boolean
  }
}

export interface SetPlayTimeActionObject {
  type: typeof ACTION_KEYS.SET_PLAY_TIME
  data: { connectorId: string; timeInfo: TimeInfo }
}

export interface ToggleDisableToggleCurrentActionObject {
  type: typeof ACTION_KEYS.TOGGLE_DISABLE_SCROBBLE_CURRENT
}

export interface ForceToggleCurrentActionObject {
  type: typeof ACTION_KEYS.FORCE_SCROBBLE_CURRENT
}

export interface SaveTrackEditActionObject {
  type: typeof ACTION_KEYS.SAVE_TRACK_EDIT
  data: { connectorId: string; editValues: TrackEditValues }
}

export type ActionObject =
  | RequestAuthenticationActionObject
  | GetStateActionObject
  | GetConfigActionObject
  | ResetConfigActionObject
  | SaveConfigActionObject
  | SetLoadingNewTrackActionObject
  | SetTrackPlayingActionObject
  | SetPlayTimeActionObject
  | ToggleDisableToggleCurrentActionObject
  | ForceToggleCurrentActionObject
  | SaveTrackEditActionObject
