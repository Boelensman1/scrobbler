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
  SavedEdit,
  SaveTrackEditBGActionObject,
  TrackSelector,
  GetTrackFromEdittedTracksActionObject,
  GetEdittedTracksActionObject,
  SongInfo,
  EdittedTracks,
  GetSavedRegexesActionObject,
  AddSavedRegexActionObject,
  ApplyRegexesToSongInfoActionObject,
  StringifiedSavedRegex,
  ResetSavedRegexesActionObject,
  UpdateSavedRegexActionObject,
  SaveForceRecogniseTrackActionObject,
  ConnectorKey,
  ConnectorTrackId,
  GetIfForceRecogniseTrackActionObject,
  SendLogActionObject,
  LogEntryPayload,
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

  SAVE_TRACK_EDIT: 'SAVE_TRACK_EDIT_BG' as const,
  GET_TRACK_FROM_EDITTED_TRACKS: 'GET_TRACK_FROM_EDITTED_TRACKS' as const,
  GET_EDITTED_TRACKS: 'GET_EDITTED_TRACKS' as const,

  GET_SAVED_REGEXES: 'GET_SAVED_REGEXES' as const,
  RESET_SAVED_REGEXES: 'RESET_SAVED_REGEXES' as const,
  ADD_SAVED_REGEX: 'ADD_SAVED_REGEX' as const,
  UPDATE_SAVED_REGEX: 'UPDATE_SAVED_REGEX' as const,
  APPLY_REGEXES_TO_SONGINFO: 'APPLY_REGEXES_TO_SONGINFO' as const,

  SAVE_FORCE_RECOGNISE_TRACK: 'SAVE_FORCE_RECOGNISE_TRACK' as const,
  GET_IF_FORCE_RECOGNISE_TRACK: 'GET_IF_FORCE_RECOGNISE_TRACK' as const,

  SEND_LOG: 'SEND_LOG' as const,
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
  getConfig: async (): Promise<Config> => {
    const response = await send<GetConfigActionObject, Config>({
      type: BG_ACTION_KEYS.GET_CONFIG,
    })
    // hydrate
    // @ts-expect-error WIP, will have to fix later
    if (response.connectorConfig.invidious.hosts.split) {
      response.connectorConfig.invidious.hosts =
        // @ts-expect-error WIP, will have to fix later
        response.connectorConfig.invidious.hosts.split(',')
    }
    return response
  },
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
  saveTrackEdit: (editValues: SavedEdit) =>
    send<SaveTrackEditBGActionObject>({
      type: BG_ACTION_KEYS.SAVE_TRACK_EDIT,
      data: editValues,
    }),
  getTrackFromEdittedTracks: (
    selector: TrackSelector,
  ): Promise<SongInfo | false> =>
    send<GetTrackFromEdittedTracksActionObject, SongInfo | false>({
      type: BG_ACTION_KEYS.GET_TRACK_FROM_EDITTED_TRACKS,
      data: selector,
    }),
  getEdittedTracks: (): Promise<EdittedTracks> =>
    send<GetEdittedTracksActionObject, EdittedTracks>({
      type: BG_ACTION_KEYS.GET_EDITTED_TRACKS,
    }),
  getSavedRegexes: (): Promise<StringifiedSavedRegex[]> =>
    send<GetSavedRegexesActionObject, StringifiedSavedRegex[]>({
      type: BG_ACTION_KEYS.GET_SAVED_REGEXES,
    }),
  resetSavedRegexes: (): Promise<void> =>
    send<ResetSavedRegexesActionObject>({
      type: BG_ACTION_KEYS.RESET_SAVED_REGEXES,
    }),
  addSavedRegex: (regex: StringifiedSavedRegex) =>
    send<AddSavedRegexActionObject>({
      type: BG_ACTION_KEYS.ADD_SAVED_REGEX,
      data: { regex },
    }),
  updateSavedRegex: (index: number, regex: StringifiedSavedRegex) =>
    send<UpdateSavedRegexActionObject>({
      type: BG_ACTION_KEYS.UPDATE_SAVED_REGEX,
      data: { index, regex },
    }),
  applyRegexesToSongInfo: (songInfo: SongInfo): Promise<SongInfo> =>
    send<ApplyRegexesToSongInfoActionObject, SongInfo>({
      type: BG_ACTION_KEYS.APPLY_REGEXES_TO_SONGINFO,
      data: songInfo,
    }),
  saveForceRecogniseTrack: (data: {
    connectorKey: ConnectorKey
    connectorTrackId: ConnectorTrackId
    shouldForceRecognise: boolean
  }): Promise<void> =>
    send<SaveForceRecogniseTrackActionObject>({
      type: BG_ACTION_KEYS.SAVE_FORCE_RECOGNISE_TRACK,
      data,
    }),
  getIfForceRecogniseTrack: (data: TrackSelector): Promise<boolean> =>
    send<GetIfForceRecogniseTrackActionObject, boolean>({
      type: BG_ACTION_KEYS.GET_IF_FORCE_RECOGNISE_TRACK,
      data,
    }),
  sendLog: (payload: LogEntryPayload) =>
    send<SendLogActionObject>({
      type: BG_ACTION_KEYS.SEND_LOG,
      data: payload,
    }),
}

export default actions
