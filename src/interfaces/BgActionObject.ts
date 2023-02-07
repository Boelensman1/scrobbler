import type { BG_ACTION_KEYS } from 'internals'
import type { Config, SongInfo, TimeInfo, TrackEditValues } from 'interfaces'

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

export interface SetTrackPlayingActionObject {
  type: typeof BG_ACTION_KEYS.SET_TRACK_PLAYING
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
  type: typeof BG_ACTION_KEYS.SET_PLAY_TIME
  data: { connectorId: string; timeInfo: TimeInfo }
}

export interface ToggleDisableToggleCurrentActionObject {
  type: typeof BG_ACTION_KEYS.TOGGLE_DISABLE_SCROBBLE_CURRENT
}

export interface ForceToggleCurrentActionObject {
  type: typeof BG_ACTION_KEYS.FORCE_SCROBBLE_CURRENT
}

export interface SaveTrackEditActionObject {
  type: typeof BG_ACTION_KEYS.SAVE_TRACK_EDIT
  data: { connectorId: string; editValues: TrackEditValues }
}

export type BgActionObject =
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
