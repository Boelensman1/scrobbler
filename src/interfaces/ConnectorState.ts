import type { ConnectorMiddleware } from 'internals'

type ConnectorState = Pick<
  InstanceType<typeof ConnectorMiddleware>,
  | 'playTime'
  | 'track'
  | 'scrobbleState'
  | 'minimumScrobblerQuality'
  | 'scrobbleAt'
  | 'trackDuration'
  | 'searchResults'
>

export default ConnectorState
