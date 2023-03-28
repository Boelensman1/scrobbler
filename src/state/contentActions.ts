import browser from 'webextension-polyfill'
import type {
  ConnectorState,
  CtActionObject,
  GetConnectorStateActionObject,
  GetStillPlayingActionObject,
  ToggleDisableToggleCurrentActionObject,
  ForceToggleCurrentActionObject,
  SaveTrackEditCTActionObject,
  SongInfo,
} from 'interfaces'

export const CT_ACTION_KEYS = {
  GET_STILL_PLAYING: 'GET_STILL_PLAYING' as const,
  GET_CONNECTOR_STATE: 'GET_CONNECTOR_STATE' as const,

  TOGGLE_DISABLE_SCROBBLE_CURRENT: 'TOGGLE_DISABLE_SCROBBLE_CURRENT' as const,
  FORCE_SCROBBLE_CURRENT: 'FORCE_SCROBBLE_CURRENT' as const,

  SAVE_TRACK_EDIT: 'SAVE_TRACK_EDIT_CT' as const,
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
    send<GetStillPlayingActionObject, boolean>(tabId, {
      type: CT_ACTION_KEYS.GET_STILL_PLAYING,
    }),
  getConnectorState: (tabId: number) =>
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
    send<SaveTrackEditCTActionObject>(tabId, {
      type: CT_ACTION_KEYS.SAVE_TRACK_EDIT,
      data: { editValues },
    }),
}

export default actions
