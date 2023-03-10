import browser from 'webextension-polyfill'
import type {
  BgActionObject,
  Config,
  GetConfigActionObject,
  GetStateActionObject,
  RequestAuthenticationActionObject,
  ResetConfigActionObject,
  SaveConfigActionObject,
  SetLoadingNewTrackActionObject,
  State,
  RequestBecomeActiveTabActionObject,
  GetIsActiveTabActionObject,
} from 'interfaces'

export const BG_ACTION_KEYS = {
  REQUEST_AUTHENTICATION: 'REQUEST_AUTHENTICATION' as const,

  GET_STATE: 'GET_STATE' as const,
  GET_CONFIG: 'GET_CONFIG' as const,
  RESET_CONFIG: 'RESET_CONFIG' as const,
  SAVE_CONFIG: 'SAVE_CONFIG' as const,

  SET_LOADING_NEW_TRACK: 'SET_LOADING_NEW_TRACK' as const,
  REQUEST_BECOME_ACTIVE_TAB: 'REQUEST_BECOME_ACTIVE_TAB' as const,
  GET_IS_ACTIVE_TAB: 'GET_IS_ACTIVE_TAB' as const,
}

const send = <T extends BgActionObject, U = void>(arg: T): Promise<U> =>
  browser.runtime.sendMessage(arg)

const actions = {
  requestAuthentication: () =>
    send<RequestAuthenticationActionObject>({
      type: BG_ACTION_KEYS.REQUEST_AUTHENTICATION,
    }),
  getState: (): Promise<State> =>
    send<GetStateActionObject, State>({
      type: BG_ACTION_KEYS.GET_STATE,
    }),
  getConfig: (): Promise<Config> =>
    send<GetConfigActionObject, Config>({
      type: BG_ACTION_KEYS.GET_CONFIG,
    }),
  resetConfig: () =>
    send<ResetConfigActionObject>({
      type: BG_ACTION_KEYS.RESET_CONFIG,
    }),
  saveConfig: (config: Partial<Config>) =>
    send<SaveConfigActionObject>({
      type: BG_ACTION_KEYS.SAVE_CONFIG,
      data: config,
    }),
  setLoadingNewTrack: () =>
    send<SetLoadingNewTrackActionObject>({
      type: BG_ACTION_KEYS.SET_LOADING_NEW_TRACK,
    }),
  requestBecomeActiveTab: (force: boolean) =>
    send<RequestBecomeActiveTabActionObject>({
      type: BG_ACTION_KEYS.REQUEST_BECOME_ACTIVE_TAB,
      data: { force },
    }),
  getIsActiveTab: (): Promise<boolean> =>
    send<GetIsActiveTabActionObject, boolean>({
      type: BG_ACTION_KEYS.GET_IS_ACTIVE_TAB,
    }),
}

export default actions
