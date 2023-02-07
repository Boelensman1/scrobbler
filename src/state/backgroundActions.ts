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
  SetPlayTimeActionObject,
  SetTrackPlayingActionObject,
  SongInfo,
  State,
  TimeInfo,
  ToggleDisableToggleCurrentActionObject,
  ForceToggleCurrentActionObject,
  TrackEditValues,
  SaveTrackEditActionObject,
} from 'interfaces'

export const BG_ACTION_KEYS = {
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

  SAVE_TRACK_EDIT: 'SAVE_TRACK_EDIT' as 'SAVE_TRACK_EDIT',
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
  setTrackPlaying: (
    connectorId: string,
    {
      songInfos,
      timeInfo,
      location,
      popularity,
      onlyIfNoneIsPlaying,
    }: {
      songInfos: SongInfo[]
      timeInfo: TimeInfo
      location: string
      popularity: number
      onlyIfNoneIsPlaying: boolean
    },
  ) =>
    send<SetTrackPlayingActionObject>({
      type: BG_ACTION_KEYS.SET_TRACK_PLAYING,
      data: {
        connectorId,
        songInfos,
        timeInfo,
        location,
        popularity,
        onlyIfNoneIsPlaying,
      },
    }),
  setPlayTime: (connectorId: string, timeInfo: TimeInfo) =>
    send<SetPlayTimeActionObject>({
      type: BG_ACTION_KEYS.SET_PLAY_TIME,
      data: { connectorId, timeInfo },
    }),
  toggleDisableToggleCurrent: () =>
    send<ToggleDisableToggleCurrentActionObject>({
      type: BG_ACTION_KEYS.TOGGLE_DISABLE_SCROBBLE_CURRENT,
    }),
  forceScrobbleCurrent: () =>
    send<ForceToggleCurrentActionObject>({
      type: BG_ACTION_KEYS.FORCE_SCROBBLE_CURRENT,
    }),
  saveTrackEdit: (connectorId: string, editValues: TrackEditValues) =>
    send<SaveTrackEditActionObject>({
      type: BG_ACTION_KEYS.SAVE_TRACK_EDIT,
      data: { connectorId, editValues },
    }),
}

export default actions
