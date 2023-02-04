import type { State } from 'interfaces'

import scrobbleStates from './scrobbleStates'

const initialState: State = {
  track: null,
  playTime: 0,
  scrobbleState: scrobbleStates.TRACK_NOT_RECOGNISED,
  sendNowPlaying: false,
  debugString: '',
}

export default initialState
