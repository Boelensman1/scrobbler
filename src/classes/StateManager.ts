import browser from 'webextension-polyfill'
import { initialState } from 'internals'
import type { State } from 'interfaces'

const handler = {
  set<T extends keyof State>(state: State, prop: T, value: State[T]) {
    const result = Reflect.set(state, prop, value)
    browser.storage.local.set({ state })
    return result
  },
}

type StaleState = State

const hydrateState = (state: StaleState): State => {
  return state
}

class StateManager {
  state?: State

  resetState(): State {
    if (!this.state) {
      throw new Error('Trying to reset unset state')
    }
    Object.assign(this.state, initialState)
    this.state = new Proxy(initialState, handler)

    return this.state
  }

  async getState(): Promise<State> {
    const { state } = await browser.storage.local.get()
    const proxiedState = new Proxy(hydrateState(state || initialState), handler)
    this.state = proxiedState

    return this.state
  }
}

export default StateManager
