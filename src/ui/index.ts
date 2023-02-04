import browser from 'webextension-polyfill'

import type { Config } from '../interfaces'
import { actions } from 'internals'

const auth = document.getElementById('auth')!

auth.onclick = () => {
  browser.runtime.sendMessage({
    type: actions.REQUEST_AUTHENTICATION,
  })
}

const resetConfig = document.getElementById('resetConfig')!

resetConfig.onclick = () => {
  browser.runtime.sendMessage({
    type: actions.RESET_CONFIG,
  })
}

const saveConfig = document.getElementById('saveConfig')!
const minimumScrobblerQualityInput = document.getElementById(
  'minimumScrobblerQuality',
) as HTMLInputElement

saveConfig.onclick = () => {
  browser.runtime.sendMessage({
    type: actions.SAVE_CONFIG,
    data: {
      minimumScrobblerQuality: Number(minimumScrobblerQualityInput.value),
    },
  })
}

const main = async () => {
  const config = (await browser.runtime.sendMessage({
    type: actions.GET_CONFIG,
  })) as Config
  minimumScrobblerQualityInput.value = String(config.minimumScrobblerQuality)
}

main()
