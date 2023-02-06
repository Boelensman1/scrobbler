import browser from 'webextension-polyfill'

import {
  LastFm,
  Track,
  ConfigContainer,
  scrobbleStates,
  initialState,
  MusicBrainzInformationProvider,
  CoverArtArchiveInformationProvider,
  ACTION_KEYS,
} from 'internals'

import type {
  Config,
  State,
  SongInfo,
  InformationProvider,
  ActionObject,
} from 'interfaces'

const state = { ...initialState }

const scrobblers: { [key: string]: LastFm } = {
  lastFm: new LastFm(),
}

const informationProviders: InformationProvider[] = [
  new MusicBrainzInformationProvider(),
  new CoverArtArchiveInformationProvider(),
]

const config = new ConfigContainer()

const getScrobbler = (): LastFm | null => {
  const selectedScrobbler = config.get('scrobbler')
  if (!selectedScrobbler) {
    return null
  }
  return scrobblers[selectedScrobbler]
}

const getScrobbleState = (state: State): keyof typeof scrobbleStates => {
  const connector = getScrobbler()
  if (!connector) {
    return scrobbleStates.NO_CONNECTOR
  }

  if (state.scrobbleState === scrobbleStates.SCROBBLED) {
    // we already scrobbled
    return scrobbleStates.SCROBBLED
  }

  if (!state.track) {
    return scrobbleStates.TRACK_NOT_RECOGNISED
  }

  if (
    state.trackDuration &&
    state.trackDuration <=
      // according to last.fm api docs, we shouldn't scrobble tracks shorter than 30 seconds
      30
  ) {
    return scrobbleStates.TRACK_TOO_SHORT
  }

  if (state.track.scrobblerMatchQuality < state.minimumScrobblerQuality) {
    return scrobbleStates.BELOW_MIN_SCROBBLER_QUALITY
  }

  return scrobbleStates.WILL_SCROBBLE
}

const getAdditionalDataFromInfoProviders = async (track: Track) => {
  const missingFields = track.getMissingFields()
  for (let informationProvider of informationProviders) {
    // check if some of the missing fields can be provided by this information provider
    const fieldsToProvide = informationProvider.fields.filter((f) =>
      missingFields.includes(f),
    )
    if (fieldsToProvide.length > 0) {
      const newData = await informationProvider.getAdditionalInfo(track)
      fieldsToProvide.forEach((field) => {
        // additional check on !track[field] is needed so we don't overwrite
        // info set by a previous provider
        if (newData[field] && !track[field]) {
          track[field] = newData[field]
        }
      })
    }
  }
}

const resetState = () => {
  Object.assign(state, initialState)

  // reset startedPlaying
  state.startedPlaying = new Date()
}

const forceableScrobbleStates: (keyof typeof scrobbleStates)[] = [
  scrobbleStates.BELOW_MIN_SCROBBLER_QUALITY,
  scrobbleStates.MANUALLY_DISABLED,
  scrobbleStates.SCROBBLED,
  scrobbleStates.TRACK_TOO_SHORT,
  scrobbleStates.WILL_SCROBBLE,
  scrobbleStates.FORCE_SCROBBLE,
]
const canForceScrobble = (scrobbleState: typeof state.scrobbleState): boolean =>
  forceableScrobbleStates.includes(scrobbleState)

async function handleMessage(action: ActionObject) {
  switch (action.type) {
    case ACTION_KEYS.REQUEST_AUTHENTICATION: {
      const url = await scrobblers.lastFm.getAuthUrl('https://last-fm-login')
      browser.tabs.update({ url })
      return
    }

    case ACTION_KEYS.GET_STATE: {
      return state
    }

    case ACTION_KEYS.GET_CONFIG: {
      return config.getFullConfig()
    }

    case ACTION_KEYS.SAVE_CONFIG: {
      Object.entries(action.data).map(([key, value]) => {
        config.set(key as keyof Config, value as any)
      })
      return
    }

    case ACTION_KEYS.RESET_CONFIG: {
      config.reset()
      return
    }

    case ACTION_KEYS.SET_LOADING_NEW_TRACK: {
      resetState()
      state.scrobbleState = scrobbleStates.SEARCHING
      return
    }

    case ACTION_KEYS.SET_TRACK_PLAYING: {
      resetState()
      state.scrobbleState = getScrobbleState(state)
      state.activeConnectorId = action.data.connectorId

      state.minimumScrobblerQuality =
        config.get('minimumScrobblerQuality') *
        (config.get('scrobblerQualityDynamic')
          ? action.data.popularity / 200
          : 1)

      const scrobbler = getScrobbler()
      if (!scrobbler) {
        return
      }

      Promise.all(
        action.data.songInfos.map((songInfo: SongInfo) =>
          scrobbler.getTrack(songInfo),
        ),
      ).then(async (tracks: (Track | null)[]) => {
        state.searchResults = tracks.filter((t) => !!t) as Track[]

        // get the track with the highest 'match quality'
        // match quality for last.fm is defined as # of listeners
        const [track] = state.searchResults.sort(
          (track1: Track, track2: Track) =>
            track2.scrobblerMatchQuality - track1.scrobblerMatchQuality,
        )

        if (track) {
          await getAdditionalDataFromInfoProviders(track)

          state.track = track

          state.scrobbleState = getScrobbleState(state)
        }
      })

      return
    }

    case ACTION_KEYS.TOGGLE_DISABLE_SCROBBLE_CURRENT: {
      if (state.scrobbleState != scrobbleStates.MANUALLY_DISABLED) {
        if (canForceScrobble(state.scrobbleState)) {
          state.scrobbleState = scrobbleStates.MANUALLY_DISABLED
        }
      } else {
        state.scrobbleState = getScrobbleState(state)
      }
      return
    }

    case ACTION_KEYS.FORCE_SCROBBLE_CURRENT: {
      if (canForceScrobble(state.scrobbleState)) {
        state.scrobbleState = scrobbleStates.FORCE_SCROBBLE
      }
      return
    }

    case ACTION_KEYS.SAVE_TRACK_EDIT: {
      // not the current track, don't update state
      if (action.data.connectorId !== state.activeConnectorId) {
        return
      }

      if (state.scrobbleState !== scrobbleStates.MANUALLY_DISABLED) {
        state.scrobbleState = scrobbleStates.SEARCHING
      }
      state.track = null

      const scrobbler = getScrobbler()
      if (!scrobbler) {
        return
      }

      const track = await scrobbler.getTrack({
        track: action.data.editValues.name.trim(),
        artist: action.data.editValues.artist.trim(),
      })

      if (track) {
        await getAdditionalDataFromInfoProviders(track)

        state.track = track

        if (state.scrobbleState !== scrobbleStates.MANUALLY_DISABLED) {
          state.scrobbleState = getScrobbleState(state)
        }
      }

      return
    }

    case ACTION_KEYS.SET_PLAY_TIME: {
      // not the current track, don't update state
      if (action.data.connectorId !== state.activeConnectorId) {
        return
      }

      const { duration, playTime } = action.data.timeInfo

      state.playTime = playTime
      state.trackDuration = duration

      // From last.fm docs, scrobbling should occur when: the track has been played for at least half its duration, or for 4 minutes (whichever occurs earlier.)
      state.scrobbleAt = Math.min(60 * 4, duration ? duration / 2 : 9999)

      if (
        state.track &&
        (state.scrobbleState === scrobbleStates.WILL_SCROBBLE ||
          state.scrobbleState === scrobbleStates.FORCE_SCROBBLE)
      ) {
        const scrobbler = getScrobbler()

        if (state.sendNowPlaying === false) {
          state.sendNowPlaying = true

          if (scrobbler) {
            scrobbler.setNowPlaying(state.track!)
          }
        }

        if (
          state.playTime > state.scrobbleAt ||
          state.scrobbleState === scrobbleStates.FORCE_SCROBBLE
        ) {
          state.scrobbleState = scrobbleStates.SCROBBLED
          if (scrobbler) {
            scrobbler.scrobble(state.track!, state.startedPlaying!)
          }
        }
      }
      return
    }
  }
}
function handleMessageContainer(
  action: ActionObject,
  _sender: any,
  sendResponse: () => any,
): true {
  handleMessage(action).then(sendResponse)
  return true
}

browser.tabs.onUpdated.addListener(async (id, changeInfo, windowprops) => {
  if (
    // change comes through on loading with chrome, complete with firefox
    (windowprops.status !== 'loading' && windowprops.status !== 'complete') ||
    !changeInfo['url']
  ) {
    return
  }
  const { url } = windowprops
  if (url && url.startsWith('https://last-fm-login')) {
    browser.storage.sync.set({ lastpassToken: null })
    scrobblers.lastFm.setSessionKey(null)

    const parsedUrl = new URL(url)
    const token = new URLSearchParams(parsedUrl.search).get('token')
    if (!token) {
      return
    }
    const sessionKey = await scrobblers.lastFm.getSessionKey(token)
    if (sessionKey) {
      config.set('scrobbler', 'lastFm')
      config.set('lastfmSessionKey', sessionKey)
    }
    browser.tabs.remove(id)
  }
})

const main = async () => {
  await config.loadConfig()

  const connector = config.get('scrobbler')
  switch (connector) {
    case 'lastFm': {
      const lastfmSessionKey = config.get('lastfmSessionKey')
      if (!lastfmSessionKey) {
        config.set('scrobbler', null)
      } else {
        scrobblers.lastFm.setSessionKey(lastfmSessionKey)
      }
    }
  }

  browser.runtime.onMessage.addListener(handleMessageContainer)
}
main()
