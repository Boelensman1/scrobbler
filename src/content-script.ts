import type { ConnectorStatic } from 'interfaces'
import {
  ConfigContainer,
  YoutubeConnector,
  YoutubeEmbedConnector,
} from 'internals'

import scrobblers from './scrobblerList'

const connectors: ConnectorStatic[] = [YoutubeConnector, YoutubeEmbedConnector]

const config = new ConfigContainer()

const main = async () => {
  const MatchingConnector = connectors.find((conn) =>
    conn.locationMatch(location),
  )

  if (!MatchingConnector) {
    return
  }

  await config.loadConfig()

  const scrobbler = config.get('scrobbler')
  switch (scrobbler) {
    case 'lastFm': {
      const lastfmSessionKey = config.get('lastfmSessionKey')
      if (!lastfmSessionKey) {
        config.set('scrobbler', null)
      } else {
        scrobblers.lastFm.setSessionKey(lastfmSessionKey)
      }
    }
  }

  if (!scrobbler) {
    return
  }

  const activeConnector = new MatchingConnector(scrobblers[scrobbler], config)
  await activeConnector.setup()
}

main()
