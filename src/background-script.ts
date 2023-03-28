import browser from 'webextension-polyfill'
import {
  ConfigContainer,
  EdittedTracksManager,
  BG_ACTION_KEYS,
  StateManager,
  ctActions,
} from 'internals'

import type { Config, BgActionObject } from 'interfaces'

import scrobblers from './scrobblerList'

const config = new ConfigContainer()
const stateManager = new StateManager()
const edittedTracksManager = new EdittedTracksManager()

// setFullyLoaded is called after init (in main)
let setFullyLoaded: (val: true) => void
const fullyLoaded = new Promise((resolve) => (setFullyLoaded = resolve))

async function handleMessage(
  action: BgActionObject,
  sender: browser.Runtime.MessageSender,
) {
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
      return state.activeConnectorTabId === sender.tab.id
    }

    case BG_ACTION_KEYS.REQUEST_BECOME_ACTIVE_TAB: {
      if (!sender.tab || typeof sender.tab.id === 'undefined') {
        return
      }

      if (state.activeConnectorTabId === sender.tab.id) {
        return
      }

      // no activeConnectorTab set
      if (state.activeConnectorTabId === null || action.data.force) {
        state.activeConnectorTabId = sender.tab.id
        return
      }

      const isStillPlaying = await ctActions.getStillPlaying(
        state.activeConnectorTabId,
      )
      if (!isStillPlaying) {
        state.activeConnectorTabId = sender.tab.id
      }

      return
    }

    case BG_ACTION_KEYS.SAVE_TRACK_EDIT: {
      edittedTracksManager.addEdittedTrack(action.data)
      return
    }

    case BG_ACTION_KEYS.GET_TRACK_FROM_EDITTED_TRACKS: {
      return edittedTracksManager.getEdittedTrack(action.data)
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
  await config.loadConfig()
  await edittedTracksManager.loadEdittedTracks()

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
  setFullyLoaded(true)
}
main()

// according to mozilla docs, this listener must be top level
browser.runtime.onMessage.addListener(handleMessageContainer)
