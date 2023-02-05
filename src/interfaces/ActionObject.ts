import type { ACTION_KEYS } from 'internals'
import type { Config, SongInfo, TimeInfo } from 'interfaces'

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
  }
}

export interface SetPlayStateActionObject {
  type: typeof ACTION_KEYS.SET_PLAY_STATE
  data: { playState: 'PLAYING' | 'PAUSED' }
}

export interface SetPlayTimeActionObject {
  type: typeof ACTION_KEYS.SET_PLAY_TIME
  data: TimeInfo
}

export interface ToggleDisableToggleCurrentActionObject {
  type: typeof ACTION_KEYS.TOGGLE_DISABLE_SCROBBLE_CURRENT
}

type ActionObject =
  | RequestAuthenticationActionObject
  | GetStateActionObject
  | GetConfigActionObject
  | ResetConfigActionObject
  | SaveConfigActionObject
  | SetLoadingNewTrackActionObject
  | SetTrackPlayingActionObject
  | SetPlayStateActionObject
  | SetPlayTimeActionObject
  | ToggleDisableToggleCurrentActionObject

export default ActionObject
