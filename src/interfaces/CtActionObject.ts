import type { TrackEditValues } from 'interfaces'
import type { CT_ACTION_KEYS } from 'internals'

export interface GetStillPlayingActionObject {
  type: typeof CT_ACTION_KEYS.GET_STILL_PLAYING
}

export interface GetConnectorStateActionObject {
  type: typeof CT_ACTION_KEYS.GET_CONNECTOR_STATE
}

export interface ToggleDisableToggleCurrentActionObject {
  type: typeof CT_ACTION_KEYS.TOGGLE_DISABLE_SCROBBLE_CURRENT
}

export interface ForceToggleCurrentActionObject {
  type: typeof CT_ACTION_KEYS.FORCE_SCROBBLE_CURRENT
}

export interface SaveTrackEditActionObject {
  type: typeof CT_ACTION_KEYS.SAVE_TRACK_EDIT
  data: { editValues: TrackEditValues }
}

export type CtActionObject =
  | GetStillPlayingActionObject
  | GetConnectorStateActionObject
  | ToggleDisableToggleCurrentActionObject
  | ForceToggleCurrentActionObject
  | SaveTrackEditActionObject
