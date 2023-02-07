import { scrobbleStates } from 'internals'

const forceableScrobbleStates: (keyof typeof scrobbleStates)[] = [
  scrobbleStates.BELOW_MIN_SCROBBLER_QUALITY,
  scrobbleStates.MANUALLY_DISABLED,
  scrobbleStates.SCROBBLED,
  scrobbleStates.TRACK_TOO_SHORT,
  scrobbleStates.WILL_SCROBBLE,
  scrobbleStates.FORCE_SCROBBLE,
]

const canForceScrobble = (
  scrobbleState: keyof typeof scrobbleStates,
): boolean => forceableScrobbleStates.includes(scrobbleState)

export default canForceScrobble
