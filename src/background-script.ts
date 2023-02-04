import browser from 'webextension-polyfill'

import {
  LastFm,
  Track,
  ConfigContainer,
  actions,
  scrobbleStates,
  initialState,
  MusicBrainzInformationProvider,
  CoverArtArchiveInformationProvider,
} from 'internals'

import { Config, State, SongInfo, InformationProvider } from 'interfaces'

interface IncomingRequest {
  type: keyof typeof actions
  data: any
}

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
    state.track.duration &&
    state.track.duration <=
      // according to last.fm api docs, we shouldn't scrobble tracks shorter than 30 seconds
      30
  ) {
    return scrobbleStates.TRACK_TOO_SHORT
  }

  if (
    state.track.scrobblerMatchQuality < config.get('minimumScrobblerQuality')
  ) {
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

async function handleMessage(action: IncomingRequest) {
  switch (action.type) {
    case actions.REQUEST_AUTHENTICATION: {
      const url = await scrobblers.lastFm.getAuthUrl('https://last-fm-login')
      browser.tabs.update({ url })
      return
    }

    case actions.GET_STATE: {
      return state
    }

    case actions.GET_CONFIG: {
      return config.getFullConfig()
    }

    case actions.SAVE_CONFIG: {
      Object.entries(action.data).map(([key, value]) => {
        config.set(key as keyof Config, value as any)
      })
      return
    }

    case actions.RESET_CONFIG: {
      config.reset()
      return
    }

    case actions.SET_LOADING_NEW_TRACK: {
      resetState()
      state.scrobbleState = scrobbleStates.SEARCHING
      return
    }

    case actions.SET_TRACK_PLAYING: {
      state.debugString = action.data.location

      resetState()
      state.scrobbleState = getScrobbleState(state)

      const connector = getScrobbler()
      if (!connector) {
        return
      }

      Promise.all(
        action.data.songInfos.map((songInfo: SongInfo) =>
          connector.getTrack(songInfo),
        ),
      ).then(async (tracks) => {
        state.debugString = JSON.stringify(
          [
            action.data.songInfos.map((songInfo: SongInfo) => ({
              track: songInfo.track,
              artist: songInfo.artist,
            })),
            tracks,
          ],
          null,
          2,
        )
        // get the track with the highest 'match quality'
        // match quality for last.fm is defined as # of listeners
        const [track] = tracks
          .filter((t) => !!t)
          .sort(
            (track1: Track, track2: Track) =>
              track2.scrobblerMatchQuality - track1.scrobblerMatchQuality,
          )

        if (track) {
          track.duration = action.data.timeInfo?.duration

          await getAdditionalDataFromInfoProviders(track)

          state.track = track

          state.scrobbleState = getScrobbleState(state)
        }
      })

      return
    }

    case actions.SET_PLAY_STATE: {
      state.playState = action.data.playState
      return
    }

    case actions.DISABLE_SCROBBLE_CURRENT: {
      state.scrobbleState = scrobbleStates.MANUALLY_DISABLED
      return
    }

    case actions.SET_PLAY_TIME: {
      state.playTime = action.data.playTime
      const duration = action.data.duration

      // From last.fm docs, scrobbling should occur when: the track has been played for at least half its duration, or for 4 minutes (whichever occurs earlier.)
      state.scrobbleAt = Math.min(60 * 4, duration ? duration / 2 : 9999)

      if (
        state.playState === 'PLAYING' &&
        state.track &&
        state.scrobbleState === scrobbleStates.WILL_SCROBBLE
      ) {
        const scrobbler = getScrobbler()

        if (state.sendNowPlaying === false) {
          state.sendNowPlaying = true

          if (scrobbler) {
            scrobbler.setNowPlaying(state.track!)
          }
        }

        if (state.playTime > state.scrobbleAt) {
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
  action: IncomingRequest,
  _sender: any,
  sendResponse: () => any,
): true {
  handleMessage(action).then(sendResponse)
  return true
}

browser.tabs.onUpdated.addListener(async (id, changeInfo, windowprops) => {
  console.log(id, windowprops.status, changeInfo['url'])
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
