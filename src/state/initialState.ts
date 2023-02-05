import type { State } from 'interfaces'

import scrobbleStates from './scrobbleStates'

const initialState: State = {
  track: null,
  playTime: 0,
  scrobbleState: scrobbleStates.TRACK_NOT_RECOGNISED,
  sendNowPlaying: false,
  scrobbleAt: 4 * 60,
  debugString: '',
  minimumScrobblerQuality: Number.MAX_SAFE_INTEGER,
  trackDuration: 0,
}

export default initialState
