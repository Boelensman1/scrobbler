import type { Connector, ConnectorStatic, TimeInfo } from 'interfaces'
import { ConnectorMiddleware, getElement, waitForElement } from 'internals'

import getters from './getters'
import postProcessors from './postProcessors'
import getTextFromSelector from './util/getTextFromSelector'
import getYtVideoIdFromUrl from './util/getYtVideoIdFromUrl'

function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

const numberAbbreviations = {
  K: 1000,
  M: 1000 * 1000,
  B: 1000 * 1000 * 1000,
}

const toFullNumber = (input: string): number => {
  if (!Number.isNaN(Number(input))) {
    return Number(input)
  }
  const abbreviation = input.charAt(
    input.length - 1,
  ) as keyof typeof numberAbbreviations

  if (!numberAbbreviations[abbreviation]) {
    throw new Error(`Abbreviation ${abbreviation} not found`)
  }

  return (
    Number(input.substring(0, input.length - 1)) *
    numberAbbreviations[abbreviation]
  )
}

@staticImplements<ConnectorStatic>()
class YoutubeConnector implements Connector {
  player!: Element
  connectorMiddleware: ConnectorMiddleware

  getters = getters

  postProcessors = postProcessors

  constructor() {
    this.connectorMiddleware = new ConnectorMiddleware(this)
  }

  static hostMatch(host: string) {
    return host.includes('youtube')
  }

  async setup() {
    const player = document.querySelector('.html5-video-player')
    const video = player?.querySelector('video')
    if (!player || !video) {
      return
    }
    this.player = player

    video.addEventListener(
      'timeupdate',
      this.connectorMiddleware.onStateChanged.bind(
        this.connectorMiddleware,
        'time',
      ),
    )
    video.addEventListener(
      'play',
      this.connectorMiddleware.onStateChanged.bind(
        this.connectorMiddleware,
        'play',
      ),
    )
    video.addEventListener(
      'pause',
      this.connectorMiddleware.onStateChanged.bind(
        this.connectorMiddleware,
        'pause',
      ),
    )
    video.addEventListener(
      'seeking',
      this.connectorMiddleware.onStateChanged.bind(
        this.connectorMiddleware,
        'seeking',
      ),
    )

    const el = document.querySelector('#content')
    if (!el) {
      throw new Error('Could not setup watch, "#content" not found')
    }
    await this.connectorMiddleware.setupNewTrackWatch(el)
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

  async isPlaying() {
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

    return { currentTime, duration, playbackRate }
  }

  async getPopularity() {
    try {
      const element = await waitForElement<any>(
        '#info-container yt-formatted-string span',
      )
      let [views] = element.textContent.split(' ')
      views = toFullNumber(views)
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
