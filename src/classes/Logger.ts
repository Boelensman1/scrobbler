import browser from 'webextension-polyfill'
import { bgActions } from 'internals'
import type { LogEntryPayload } from 'interfaces'

const LEVEL_TRACE = 10
const LEVEL_DEBUG = 20
const LEVEL_INFO = 30
/*
const LEVEL_WARN = 40
const LEVEL_ERROR = 50
*/

const OUTPUT_LEVEL = LEVEL_DEBUG
const ADD_TIMEINFO = false

class Logger {
  private identifier: string
  backgroundLocation: string

  constructor(identifier: string) {
    this.identifier = identifier
    this.backgroundLocation = ''

    // @ts-expect-error the typings of .background seem to be wrong
    const backgroundLoc = browser.runtime.getManifest().background.scripts[0]
    this.backgroundLocation = backgroundLoc
  }

  setIdentifier(identifier: string) {
    this.identifier = identifier
  }

  inBackgroundScript(): boolean {
    try {
      browser.runtime.getBackgroundPage()
    } catch (err) {
      return false
    }
    return true
  }

  outputEntryToConsole(entryData: LogEntryPayload) {
    const { identifier, level, msg, data, ts } = entryData
    if (level < OUTPUT_LEVEL) {
      return
    }

    const timeInfo = ADD_TIMEINFO ? `${new Date(ts).toISOString()} - ` : ''
    const label = `${timeInfo}[${identifier}] ${msg}`
    if (data) {
      console.groupCollapsed(label)
      console.log(JSON.parse(data))
      console.groupEnd()
      console.groupEnd()
    } else {
      console.log(label)
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private sendLog(level: number, msg: string, data?: any) {
    const payload: LogEntryPayload = {
      identifier: this.identifier,
      level,
      msg,
      data: JSON.stringify(data),
      ts: Date.now(),
    }

    if (this.inBackgroundScript()) {
      this.outputEntryToConsole(payload)
    } else {
      bgActions.sendLog(payload)
    }
  }

  trace(msg: string, data?: any) {
    this.sendLog(LEVEL_TRACE, msg, data)
  }
  debug(msg: string, data?: any) {
    this.sendLog(LEVEL_DEBUG, msg, data)
  }
  info(msg: string, data?: any) {
    this.sendLog(LEVEL_INFO, msg, data)
  }
}

export default Logger
