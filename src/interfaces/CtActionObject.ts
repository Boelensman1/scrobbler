import type { SongInfo } from 'interfaces'
import type { CT_ACTION_KEYS } from 'internals'

export type CTEvent = 'configUpdated'

export interface GetStillPlayingCTActionObject {
  type: typeof CT_ACTION_KEYS.GET_STILL_PLAYING
}

export interface GetConnectorStateCTActionObject {
  type: typeof CT_ACTION_KEYS.GET_CONNECTOR_STATE
}

export interface ToggleDisableToggleCurrentCTActionObject {
  type: typeof CT_ACTION_KEYS.TOGGLE_DISABLE_SCROBBLE_CURRENT
}

export interface ForceToggleCurrentCTActionObject {
  type: typeof CT_ACTION_KEYS.FORCE_SCROBBLE_CURRENT
}

export interface SaveTrackEditCTActionObject {
  type: typeof CT_ACTION_KEYS.SAVE_TRACK_EDIT
  data: { editValues: SongInfo }
}

export interface SetForceRecogniseCurrentCTActionObject {
  type: typeof CT_ACTION_KEYS.SET_FORCE_RECOGNISE_CURRENT
  data: boolean
}

export interface EventNotificationCTActionObject {
  type: typeof CT_ACTION_KEYS.EVENT_NOTIFICATION
  data: { event: CTEvent }
}

export interface RefreshCurrentTrackCTActionObject {
  type: typeof CT_ACTION_KEYS.REFRESH_CURRENT_TRACK
}

export type CtActionObject =
  | GetStillPlayingCTActionObject
  | GetConnectorStateCTActionObject
  | ToggleDisableToggleCurrentCTActionObject
  | ForceToggleCurrentCTActionObject
  | SaveTrackEditCTActionObject
  | SetForceRecogniseCurrentCTActionObject
  | EventNotificationCTActionObject
  | RefreshCurrentTrackCTActionObject
