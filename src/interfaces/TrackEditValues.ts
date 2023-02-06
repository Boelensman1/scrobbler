import type { Track } from 'internals'

type TrackEdit = Pick<InstanceType<typeof Track>, 'name' | 'artist' | 'album'>

export default TrackEdit
