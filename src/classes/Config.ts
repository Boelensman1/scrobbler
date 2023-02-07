import browser from 'webextension-polyfill'
import type { Config } from 'interfaces'

export const defaultConfig: Config = {
  scrobbler: null,
  minimumScrobblerQuality: 100,
  scrobblerQualityDynamic: true,
}

export class ConfigContainer {
  loaded = false

  config?: Config

  async loadConfig() {
    let { config } = await browser.storage.sync.get()

    if (!config) {
      config = defaultConfig
      await browser.storage.sync.set({ config })
    }
    this.config = config as Config
    this.loaded = true
  }

  async set<T extends keyof Config>(key: T, value: Config[T]) {
    if (!this.loaded) {
      throw new Error('Tried to set config but it has not finished loading yet')
    }

    this.config![key] = value
    await browser.storage.sync.set({ config: this.config! })
  }

  get<T extends keyof Config>(key: T): Config[T] {
    if (!this.loaded) {
      throw new Error('Tried to get config but it has not finished loading yet')
    }
    return this.config![key]
  }

  getFullConfig(): Config {
    if (!this.loaded) {
      throw new Error('Tried to get config but it has not finished loading yet')
    }
    return this.config!
  }

  async reset() {
    if (!this.loaded) {
      throw new Error(
        'Tried to reset config but it has not finished loading yet',
      )
    }

    this.config = defaultConfig
    await browser.storage.sync.set({ config: this.config })
  }
}

export default ConfigContainer
