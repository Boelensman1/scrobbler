import { Entries } from 'type-fest'

import _ from 'lodash'
import * as MetadataFilter from 'metadata-filter'

import type { Connector, PartialSongInfo, SongInfo, State } from 'interfaces'
import { actions } from 'internals'

const metadataFilter = MetadataFilter.createFilter(
  MetadataFilter.createFilterSetForFields(
    ['artist', 'track', 'album', 'albumArtist'],
    [(text) => text.trim(), MetadataFilter.replaceNbsp],
  ),
)
metadataFilter.append({ track: MetadataFilter.youtube })

const combineSongInfos = (
  id: string,
  songInfos: (PartialSongInfo | null)[],
): SongInfo[] => {
  const nonNullSongInfos = songInfos.filter(
    (songInfo) => !!songInfo,
  ) as PartialSongInfo[]

  const tracks = _.uniq(
    nonNullSongInfos.map(({ track }) => track).filter((t) => !!t),
  ) as string[]
  const artists = _.uniq(
    nonNullSongInfos.map(({ artist }) => artist).filter((a) => !!a),
  ) as string[]

  return tracks.flatMap((track) =>
    artists.map((artist) => ({
      id,
      track,
      artist,
    })),
  )
}

const applyMetadataFilter = (songInfo: PartialSongInfo): PartialSongInfo => {
  ;(Object.entries(songInfo) as Entries<typeof songInfo>).map(
    ([key, value]) => {
      if (!value) {
        return
      }
      songInfo[key] = metadataFilter.filterField(key, value) || value
    },
  )
  return songInfo
}

class ConnectorMiddleware {
  connector: Connector

  lastStateChange?: Date
  playTimeAtLastStateChange = 0
  connectorTrackId: any
  track?: any

  playTime = 0
  scrobbled = false

  constructor(connector: Connector) {
    this.connector = connector
  }

  async checkIfNewTrack() {
    const potentialNewTrackId = await this.connector.getCurrentTrackId()

    // we changed tracks
    if (this.connectorTrackId !== potentialNewTrackId) {
      this.connectorTrackId = potentialNewTrackId
      if (await this.connector.isPlaying()) {
        this.setTrackInStateIfNeeded()
      }
    }
  }

  async setTrackInStateIfNeeded() {
    const [potentialNewTrackId, state]: [string, State] = await Promise.all([
      this.connector.getCurrentTrackId(),
      actions.getState(),
    ])

    const stateTrackId = state.track?.connectorId
    if (stateTrackId !== potentialNewTrackId) {
      this.connectorTrackId = potentialNewTrackId
      this.newTrack()
    }
  }

  async setupNewTrackWatch(target: Element) {
    this.connectorTrackId = await this.connector.getCurrentTrackId()
    const observer = new MutationObserver(
      _.debounce(this.checkIfNewTrack.bind(this), 500, { maxWait: 1500 }),
    )
    const observerConfig = {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    }

    observer.observe(target, observerConfig)
  }

  async waitForReady(waitTime = 0): Promise<void> {
    if (waitTime > 20 * 1000) {
      throw new Error('Not ready after 20 seconds, giving up.')
    }

    const ready = await this.connector.isReady()

    if (ready) {
      // we're ready!
      return
    } else {
      // sleep 2s
      await new Promise((resolve) => setTimeout(resolve, 500))
      return this.waitForReady(waitTime + 500)
    }
  }

  async getSongInfoOptionsFromConnector() {
    let songInfos = (
      await Promise.all(
        this.connector.getters.map(async (getter) => {
          const songInfos = await getter(this.connector)
          return songInfos.map((songInfo) => applyMetadataFilter(songInfo))
        }),
      )
    )
      .flat()
      .filter((s) => !!s) // remove nulls

    songInfos = this.connector.postProcessors.reduce<PartialSongInfo[]>(
      (acc: PartialSongInfo[], postProcessor) => {
        acc = postProcessor(acc)
        return acc
      },
      songInfos as PartialSongInfo[],
    )

    return songInfos
  }

  async newTrack() {
    this.track = undefined
    this.playTime = 0
    this.playTimeAtLastStateChange = 0

    await actions.setLoadingNewTrack()

    await this.waitForReady()

    const [songInfos, timeInfo, popularity] = await Promise.all([
      this.getSongInfoOptionsFromConnector(),
      this.connector.getTimeInfo(),
      this.connector.getPopularity
        ? this.connector.getPopularity()
        : Promise.resolve(1),
    ])

    await actions.setTrackPlaying({
      songInfos: combineSongInfos(this.connectorTrackId, songInfos),
      timeInfo,
      location: window.location.href,
      popularity,
    })
  }

  async onStateChanged(type: 'time' | 'play' | 'pause' | 'seeking' | 'seeked') {
    const now = new Date()
    if (!this.lastStateChange) {
      this.lastStateChange = now
      await this.newTrack()
    } else {
      if (
        type === 'time' &&
        now.getTime() - this.lastStateChange.getTime() < 1000
      ) {
        // throttling
        return
      }

      if (type === 'play') {
        await this.setTrackInStateIfNeeded()
      }
    }

    if (type === 'play' || type === 'pause') {
      actions.setPlayState(type === 'play' ? 'PLAYING' : 'PAUSED')
    }

    const {
      playTime: currentTime,
      duration,
      playbackRate,
    } = await this.connector.getTimeInfo()

    if (type === 'seeking' || type === 'seeked') {
      this.playTimeAtLastStateChange = currentTime
      return
    }

    this.playTime += Math.max(
      0,
      Math.min(2, currentTime - this.playTimeAtLastStateChange),
    )
    this.playTimeAtLastStateChange = currentTime

    // detect replays
    if (duration && this.playTime > duration) {
      const alreadyPlayed = this.playTime - duration
      await this.newTrack()
      this.playTime += alreadyPlayed
    }

    actions.setPlayTime({
      playTime: this.playTime,
      duration,
      playbackRate,
    })

    this.lastStateChange = now
  }
}

export default ConnectorMiddleware
