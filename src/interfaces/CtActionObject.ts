import type { CT_ACTION_KEYS } from 'internals'

export interface GetStillPlayingActionObject {
  type: typeof CT_ACTION_KEYS.GET_STILL_PLAYING
  connectorId: string
}

export type CtActionObject = GetStillPlayingActionObject
