import type { Config } from 'interfaces'
import { BrowserStorage, notifyConnectors } from 'internals'

const DEBUG = Number(process.env.DEBUG) === 1 || false

export const defaultConfig: Config = {
  scrobbler: null,
  minimumScrobblerQuality: 100,
  scrobblerQualityDynamic: true,
  debug: DEBUG,
  youtubeApiKey: '',
  scrobblerCompensateForVideoAge: false,
  scrobblePrivateContent: false,
}

export class ConfigContainer {
  browserStorage: BrowserStorage
  config: Config

  constructor(browserStorage: BrowserStorage) {
    this.browserStorage = browserStorage

    this.config = this.browserStorage.getInSync('config')
  }

  async set<T extends keyof Config>(key: T, value: Config[T]) {
    this.config[key] = value
    await this.browserStorage.setInSync('config', this.config)
    notifyConnectors('configUpdated')
  }

  get<T extends keyof Config>(key: T): Config[T] {
    if (!this.config) {
      throw new Error('Tried to get config but it has not finished loading yet')
    }
    return this.config[key]
  }

  getFullConfig(): Config {
    if (!this.config) {
      throw new Error('Tried to get config but it has not finished loading yet')
    }
    return this.config
  }

  async reset() {
    if (!this.config) {
      throw new Error(
        'Tried to reset config but it has not finished loading yet',
      )
    }

    this.config = defaultConfig
    await this.browserStorage.setInSync('config', this.config)
    notifyConnectors('configUpdated')
  }
}

export default ConfigContainer
