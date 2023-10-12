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
  EventNotificationCTActionObject,
  CTEvent,
  RefreshCurrentTrackCTActionObject,
} from 'interfaces'

export const CT_ACTION_KEYS = {
  GET_STILL_PLAYING: 'GET_STILL_PLAYING' as const,
  GET_CONNECTOR_STATE: 'GET_CONNECTOR_STATE' as const,

  TOGGLE_DISABLE_SCROBBLE_CURRENT: 'TOGGLE_DISABLE_SCROBBLE_CURRENT' as const,
  FORCE_SCROBBLE_CURRENT: 'FORCE_SCROBBLE_CURRENT' as const,
  REFRESH_CURRENT_TRACK: 'REFRESH_CURRENT_TRACK' as const,

  SAVE_TRACK_EDIT: 'SAVE_TRACK_EDIT_CT' as const,

  SET_FORCE_RECOGNISE_CURRENT: 'SET_FORCE_RECOGNISE_CURRENT' as const,

  EVENT_NOTIFICATION: 'EVENT_NOTIFICATION' as const,
}

type TabIdOpt = number | undefined

const send = async <T extends CtActionObject, U = null>(
  tabId: TabIdOpt,
  arg: T,
): Promise<U | null> => {
  if (typeof tabId === 'number') {
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
  getStillPlaying: (tabId: TabIdOpt) =>
    send<GetStillPlayingCTActionObject, boolean>(tabId, {
      type: CT_ACTION_KEYS.GET_STILL_PLAYING,
    }),
  getConnectorState: (tabId: TabIdOpt) =>
    send<GetConnectorStateCTActionObject, ConnectorState>(tabId, {
      type: CT_ACTION_KEYS.GET_CONNECTOR_STATE,
    }),
  toggleDisableToggleCurrent: (tabId: TabIdOpt) =>
    send<ToggleDisableToggleCurrentCTActionObject>(tabId, {
      type: CT_ACTION_KEYS.TOGGLE_DISABLE_SCROBBLE_CURRENT,
    }),
  forceScrobbleCurrent: (tabId: TabIdOpt) =>
    send<ForceToggleCurrentCTActionObject>(tabId, {
      type: CT_ACTION_KEYS.FORCE_SCROBBLE_CURRENT,
    }),
  refreshCurrentTrack: (tabId: TabIdOpt) =>
    send<RefreshCurrentTrackCTActionObject>(tabId, {
      type: CT_ACTION_KEYS.REFRESH_CURRENT_TRACK,
    }),
  saveTrackEdit: (tabId: TabIdOpt, editValues: SongInfo) =>
    send<SaveTrackEditCTActionObject>(tabId, {
      type: CT_ACTION_KEYS.SAVE_TRACK_EDIT,
      data: { editValues },
    }),
  setForceRecogniseCurrent: (tabId: TabIdOpt, value: boolean) =>
    send<SetForceRecogniseCurrentCTActionObject>(tabId, {
      type: CT_ACTION_KEYS.SET_FORCE_RECOGNISE_CURRENT,
      data: value,
    }),
  eventNotification: (tabId: TabIdOpt, event: CTEvent) =>
    send<EventNotificationCTActionObject>(tabId, {
      type: CT_ACTION_KEYS.EVENT_NOTIFICATION,
      data: { event },
    }),
}

export default actions
