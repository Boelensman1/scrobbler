import browser from 'webextension-polyfill'
import { ctActions } from 'internals'
import { ValueOf } from 'type-fest'

const sendActionToAllConnectors = async <T extends ValueOf<typeof ctActions>>(
  action: T,
  data?: Parameters<T>[2],
) => {
  const tabs = await browser.tabs.query({})

  for (let tab of tabs) {
    if (!tab.id) {
      continue
    }
    const result = await action.apply(null, [tab.id, data])
    if (result) {
      return result
    }
  }
  return null
}

export default sendActionToAllConnectors
