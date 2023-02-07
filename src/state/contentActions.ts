import browser from 'webextension-polyfill'
import type {
  ConnectorState,
  CtActionObject,
  GetConnectorStateActionObject,
  GetStillPlayingActionObject,
  ToggleDisableToggleCurrentActionObject,
  ForceToggleCurrentActionObject,
  SaveTrackEditActionObject,
  SongInfo,
} from 'interfaces'

export const CT_ACTION_KEYS = {
  GET_STILL_PLAYING: 'GET_STILL_PLAYING' as 'GET_STILL_PLAYING',
  GET_CONNECTOR_STATE: 'GET_CONNECTOR_STATE' as 'GET_CONNECTOR_STATE',

  TOGGLE_DISABLE_SCROBBLE_CURRENT:
    'TOGGLE_DISABLE_SCROBBLE_CURRENT' as 'TOGGLE_DISABLE_SCROBBLE_CURRENT',
  FORCE_SCROBBLE_CURRENT: 'FORCE_SCROBBLE_CURRENT' as 'FORCE_SCROBBLE_CURRENT',

  SAVE_TRACK_EDIT: 'SAVE_TRACK_EDIT' as 'SAVE_TRACK_EDIT',
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
  getStillPlaying: (tabId: number, _data?: any) =>
    send<GetStillPlayingActionObject, boolean>(tabId, {
      type: CT_ACTION_KEYS.GET_STILL_PLAYING,
    }),
  getConnectorState: (tabId: number, _data?: any) =>
    send<GetConnectorStateActionObject, ConnectorState>(tabId, {
      type: CT_ACTION_KEYS.GET_CONNECTOR_STATE,
    }),
  toggleDisableToggleCurrent: (tabId: number) =>
    send<ToggleDisableToggleCurrentActionObject>(tabId, {
      type: CT_ACTION_KEYS.TOGGLE_DISABLE_SCROBBLE_CURRENT,
    }),
  forceScrobbleCurrent: (tabId: number) =>
    send<ForceToggleCurrentActionObject>(tabId, {
      type: CT_ACTION_KEYS.FORCE_SCROBBLE_CURRENT,
    }),
  saveTrackEdit: (tabId: number, editValues: SongInfo) =>
    send<SaveTrackEditActionObject>(tabId, {
      type: CT_ACTION_KEYS.SAVE_TRACK_EDIT,
      data: { editValues },
    }),
}

export default actions
