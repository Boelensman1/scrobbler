import type { TimeInfo } from 'interfaces'
import { getElement, waitForElement } from 'internals'

import BaseConnector from '../../classes/BaseConnector/BaseConnector'

import getters from './getters'
import postProcessors from './postProcessors'
import getTextFromSelector from './util/getTextFromSelector'
import getYtVideoIdFromUrl from './util/getYtVideoIdFromUrl'

class YoutubeConnector extends BaseConnector {
  player!: Element

  getters = getters
  postProcessors = postProcessors

  static hostMatch(host: string) {
    return host.includes('youtube')
  }

  async setupWatches(): Promise<HTMLElement> {
    const player = await waitForElement('.html5-video-player')
    const video = await waitForElement('video', player)
    if (!player || !video) {
      throw new Error('Failed youtube connector setup')
    }
    this.player = player

    video.addEventListener('timeupdate', this.onStateChanged.bind(this, 'time'))
    video.addEventListener('play', this.onStateChanged.bind(this, 'play'))
    video.addEventListener('pause', this.onStateChanged.bind(this, 'pause'))
    video.addEventListener('seeked', this.onStateChanged.bind(this, 'seeked'))
    video.addEventListener('seeking', this.onStateChanged.bind(this, 'seeking'))

    const el = await waitForElement('#content')
    if (!el) {
      throw new Error('Could not setup watch, "#content" not found')
    }
    // return element to further watch, BaseConnector will setup the watch on this
    return el
  }

  async getCurrentTrackId(): Promise<string> {
    await waitForElement('ytd-watch-flexy')
    return this.getVideoId()
  }

  getVideoId(): string {
    try {
      /*
       * ytd-watch-flexy element contains ID of a first played video
       * if the miniplayer is visible, so we should check
       * if URL of a current video in miniplayer is accessible.
       */
      const miniPlayerElement = getElement(
        'ytd-miniplayer[active] [selected] a',
      )
      if (miniPlayerElement) {
        const id = getYtVideoIdFromUrl(
          miniPlayerElement.getAttribute('href') as string,
        )
        if (id) {
          return id
        }
      }
    } catch (err) {
      /* noop */
    }

    return getElement('ytd-watch-flexy').getAttribute('video-id') as string
  }

  async isReady(): Promise<boolean> {
    await waitForElement('ytd-watch-flexy')

    if (!this.isInAd()) {
      // we're ready!
      return true
    } else {
      return false
    }
  }

  isInAd() {
    return !!document.querySelector('.ad-showing')
  }

  async isPlaying(): Promise<boolean> {
    const player = document.querySelector('.html5-video-player')
    if (!player) {
      return false
    }
    return player.classList.contains('playing-mode')
  }

  async getTimeInfo(): Promise<TimeInfo> {
    const videoElement = await waitForElement<HTMLVideoElement>(
      '.html5-main-video',
    )
    let { currentTime, duration, playbackRate } = videoElement

    return { playTime: currentTime, duration, playbackRate }
  }

  override async getPopularity() {
    try {
      const element = await waitForElement('.view-count')
      const views = element
        .textContent!.trim()
        .split(' ')[0]
        .replace(/[,.]/g, '')

      return Math.sqrt(Number(views))
    } catch (e) {
      return 1
    }
  }

  async areChaptersAvailable() {
    const chapterNameSelector = '.html5-video-player .ytp-chapter-title-content'
    const text = getTextFromSelector(chapterNameSelector)

    // SponsorBlock extension hijacks chapter element. Ignore it.
    if (
      document.querySelector(
        '.ytp-chapter-title-content.sponsorBlock-segment-title',
      )
    ) {
      return false
    }

    // Return the text if no sponsorblock text.
    return text
  }
}

export default YoutubeConnector
