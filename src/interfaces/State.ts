import type { Track, scrobbleStates } from 'internals'

interface State {
  track: Track | null
  playTime: number
  playState?: 'PLAYING' | 'PAUSED'
  scrobbleState: keyof typeof scrobbleStates
  sendNowPlaying: boolean
  startedPlaying?: Date
  debugString: string
}

export default State
