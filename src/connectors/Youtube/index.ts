import type { TimeInfo } from 'interfaces'
import { getElement, waitForElement } from 'internals'

import BaseConnector from '../../classes/BaseConnector/BaseConnector'

import getters from './getters'
import postProcessors from './postProcessors'
import getTextFromSelector from './util/getTextFromSelector'
import getYtVideoIdFromUrl from './util/getYtVideoIdFromUrl'

interface YoutubeApiResult {
  kind: string
  etag: string
  items: Array<{
    kind: string
    etag: string
    id: string
    snippet: {
      publishedAt: string
      channelId: string
      title: string
      description: string
      thumbnails: {
        default: {
          url: string
          width: number
          height: number
        }
        medium: {
          url: string
          width: number
          height: number
        }
        high: {
          url: string
          width: number
          height: number
        }
        standard: {
          url: string
          width: number
          height: number
        }
        maxres: {
          url: string
          width: number
          height: number
        }
      }
      channelTitle: string
      categoryId: string
      liveBroadcastContent: string
      defaultLanguage: string
      localized: {
        title: string
        description: string
      }
      defaultAudioLanguage: string
    }
    statistics: {
      viewCount: string
      likeCount: string
      favoriteCount: string
      commentCount: string
    }
  }>
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

class YoutubeConnector extends BaseConnector {
  static connectorKey = 'youtube'

  player!: Element

  getters = getters
  postProcessors = postProcessors

  static youtubeWatchElement = '#content'

  static locationMatch(location: Location) {
    return location.host.includes('youtube') && !location.href.includes('embed')
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

    const el = await waitForElement(
      (this.constructor as typeof YoutubeConnector).youtubeWatchElement,
    )
    if (!el) {
      throw new Error('Could not setup watch, "#content" not found')
    }
    // return element to further watch, BaseConnector will setup
    // the watch on this
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

    try {
      // this is where the video link is located for embeded
      const titleLinkElement = getElement('.ytp-title-link')
      if (titleLinkElement) {
        const id = getYtVideoIdFromUrl(
          titleLinkElement.getAttribute('href') as string,
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

  async shouldScrobble() {
    // block scrobbling when we can't get viewcount, for example: in shorts
    return (await this.getPopularity()) !== -1
  }

  async getTimeInfo(): Promise<TimeInfo> {
    const videoElement = await waitForElement<HTMLVideoElement>(
      '.html5-main-video',
    )
    const { currentTime, duration, playbackRate } = videoElement

    return { playTime: currentTime, duration, playbackRate }
  }

  async getViewCountAndAge(): Promise<
    { views: number; publishedAt?: Date; error: false } | { error: true }
  > {
    const youtubeApiKey = this.config.get('youtubeApiKey')

    if (youtubeApiKey) {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${this.getVideoId()}&key=${youtubeApiKey}`
      const result = (await fetch(url).then((response) =>
        response.json(),
      )) as YoutubeApiResult

      // if everything is as expected, return the result,
      // otherwise try and get the viewcount using the html
      if (result.items && result.items.length === 1) {
        const views = Number(result.items[0].statistics.viewCount)
        const publishedAt = new Date(result.items[0].snippet.publishedAt)
        return { views, publishedAt, error: false }
      }
    }

    // the fallback method
    let views, publishedAt
    try {
      const element = await waitForElement('.view-count')
      if (!element.textContent) {
        return { error: true }
      }
      views = element.textContent.trim().split(' ')[0].replace(/[,.]/g, '')
    } catch (e) {
      return { error: true }
    }
    try {
      const element = await waitForElement<HTMLMetaElement>(
        'meta[itemprop="datePublished"]',
      )
      const content = element.getAttribute('content')
      if (!content) {
        throw new Error('datePublished element has no content attribute')
      }
      publishedAt = new Date(content)
    } catch (e) {
      console.error(e)
    }

    return { views: Number(views), publishedAt, error: false }
  }

  async getIsShort() {
    const url = `https://www.youtube.com/shorts/${this.getVideoId()}`
    const result = await fetch(url, { method: 'HEAD', redirect: 'manual' })
    return result.status === 200
  }

  async getPopularity() {
    const [viewCountAndAge, isShort] = await Promise.all([
      this.getViewCountAndAge(),
      this.getIsShort(),
    ])

    if (viewCountAndAge.error) {
      return -1
    }

    // always return -1 for shorts, we shouldn't scrobble them
    if (isShort) {
      return -1
    }

    const basePopularity = Math.sqrt(Number(viewCountAndAge.views))
    if (
      !viewCountAndAge.publishedAt ||
      !this.config.get('scrobblerCompensateForVideoAge')
    ) {
      return basePopularity
    }
    const daysOld =
      (new Date().getTime() - viewCountAndAge.publishedAt.getTime()) /
      (1000 * 60 * 60 * 24)
    const ageCompenstation = Math.max(0.075, (daysOld * daysOld) / 100)

    // compensate for age of the video
    return basePopularity * Math.min(1, ageCompenstation)
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

  async getInfoBoxElement(): Promise<HTMLDivElement | null> {
    const parentEl = document.querySelector('#primary #title')
    if (!parentEl) {
      return null
    }

    // check if infoBoxEl was already created
    let infoBoxElement = document.querySelector<HTMLDivElement>(
      '#scrobbler-infobox-el',
    )

    // check if element is still in the correct place
    if (infoBoxElement) {
      if (infoBoxElement.parentElement !== parentEl) {
        infoBoxElement.remove()
      } else {
        return infoBoxElement
      }
    }

    // if it was not in the correct place or didn't exist, create it
    infoBoxElement = document.createElement('div')
    infoBoxElement.setAttribute('id', 'scrobbler-infobox-el')
    parentEl.appendChild(infoBoxElement)
    return infoBoxElement
  }
}

export default YoutubeConnector
