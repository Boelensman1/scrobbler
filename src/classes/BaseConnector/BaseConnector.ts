import browser from 'webextension-polyfill'
import _ from 'lodash'

import type {
  Connector,
  Getter,
  PostProcessor,
  TimeInfo,
  CtActionObject,
  SongInfo,
  ConnectorTrackId,
  PartialSongInfo,
  ConnectorStatic,
} from 'interfaces'
import {
  ConfigContainer,
  LastFm,
  bgActions,
  CT_ACTION_KEYS,
  scrobbleStates,
  Track,
} from 'internals'

import combineSongInfos from './utils/combineSongInfos'
import canForceScrobble from './utils/canForceScrobble'
import getAdditionalDataFromInfoProviders from './utils/getAdditionalDataFromInfoProviders'
import applyMetadataFilter from './utils/applyMetadataFilter'

// removes duplicates in strings, so for example:
// track: aaaaa bbbb, artist: aaaaa -> track bbbb, artist aaaaa
const removeDuplicateStringsPostprocessor: PostProcessor = (
  songInfos: PartialSongInfo[],
): PartialSongInfo[] => {
  // we don't check if the artist or w/e we're replacing is actually in the string, as during the combine songinfo's phase any duplicates will be removed anyway
  const additonal: PartialSongInfo[] = []
  songInfos.forEach((songInfo) => {
    if (songInfo.artist) {
      if (songInfo.track) {
        // check that "enough" info remains
        if (songInfo.track.length > songInfo.artist.length + 3)
          additonal.push({
            ...songInfo,
            track: songInfo.track.replace(songInfo.artist + ' ', '').trim(),
          })
      }
      if (songInfo.album) {
        // check that "enough" info remains
        if (songInfo.album.length > songInfo.artist.length + 3)
          additonal.push({
            ...songInfo,
            album: songInfo.album.replace(songInfo.artist + ' ', '').trim(),
          })
      }
    }

    if (songInfo.track) {
      if (songInfo.artist) {
        // check that "enough" info remains
        if (songInfo.artist.length > songInfo.track.length + 3)
          additonal.push({
            ...songInfo,
            track: songInfo.track.replace(songInfo.artist + ' ', '').trim(),
          })
      }
      if (songInfo.album) {
        // check that "enough" info remains
        if (songInfo.album.length > songInfo.track.length + 3)
          additonal.push({
            ...songInfo,
            album: songInfo.album.replace(songInfo.track + ' ', '').trim(),
          })
      }
    }

    if (songInfo.album) {
      if (songInfo.artist) {
        // check that "enough" info remains
        if (songInfo.artist.length > songInfo.album.length + 3)
          additonal.push({
            ...songInfo,
            artist: songInfo.artist.replace(songInfo.album + ' ', '').trim(),
          })
      }
      if (songInfo.track) {
        // check that "enough" info remains
        if (songInfo.track.length > songInfo.album.length + 3)
          additonal.push({
            ...songInfo,
            track: songInfo.track.replace(songInfo.album + ' ', '').trim(),
          })
      }
    }
  })

  return [...songInfos, ...additonal]
}

abstract class BaseConnector implements Connector {
  scrobbler: LastFm
  config: ConfigContainer

  lastStateChange?: Date
  playTimeAtLastStateChange = 0
  connectorTrackId: ConnectorTrackId | null = null
  startedPlaying: Date = new Date()
  sendNowPlaying = false

  playTime = 0
  track: Track | null = null
  scrobbleState: keyof typeof scrobbleStates =
    scrobbleStates.TRACK_NOT_RECOGNISED
  minimumScrobblerQuality: number = Number.MAX_SAFE_INTEGER
  scrobbleAt = 4 * 60
  trackDuration?: number = Number.MAX_SAFE_INTEGER
  searchQueryList: SongInfo[] = []

  abstract getters: Getter[]
  abstract postProcessors: PostProcessor[]

  constructor(scrobbler: LastFm, config: ConfigContainer) {
    this.scrobbler = scrobbler
    this.config = config
  }

  abstract setupWatches(): Promise<HTMLElement>
  abstract isPlaying(): Promise<boolean>
  abstract isReady(): Promise<boolean>
  abstract getTimeInfo(): Promise<TimeInfo>
  abstract getCurrentTrackId(): Promise<ConnectorTrackId | null>

  async getPopularity() {
    return 1
  }

  async setup() {
    const elementToWatch = await this.setupWatches()
    if (elementToWatch) {
      const observer = new MutationObserver(
        _.debounce(this.newTrack.bind(this), 500, { maxWait: 1500 }),
      )
      const observerConfig = {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      }

      observer.observe(elementToWatch, observerConfig)
    }

    browser.runtime.onMessage.addListener(this.handleMessage.bind(this))
  }

  async shouldScrobble() {
    // if needed, a connector should override this
    return true
  }

  async getScrobbleState(): Promise<keyof typeof scrobbleStates> {
    if (!(await this.shouldScrobble())) {
      return scrobbleStates.BLOCKED_BY_CONNECTOR
    }

    if (this.scrobbleState === scrobbleStates.SCROBBLED) {
      // we already scrobbled
      return scrobbleStates.SCROBBLED
    }

    if (!this.track) {
      return scrobbleStates.TRACK_NOT_RECOGNISED
    }

    if (
      this.trackDuration &&
      this.trackDuration <=
        // according to last.fm api docs, we shouldn't scrobble tracks shorter than 30 seconds
        30
    ) {
      return scrobbleStates.TRACK_TOO_SHORT
    }

    if (this.track.scrobblerMatchQuality < this.minimumScrobblerQuality) {
      return scrobbleStates.BELOW_MIN_SCROBBLER_QUALITY
    }

    return scrobbleStates.WILL_SCROBBLE
  }

  async handleMessage(action: CtActionObject) {
    switch (action.type) {
      case CT_ACTION_KEYS.GET_STILL_PLAYING: {
        const isPlaying = await this.isPlaying()
        return isPlaying
      }

      case CT_ACTION_KEYS.GET_CONNECTOR_STATE: {
        return {
          playTime: this.playTime,
          track: this.track,
          scrobbleState: this.scrobbleState,
          minimumScrobblerQuality: this.minimumScrobblerQuality,
          scrobbleAt: this.scrobbleAt,
          trackDuration: this.trackDuration,
          searchQueryList: this.searchQueryList,
        }
      }

      case CT_ACTION_KEYS.TOGGLE_DISABLE_SCROBBLE_CURRENT: {
        if (this.scrobbleState != scrobbleStates.MANUALLY_DISABLED) {
          if (canForceScrobble(this.scrobbleState)) {
            this.scrobbleState = scrobbleStates.MANUALLY_DISABLED
          }
        } else {
          this.scrobbleState = await this.getScrobbleState()
        }
        return
      }

      case CT_ACTION_KEYS.FORCE_SCROBBLE_CURRENT: {
        if (canForceScrobble(this.scrobbleState)) {
          this.scrobbleState = scrobbleStates.FORCE_SCROBBLE
        } else {
          const [bestOption] = this.searchQueryList
          // manually add the track to force scrobble
          this.track = new Track({
            name: bestOption.track,
            artist: bestOption.artist,
            scrobblerMatchQuality: -2,
            scrobblerLinks: {},
          })
          this.scrobbleState = scrobbleStates.FORCE_SCROBBLE
        }
        return
      }

      case CT_ACTION_KEYS.SAVE_TRACK_EDIT: {
        if (this.scrobbleState !== scrobbleStates.MANUALLY_DISABLED) {
          this.scrobbleState = scrobbleStates.SEARCHING
        }
        this.track = null

        const track = await this.scrobbler.getTrack({
          track: action.data.editValues.track.trim(),
          artist: action.data.editValues.artist.trim(),
        })

        if (track) {
          await getAdditionalDataFromInfoProviders(track)

          this.track = track
        }
        if (this.scrobbleState !== scrobbleStates.MANUALLY_DISABLED) {
          this.scrobbleState = await this.getScrobbleState()
        }

        // save!
        if (this.connectorTrackId) {
          bgActions.saveTrackEdit({
            connectorKey: (this.constructor as ConnectorStatic).connectorKey,
            connectorTrackId: this.connectorTrackId,
            edittedSongInfo: track
              ? {
                  track: track.name,
                  artist: track.artist,
                  album: track.album,
                }
              : {
                  track: action.data.editValues.track.trim(),
                  artist: action.data.editValues.artist.trim(),
                },
          })
        }

        return
      }
    }
  }

  resetTrack() {
    this.startedPlaying = new Date()
    this.playTime = 0
    this.playTimeAtLastStateChange = 0
    this.track = null
    this.scrobbleState = scrobbleStates.SEARCHING
  }

  async waitForReady(waitTime = 0): Promise<void> {
    if (waitTime > 120 * 1000) {
      throw new Error('Not ready after 120 seconds, giving up.')
    }

    const ready = await this.isReady()

    if (ready) {
      // we're ready!
      return
    } else {
      // sleep 2s
      await new Promise((resolve) => setTimeout(resolve, 500))
      return this.waitForReady(waitTime + 500)
    }
  }

  async getSongInfoOptionsFromConnector(): Promise<PartialSongInfo[]> {
    let partialSongInfos = (
      await Promise.all(
        this.getters.map(async (getter) => {
          const songInfos = await getter(this)
          return songInfos.map((songInfo) => applyMetadataFilter(songInfo))
        }),
      )
    )
      .flat()
      .filter((s): s is PartialSongInfo => !!s) // remove nulls

    partialSongInfos = this.postProcessors
      .reduce<PartialSongInfo[]>((acc: PartialSongInfo[], postProcessor) => {
        acc = postProcessor(acc)
        return acc
      }, partialSongInfos)
      .map(applyMetadataFilter)

    // apply regexes
    partialSongInfos = (
      await Promise.all(partialSongInfos.map(bgActions.applyRegexesToSongInfo))
    ).map(applyMetadataFilter)

    // final post processor that removes duplicates
    partialSongInfos =
      removeDuplicateStringsPostprocessor(partialSongInfos).map(
        applyMetadataFilter,
      )

    partialSongInfos = this.postProcessors
      .reduce<PartialSongInfo[]>((acc: PartialSongInfo[], postProcessor) => {
        acc = postProcessor(acc)
        return acc
      }, partialSongInfos)
      .map(applyMetadataFilter)

    return partialSongInfos
  }

  async newTrack(): Promise<Track | null> {
    await this.waitForReady()

    // check if we actually changed tracks
    const potentialNewTrackId = await this.getCurrentTrackId()

    // we did not change tracks
    if (this.connectorTrackId === potentialNewTrackId) {
      return this.track
    }
    await bgActions.setLoadingNewTrack()

    this.resetTrack()
    this.connectorTrackId = potentialNewTrackId

    // check if we have this song saved as editted
    let songInfoFromSavedEdits: SongInfo | false = false
    if (this.connectorTrackId) {
      songInfoFromSavedEdits = await bgActions.getTrackFromEdittedTracks({
        connectorKey: (this.constructor as ConnectorStatic).connectorKey,
        connectorTrackId: this.connectorTrackId,
      })
    }

    // no check for songInfoFromSavedEdits as even if we have this song as a
    // saved edit, we still want to get all info so we have the list in case
    // more edits have to be made
    const [partialSongInfos, timeInfo, popularity] = await Promise.all([
      this.getSongInfoOptionsFromConnector(),
      this.getTimeInfo(),
      this.getPopularity ? this.getPopularity() : Promise.resolve(1),
    ])

    this.trackDuration = timeInfo.duration

    // From last.fm docs, scrobbling should occur when: the track has been played for at least half its duration, or for 4 minutes (whichever occurs earlier.)
    this.scrobbleAt = Math.min(
      60 * 4,
      timeInfo.duration ? timeInfo.duration / 2 : 9999,
    )

    this.minimumScrobblerQuality =
      this.config.get('minimumScrobblerQuality') *
      (this.config.get('scrobblerQualityDynamic') ? popularity / 200 : 1)

    const songInfos = combineSongInfos(partialSongInfos)

    let track
    if (songInfoFromSavedEdits) {
      track = await this.scrobbler.getTrack(songInfoFromSavedEdits)

      // save searchQuery so we can edit it
      songInfoFromSavedEdits.matchQuality = -2 // -2 is the magic number that will be displayed as 'editted'
      this.searchQueryList = [songInfoFromSavedEdits, ...songInfos]
    } else {
      const tracks: (Track | null)[] = await Promise.all(
        songInfos.map((songInfo: SongInfo) =>
          this.scrobbler.getTrack(songInfo),
        ),
      )

      const searchResults = tracks.filter((t) => !!t) as Track[]
      // get the track with the highest 'match quality'
      // match quality for last.fm is defined as # of listeners
      track = searchResults.sort(
        (track1: Track, track2: Track) =>
          track2.scrobblerMatchQuality - track1.scrobblerMatchQuality,
      )[0]

      // save searchQuery so we can edit it
      this.searchQueryList = tracks.map((track, i) =>
        track ? track.toSongInfo() : songInfos[i],
      )
    }

    if (track) {
      await getAdditionalDataFromInfoProviders(track)
      this.track = track
    }

    this.scrobbleState = await this.getScrobbleState()
    return this.track
  }

  async onStateChanged(type: 'time' | 'play' | 'pause' | 'seeking' | 'seeked') {
    const now = new Date()
    if (!this.lastStateChange) {
      this.lastStateChange = now
      await bgActions.requestBecomeActiveTab(false)
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
        await bgActions.requestBecomeActiveTab(false)
      }
    }

    const { playTime: currentTime, duration } = await this.getTimeInfo()

    if (type === 'seeking' || type === 'seeked') {
      this.playTimeAtLastStateChange = currentTime
      return
    }

    // Math.min here, just in case things go wrong and we start jumping in time
    // which could result in scrobbles in very quick succession via the
    // replay detection
    this.playTime += Math.min(5, currentTime - this.playTimeAtLastStateChange)
    this.playTimeAtLastStateChange = currentTime

    // detect replays
    if (duration && this.playTime > duration) {
      // partial reset
      this.playTime = 0
      this.playTimeAtLastStateChange = 0
      if (this.scrobbleState !== scrobbleStates.MANUALLY_DISABLED) {
        this.scrobbleState = scrobbleStates.TRACK_NOT_RECOGNISED
      }
      this.scrobbleState = await this.getScrobbleState()
    }

    this.lastStateChange = now

    // if we're the active tab, see if we can scrobble
    if (!(await bgActions.getIsActiveTab())) {
      return
    }

    if (
      this.track &&
      (this.scrobbleState === scrobbleStates.WILL_SCROBBLE ||
        this.scrobbleState === scrobbleStates.FORCE_SCROBBLE)
    ) {
      if (this.sendNowPlaying === false) {
        this.sendNowPlaying = true

        this.scrobbler.setNowPlaying(this.track)
      }

      if (
        this.playTime > this.scrobbleAt ||
        this.scrobbleState === scrobbleStates.FORCE_SCROBBLE
      ) {
        this.scrobbleState = scrobbleStates.SCROBBLED
        if (this.scrobbler) {
          this.scrobbler.scrobble(this.track, this.startedPlaying)
        }
      }
    }
  }
}

export default BaseConnector
