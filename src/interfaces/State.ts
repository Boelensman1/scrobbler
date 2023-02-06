import type { Track, scrobbleStates } from 'internals'

interface State {
  track: Track | null
  playTime: number
  playState?: 'PLAYING' | 'PAUSED'
  scrobbleState: keyof typeof scrobbleStates
  minimumScrobblerQuality: number
  sendNowPlaying: boolean
  startedPlaying?: Date
  debugString: string
  scrobbleAt: number
  trackDuration?: number
  activeConnectorId: string | null
  searchResults: Track[]
}

export default State
