import { waitForElement } from 'internals'
import type { ConnectorConfig } from 'interfaces'

import YoutubeConnector from '../Youtube'

import getYtVideoIdFromUrl from '../Youtube/util/getYtVideoIdFromUrl'

class InvidiousConnector extends YoutubeConnector {
  static connectorKey = 'invidious'

  scrobbleInfoLocationSelector = '#player-container ~ .h-box'
  scrobbleInfoStyle: Partial<CSSStyleDeclaration> = {
    marginTop: '-1em',
    marginBottom: '1.5em',
  }

  static youtubeWatchElement = '#player'

  static locationMatch(
    location: Location,
    connectorConfig: ConnectorConfig['invidious'],
  ) {
    const hosts: string[] = connectorConfig.hosts || []
    // temporary hotfix, should be configurable
    return hosts.some((host) => location.host.includes(host))
  }

  async getVideoElementSelector() {
    return '#player_html5_api'
  }

  async setupWatches(): Promise<HTMLElement> {
    const player = await waitForElement('#player')
    const video = await waitForElement('video', player)
    if (!player || !video) {
      throw new Error('Failed insidious connector setup')
    }
    this.player = player

    video.addEventListener('timeupdate', this.onStateChanged.bind(this, 'time'))
    video.addEventListener('play', this.onStateChanged.bind(this, 'play'))
    video.addEventListener('pause', this.onStateChanged.bind(this, 'pause'))
    video.addEventListener('seeked', this.onStateChanged.bind(this, 'seeked'))
    video.addEventListener('seeking', this.onStateChanged.bind(this, 'seeking'))

    const watchElement = (this.constructor as typeof YoutubeConnector)
      .youtubeWatchElement
    const el = await waitForElement(watchElement)
    if (!el) {
      throw new Error(`Could not setup watch, "${watchElement}" not found`)
    }
    // return element to further watch, BaseConnector will setup
    // the watch on this
    return el
  }

  getVideoId(): string {
    const id = getYtVideoIdFromUrl(window.location.href)
    if (id) {
      return id
    }
    throw new Error(`Id not found for url ${window.location.href}`)
  }

  async getCurrentTrackId(): Promise<string> {
    return this.getVideoId()
  }

  async isReady(): Promise<boolean> {
    return true
  }

  async isPlaying(): Promise<boolean> {
    const player = document.querySelector('#player')
    if (!player) {
      return false
    }
    return player.classList.contains('vjs-playing')
  }
}

export default InvidiousConnector
