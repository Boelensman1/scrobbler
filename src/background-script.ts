import browser from 'webextension-polyfill'

import {
  ConfigContainer,
  EdittedTracksManager,
  RegexesManager,
  ForceRecognitionTracksManager,
  BG_ACTION_KEYS,
  StateManager,
  ctActions,
  BrowserStorage,
  Logger,
  TrackInfoCacheManager,
  Track,
} from 'internals'

import type { Config, BgActionObject, State } from 'interfaces'

import scrobblers from './scrobblerList'

const logger = new Logger('background-script')

const browserStorage = new BrowserStorage()

let edittedTracksManager: EdittedTracksManager
let regexesManager: RegexesManager
let forceRecognitionTracksManager: ForceRecognitionTracksManager
let config: ConfigContainer
let stateManager: StateManager
let trackInfoCacheManager: TrackInfoCacheManager

// setFullyLoaded is called after init (in main)
let setFullyLoaded: (val: true) => void
const fullyLoaded = new Promise((resolve) => (setFullyLoaded = resolve))

async function updateActiveConnectorTabIdQueue(state: State) {
  // this will lead to race conditions, but as it will just be cleaned
  // up in the next iteration we don't really care
  const queueIsStillPlaying = await Promise.all(
    state.activeConnectorTabIdQueue.map((tabId) =>
      ctActions.getStillPlaying(tabId),
    ),
  )
  state.activeConnectorTabIdQueue = state.activeConnectorTabIdQueue.filter(
    (_val, index) => queueIsStillPlaying[index],
  )
  logger.debug(
    `New "waiting to become active" queue ${JSON.stringify(
      state.activeConnectorTabIdQueue,
    )}`,
  )
}

async function handleMessage(
  action: BgActionObject,
  sender: browser.Runtime.MessageSender,
) {
  logger.trace('Incoming message', { action, sender })
  await fullyLoaded
  const state = await stateManager.getState()

  switch (action.type) {
    case BG_ACTION_KEYS.REQUEST_AUTHENTICATION: {
      const url = await scrobblers.lastFm.getAuthUrl('https://last-fm-login')
      browser.tabs.update({ url })
      return
    }

    case BG_ACTION_KEYS.GET_STATE: {
      return { ...state }
    }

    case BG_ACTION_KEYS.GET_CONFIG: {
      return config.getFullConfig()
    }

    case BG_ACTION_KEYS.SAVE_CONFIG: {
      Object.entries(action.data).map(([key, value]) => {
        config.set(key as keyof Config, value)
      })
      return
    }

    case BG_ACTION_KEYS.RESET_CONFIG: {
      config.reset()
      return
    }

    case BG_ACTION_KEYS.GET_IS_ACTIVE_TAB: {
      if (!sender.tab || typeof sender.tab.id === 'undefined') {
        return
      }
      return state.activeConnectorTabIdQueue[0] === sender.tab.id
    }

    case BG_ACTION_KEYS.REQUEST_BECOME_ACTIVE_TAB: {
      const id = Math.random()
      logger.debug(`Incoming REQUEST_BECOME_ACTIVE_TAB request ${id}`)
      if (!sender.tab || typeof sender.tab.id === 'undefined') {
        logger.debug(
          `Ignoring REQUEST_BECOME_ACTIVE_TAB request ${id} as sender.tab.id is not defined`,
        )
        return
      }

      // slice to create a new array
      const newQueue = state.activeConnectorTabIdQueue.slice()

      if (state.activeConnectorTabIdQueue.includes(sender.tab.id)) {
        if (action.data.force) {
          // remove the old one
          const index = newQueue.indexOf(sender.tab.id)
          newQueue.splice(index, 1)
          // the new one will be added below
        } else {
          await updateActiveConnectorTabIdQueue(state)
          return
        }
      }

      if (action.data.force) {
        // add to the front
        newQueue.unshift(sender.tab.id)
      } else {
        newQueue.push(sender.tab.id)
      }

      state.activeConnectorTabIdQueue = newQueue
      await updateActiveConnectorTabIdQueue(state)

      return
    }

    case BG_ACTION_KEYS.SAVE_TRACK_EDIT: {
      await edittedTracksManager.addEdittedTrack(action.data)
      await trackInfoCacheManager.delete(action.data)
      return
    }

    case BG_ACTION_KEYS.GET_TRACK_FROM_EDITTED_TRACKS: {
      return edittedTracksManager.getEdittedTrack(action.data)
    }

    case BG_ACTION_KEYS.GET_EDITTED_TRACKS: {
      // in try-catch as editted tracks might not be loaded yet
      try {
        return edittedTracksManager.getEdittedTracks()
      } catch (err) {
        console.error(err)
        return {}
      }
    }

    case BG_ACTION_KEYS.GET_SAVED_REGEXES: {
      // in try-catch as saved regexes might not be loaded yet
      try {
        return regexesManager.getSavedRegexes()
      } catch (err) {
        console.error(err)
        return []
      }
    }

    case BG_ACTION_KEYS.RESET_SAVED_REGEXES: {
      try {
        regexesManager.resetSavedRegexes()
      } catch (err) {
        console.error(err)
      }
      return
    }

    case BG_ACTION_KEYS.ADD_SAVED_REGEX: {
      regexesManager.addRegex(action.data.regex)
      return
    }

    case BG_ACTION_KEYS.UPDATE_SAVED_REGEX: {
      regexesManager.updateRegex(action.data.index, action.data.regex)
      return
    }

    case BG_ACTION_KEYS.APPLY_REGEXES_TO_SONGINFO: {
      return regexesManager.applyRegexesToSongInfo(action.data)
    }

    case BG_ACTION_KEYS.SAVE_FORCE_RECOGNISE_TRACK: {
      const { shouldForceRecognise, ...selector } = action.data
      if (shouldForceRecognise) {
        forceRecognitionTracksManager.addForcedRecognitionTrack(selector)
      } else {
        forceRecognitionTracksManager.removeForcedRecognitionTrack(selector)
      }
      return
    }

    case BG_ACTION_KEYS.GET_IF_FORCE_RECOGNISE_TRACK: {
      return forceRecognitionTracksManager.getIfTrackIsForcedRecognition(
        action.data,
      )
    }

    case BG_ACTION_KEYS.GET_TRACK_INFO_FROM_CACHE: {
      const { trackSelector, forceReload } = action.data
      if (forceReload) {
        await trackInfoCacheManager.delete(trackSelector)
        return false
      }
      return await trackInfoCacheManager.get(trackSelector)
    }

    case BG_ACTION_KEYS.ADD_OR_UPDATE_TRACK_INFO_IN_CACHE: {
      const { trackSelector, track } = action.data
      await trackInfoCacheManager.addOrUpdate(trackSelector, new Track(track))
      return
    }

    case BG_ACTION_KEYS.SEND_LOG: {
      return logger.outputEntryToConsole(action.data)
    }
  }
}
function handleMessageContainer(
  action: BgActionObject,
  sender: browser.Runtime.MessageSender,
  sendResponse: () => any, // eslint-disable-line @typescript-eslint/no-explicit-any
): true {
  handleMessage(action, sender).then(sendResponse)
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
  // expose session storage to content scripts
  /* Not supported yet by firefox
    await browser.storage.session.setAccessLevel(
      'TRUSTED_AND_UNTRUSTED_CONTEXTS',
    )
  */

  await browserStorage.init()

  edittedTracksManager = new EdittedTracksManager(browserStorage)
  regexesManager = new RegexesManager(browserStorage)
  forceRecognitionTracksManager = new ForceRecognitionTracksManager(
    browserStorage,
  )
  config = new ConfigContainer(browserStorage)
  stateManager = new StateManager(browserStorage)
  trackInfoCacheManager = new TrackInfoCacheManager(browserStorage)

  const scrobbler = config.get('scrobbler')
  switch (scrobbler) {
    case 'lastFm': {
      const lastfmSessionKey = config.get('lastfmSessionKey')
      if (!lastfmSessionKey) {
        config.set('scrobbler', null)
      } else {
        scrobblers.lastFm.setSessionKey(lastfmSessionKey)
      }
    }
  }
  setFullyLoaded(true)

  setInterval(async () => {
    const state = await stateManager.getState()
    updateActiveConnectorTabIdQueue(state)
  }, 5000)
}
main()

// according to mozilla docs, this listener must be top level
browser.runtime.onMessage.addListener(handleMessageContainer)
