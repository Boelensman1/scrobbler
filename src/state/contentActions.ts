import browser from 'webextension-polyfill'
import type { CtActionObject, GetStillPlayingActionObject } from 'interfaces'

export const CT_ACTION_KEYS = {
  GET_STILL_PLAYING: 'GET_STILL_PLAYING' as 'GET_STILL_PLAYING',
}

const send = async <T extends CtActionObject, U = null>(
  tab: browser.Tabs.Tab,
  arg: T,
): Promise<U | null> => {
  if (tab.id) {
    try {
      // seperate, otherwise we can't catch the exception
      const result = await browser.tabs.sendMessage(tab.id, arg)
      return result
    } catch (e) {
      /* noop, tab is probably not listening */
    }
  }
  return null
}

const actions = {
  getStillPlaying: (tab: browser.Tabs.Tab, connectorId: string, _data?: any) =>
    send<GetStillPlayingActionObject, boolean>(tab, {
      type: CT_ACTION_KEYS.GET_STILL_PLAYING,
      connectorId,
    }),
}

export default actions
