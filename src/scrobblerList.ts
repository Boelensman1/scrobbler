import { LastFm } from 'internals'

const scrobblers: { [key: string]: LastFm } = {
  lastFm: new LastFm(),
}

export default scrobblers
