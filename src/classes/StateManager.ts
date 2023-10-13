import { BrowserStorage, initialState } from 'internals'
import type { State } from 'interfaces'

class StateManager {
  state?: State
  browserStorage: BrowserStorage

  proxyHandler = { set: this.proxyHandlerSet.bind(this) }

  constructor(browserStorage: BrowserStorage) {
    this.browserStorage = browserStorage
  }

  init() {
    const state = this.browserStorage.getInLocal('state')
    this.state = new Proxy(state, this.proxyHandler)
  }

  proxyHandlerSet<T extends keyof State>(
    state: State,
    prop: T,
    value: State[T],
  ) {
    const result = Reflect.set(state, prop, value)
    this.browserStorage.setInLocal('state', state)
    return result
  }

  resetState(): State {
    if (!this.state) {
      throw new Error('Trying to reset unset state')
    }
    Object.assign(this.state, initialState)
    this.state = new Proxy(initialState, this.proxyHandler)
    this.browserStorage.setInLocal('state', initialState)

    return this.state
  }

  async getState(): Promise<State> {
    const state = this.browserStorage.getInLocal('state')
    const proxiedState = new Proxy(state || initialState, this.proxyHandler)
    this.state = proxiedState

    return this.state
  }
}

export default StateManager
