import browser from 'webextension-polyfill'
import { ctActions } from 'internals'
import { ValueOf } from 'type-fest'

const sendActionToConnector = async <T extends ValueOf<typeof ctActions>>(
  connectorId: string,
  action: T,
  data?: Parameters<T>[2],
) => {
  const tabs = await browser.tabs.query({})

  for (let tab of tabs) {
    const result = await action.apply(null, [tab, connectorId, data])
    if (result) {
      return result
    }
  }
  return null
}

export default sendActionToConnector
