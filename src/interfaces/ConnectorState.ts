import type { BaseConnector } from 'internals'

type ConnectorState = Pick<
  InstanceType<typeof BaseConnector>,
  | 'playTime'
  | 'track'
  | 'scrobbleState'
  | 'minimumScrobblerQuality'
  | 'scrobbleAt'
  | 'trackDuration'
  | 'searchResults'
>

export default ConnectorState
