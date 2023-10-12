// exported here as we get circular dependencies otherwise
export { default as Logger } from './classes/Logger'

// state
export { default as initialState } from './state/initialState'
export { default as bgActions, BG_ACTION_KEYS } from './state/backgroundActions'
export { default as ctActions, CT_ACTION_KEYS } from './state/contentActions'
export { default as scrobbleStates } from './state/scrobbleStates'

// informationProviders
export { default as MusicBrainzInformationProvider } from './informationProviders/MusicBrainz'
export { default as CoverArtArchiveInformationProvider } from './informationProviders/CoverArtArchive'

// util
export { default as getElement } from './util/getElement'

// connectors
export { default as YoutubeConnector } from './connectors/Youtube'
export { default as YoutubeEmbedConnector } from './connectors/YoutubeEmbed'

export { default as waitForElement } from './util/waitForElement'
export { default as notifyConnectors } from './util/notifyConnectors'

// classes
export { default as Artist } from './classes/Artist'
export { default as ConfigContainer, defaultConfig } from './classes/Config'
export { default as Track } from './classes/Track'
export { default as StateManager } from './classes/StateManager'
export { default as BaseConnector } from './classes/BaseConnector/BaseConnector'

export { default as EdittedTracksManager } from './classes/EdittedTracksManager'
export {
  default as RegexesManager,
  hydrate as hydrateSavedRegexes,
  deHydrate as deHydrateSavedRegexes,
} from './classes/RegexesManager'
export {
  default as ForceRecognitionTracksManager,
  hydrate as hydrateForceRecognitionTracks,
  deHydrate as deHydrateForceRecognitionTracks,
} from './classes/ForceRecognitionTracksManager'
export {
  default as TrackInfoCacheManager,
  hydrate as hydrateTrackInfoCache,
  deHydrate as deHydrateTrackInfoCache,
} from './classes/TrackInfoCacheManager'

export { default as BrowserStorage } from './classes/BrowserStorage'

// scrobblers
export { default as LastFm } from './scrobblers/lastFm'
