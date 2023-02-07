import type { ConnectorStatic } from 'interfaces'
import { ConfigContainer, YoutubeConnector } from 'internals'

import scrobblers from './scrobblerList'

const connectors: ConnectorStatic[] = [YoutubeConnector]

const config = new ConfigContainer()

const main = async () => {
  const MatchingConnector = connectors.find((conn) =>
    conn.hostMatch(location.host),
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
  await activeConnector.connectorMiddleware.setup()
}

main()
