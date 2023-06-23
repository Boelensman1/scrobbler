import browser from 'webextension-polyfill'
import type {
  ConnectorState,
  CtActionObject,
  GetConnectorStateCTActionObject,
  GetStillPlayingCTActionObject,
  ToggleDisableToggleCurrentCTActionObject,
  ForceToggleCurrentCTActionObject,
  SaveTrackEditCTActionObject,
  SongInfo,
  SetForceRecogniseCurrentCTActionObject,
} from 'interfaces'

export const CT_ACTION_KEYS = {
  GET_STILL_PLAYING: 'GET_STILL_PLAYING' as const,
  GET_CONNECTOR_STATE: 'GET_CONNECTOR_STATE' as const,

  TOGGLE_DISABLE_SCROBBLE_CURRENT: 'TOGGLE_DISABLE_SCROBBLE_CURRENT' as const,
  FORCE_SCROBBLE_CURRENT: 'FORCE_SCROBBLE_CURRENT' as const,

  SAVE_TRACK_EDIT: 'SAVE_TRACK_EDIT_CT' as const,

  SET_FORCE_RECOGNISE_CURRENT: 'SET_FORCE_RECOGNISE_CURRENT' as const,
}

const send = async <T extends CtActionObject, U = null>(
  tabId: number,
  arg: T,
): Promise<U | null> => {
  if (tabId) {
    try {
      // seperate, otherwise we can't catch the exception
      const result = await browser.tabs.sendMessage(tabId, arg)
      return result
    } catch (e) {
      /* noop, tab is probably not listening */
    }
  }
  return null
}

const actions = {
  getStillPlaying: (tabId: number) =>
    send<GetStillPlayingCTActionObject, boolean>(tabId, {
      type: CT_ACTION_KEYS.GET_STILL_PLAYING,
    }),
  getConnectorState: (tabId: number) =>
    send<GetConnectorStateCTActionObject, ConnectorState>(tabId, {
      type: CT_ACTION_KEYS.GET_CONNECTOR_STATE,
    }),
  toggleDisableToggleCurrent: (tabId: number) =>
    send<ToggleDisableToggleCurrentCTActionObject>(tabId, {
      type: CT_ACTION_KEYS.TOGGLE_DISABLE_SCROBBLE_CURRENT,
    }),
  forceScrobbleCurrent: (tabId: number) =>
    send<ForceToggleCurrentCTActionObject>(tabId, {
      type: CT_ACTION_KEYS.FORCE_SCROBBLE_CURRENT,
    }),
  saveTrackEdit: (tabId: number, editValues: SongInfo) =>
    send<SaveTrackEditCTActionObject>(tabId, {
      type: CT_ACTION_KEYS.SAVE_TRACK_EDIT,
      data: { editValues },
    }),
  setForceRecogniseCurrent: (tabId: number, value: boolean) =>
    send<SetForceRecogniseCurrentCTActionObject>(tabId, {
      type: CT_ACTION_KEYS.SET_FORCE_RECOGNISE_CURRENT,
      data: value,
    }),
}

export default actions
