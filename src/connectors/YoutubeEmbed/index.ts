import { waitForElement } from 'internals'

import YoutubeConnector from '../Youtube'

class YoutubeEmbedConnector extends YoutubeConnector {
  static connectorKey = 'youtube-embed'

  static youtubeWatchElement = '#player'

  static locationMatch(location: Location) {
    return location.host.includes('youtube') && location.href.includes('embed')
  }

  async getCurrentTrackId(): Promise<string> {
    await waitForElement('.ytp-title-link')
    return this.getVideoId()
  }

  async isReady(): Promise<boolean> {
    if (!this.isInAd()) {
      // we're ready!
      return true
    } else {
      return false
    }
  }
}

export default YoutubeEmbedConnector
