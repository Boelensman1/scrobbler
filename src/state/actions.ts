import browser from 'webextension-polyfill'
import type {
  ActionObject,
  Config,
  GetConfigActionObject,
  GetStateActionObject,
  RequestAuthenticationActionObject,
  ResetConfigActionObject,
  SaveConfigActionObject,
  SetLoadingNewTrackActionObject,
  SetPlayTimeActionObject,
  SetTrackPlayingActionObject,
  SongInfo,
  State,
  TimeInfo,
  ToggleDisableToggleCurrentActionObject,
  ForceToggleCurrentActionObject,
} from 'interfaces'

export const ACTION_KEYS = {
  REQUEST_AUTHENTICATION: 'REQUEST_AUTHENTICATION' as 'REQUEST_AUTHENTICATION',

  GET_STATE: 'GET_STATE' as 'GET_STATE',
  GET_CONFIG: 'GET_CONFIG' as 'GET_CONFIG',
  RESET_CONFIG: 'RESET_CONFIG' as 'RESET_CONFIG',
  SAVE_CONFIG: 'SAVE_CONFIG' as 'SAVE_CONFIG',

  SET_LOADING_NEW_TRACK: 'SET_LOADING_NEW_TRACK' as 'SET_LOADING_NEW_TRACK',
  SET_TRACK_PLAYING: 'SET_TRACK_PLAYING' as 'SET_TRACK_PLAYING',
  SET_PLAY_STATE: 'SET_PLAY_STATE' as 'SET_PLAY_STATE',
  SET_PLAY_TIME: 'SET_PLAY_TIME' as 'SET_PLAY_TIME',

  TOGGLE_DISABLE_SCROBBLE_CURRENT:
    'TOGGLE_DISABLE_SCROBBLE_CURRENT' as 'TOGGLE_DISABLE_SCROBBLE_CURRENT',
  FORCE_SCROBBLE_CURRENT: 'FORCE_SCROBBLE_CURRENT' as 'FORCE_SCROBBLE_CURRENT',
}

const send = <T extends ActionObject, U = void>(arg: T): Promise<U> =>
  browser.runtime.sendMessage(arg)

const actions = {
  requestAuthentication: () =>
    send<RequestAuthenticationActionObject>({
      type: ACTION_KEYS.REQUEST_AUTHENTICATION,
    }),
  getState: (): Promise<State> =>
    send<GetStateActionObject, State>({
      type: ACTION_KEYS.GET_STATE,
    }),
  getConfig: (): Promise<Config> =>
    send<GetConfigActionObject, Config>({
      type: ACTION_KEYS.GET_CONFIG,
    }),
  resetConfig: () =>
    send<ResetConfigActionObject>({
      type: ACTION_KEYS.RESET_CONFIG,
    }),
  saveConfig: (config: Partial<Config>) =>
    send<SaveConfigActionObject>({
      type: ACTION_KEYS.SAVE_CONFIG,
      data: config,
    }),
  setLoadingNewTrack: () =>
    send<SetLoadingNewTrackActionObject>({
      type: ACTION_KEYS.SET_LOADING_NEW_TRACK,
    }),
  setTrackPlaying: ({
    songInfos,
    timeInfo,
    location,
    popularity,
  }: {
    songInfos: SongInfo[]
    timeInfo: TimeInfo
    location: string
    popularity: number
  }) =>
    send<SetTrackPlayingActionObject>({
      type: ACTION_KEYS.SET_TRACK_PLAYING,
      data: {
        songInfos,
        timeInfo,
        location,
        popularity,
      },
    }),
  setPlayTime: (connectorId: string, timeInfo: TimeInfo) =>
    send<SetPlayTimeActionObject>({
      type: ACTION_KEYS.SET_PLAY_TIME,
      data: { connectorId, timeInfo },
    }),
  toggleDisableToggleCurrent: () =>
    send<ToggleDisableToggleCurrentActionObject>({
      type: ACTION_KEYS.TOGGLE_DISABLE_SCROBBLE_CURRENT,
    }),
  forceScrobbleCurrent: () =>
    send<ForceToggleCurrentActionObject>({
      type: ACTION_KEYS.FORCE_SCROBBLE_CURRENT,
    }),
}

export default actions
