const scrobbleStates = {
  NO_CONNECTOR: 'NO_CONNECTOR' as 'NO_CONNECTOR',
  SEARCHING: 'SEARCHING' as 'SEARCHING',
  SCROBBLED: 'SCROBBLED' as 'SCROBBLED',
  WILL_SCROBBLE: 'WILL_SCROBBLE' as 'WILL_SCROBBLE',
  FORCE_SCROBBLE: 'FORCE_SCROBBLE' as 'FORCE_SCROBBLE',
  TRACK_NOT_RECOGNISED: 'TRACK_NOT_RECOGNISED' as 'TRACK_NOT_RECOGNISED',
  BELOW_MIN_SCROBBLER_QUALITY:
    'BELOW_MIN_SCROBBLER_QUALITY' as 'BELOW_MIN_SCROBBLER_QUALITY',
  TRACK_TOO_SHORT: 'TRACK_TOO_SHORT' as 'TRACK_TOO_SHORT',
  MANUALLY_DISABLED: 'MANUALLY_DISABLED' as 'MANUALLY_DISABLED',
}

export default scrobbleStates
