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
    status: {
      uploadStatus: string
      privacyStatus: 'private' | 'public' | 'unlisted'
      license: string
      embeddable: boolean
      publicStatsViewable: boolean
      madeForKids: boolean
    }
  }>
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

interface ExtraInfo {
  whenFetched: Date
  data: {
    views?: number
    publishedAt?: Date
    privacyStatus?: 'private' | 'public' | 'unlisted'
  }
}

class YoutubeConnector extends BaseConnector {
  static connectorKey = 'youtube'

  player!: Element

  getters = getters
  postProcessors = postProcessors

  extraInfoCache: { [videoId: string]: ExtraInfo } = {}

  scrobbleInfoLocationSelector = '#primary #title.ytd-watch-metadata'
  scrobbleInfoStyle: Partial<CSSStyleDeclaration> = {
    fontSize: '1.17em',
    fontWeight: '700',
  }

  static youtubeWatchElement = '#content'
  static viewCountElement = '.view-count'

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  static locationMatch(location: Location, _connectorConfig: any) {
    return location.host.includes('youtube') && !location.href.includes('embed')
  }

  async getVideoElementSelector() {
    return '.html5-main-video'
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

  async getExtraInfo(): Promise<ExtraInfo['data']> {
    const videoId = this.getVideoId()
    if (this.extraInfoCache[videoId]) {
      // check if we have it in cache and if its still recent
      if (
        Date.now() - this.extraInfoCache[videoId].whenFetched.getTime() <
        10 * 60 * 1000 // 10 minutes
      ) {
        return this.extraInfoCache[videoId].data
      }
    }
    this.extraInfoCache[videoId] = {
      whenFetched: new Date(),
      data: {},
    }
    const extraInfo = this.extraInfoCache[videoId].data as ExtraInfo['data']

    const youtubeApiKey = this.config.youtubeApiKey

    if (youtubeApiKey) {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,status&id=${videoId}&key=${youtubeApiKey}`
      const result = (await fetch(url).then((response) =>
        response.json(),
      )) as YoutubeApiResult

      // if everything is as expected, return the result,
      // otherwise try and get the viewcount using the html
      if (result.items && result.items.length === 1) {
        extraInfo.privacyStatus = result.items[0].status.privacyStatus

        if (result.items[0].statistics.viewCount === undefined) {
          // views are hidden, no need to try the fallback method
          return extraInfo
        }

        extraInfo.views = Number(result.items[0].statistics.viewCount)
        extraInfo.publishedAt = new Date(result.items[0].snippet.publishedAt)
        return extraInfo
      }
    }

    // the fallback method
    let views, publishedAt
    try {
      const element = await waitForElement(
        (this.constructor as typeof YoutubeConnector).viewCountElement,
      )
      if (!element.textContent) {
        return {}
      }
      views = element.textContent.trim().split(' ')[0].replace(/[,.]/g, '')
    } catch (e) {
      return {}
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

    return { views: Number(views), publishedAt }
  }

  async getIsShort() {
    const url = `https://www.youtube.com/shorts/${this.getVideoId()}`
    const result = await fetch(url, { method: 'HEAD', redirect: 'manual' })
    return result.status === 200
  }

  async getIsPrivate() {
    const extraInfo = await this.getExtraInfo()
    if (!extraInfo.privacyStatus) {
      return null
    }
    return extraInfo.privacyStatus !== 'public'
  }

  async getPopularity() {
    const [extraInfo, isShort] = await Promise.all([
      this.getExtraInfo(),
      this.getIsShort(),
    ])

    if (!extraInfo.views) {
      // no views info
      return 0
    }

    if (isShort) {
      // a short, don't scrobble
      return -1
    }

    const basePopularity = Math.sqrt(Number(extraInfo.views))
    if (!extraInfo.publishedAt || !this.config.scrobblerCompensateForVideoAge) {
      return basePopularity
    }
    const daysOld =
      (new Date().getTime() - extraInfo.publishedAt.getTime()) /
      (1000 * 60 * 60 * 24)
    const ageCompenstation = Math.max(0.075, (daysOld * daysOld) / 10)

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
}

export default YoutubeConnector
