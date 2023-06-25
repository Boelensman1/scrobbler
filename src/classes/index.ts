export { default as Artist } from './Artist'
export { default as ConfigContainer, defaultConfig } from './Config'
export { default as Track } from './Track'
export { default as StateManager } from './StateManager'
export { default as BaseConnector } from './BaseConnector/BaseConnector'

export { default as EdittedTracksManager } from './EdittedTracksManager'
export {
  default as RegexesManager,
  hydrate as hydrateSavedRegexes,
  deHydrate as deHydrateSavedRegexes,
} from './RegexesManager'
export {
  default as ForceRecognitionTracksManager,
  hydrate as hydrateForceRecognitionTracks,
  deHydrate as deHydrateForceRecognitionTracks,
} from './ForceRecognitionTracksManager'

export { default as BrowserStorage } from './BrowserStorage'
