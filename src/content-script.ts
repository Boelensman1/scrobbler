import type { ConnectorStatic } from 'interfaces'
import {
  bgActions,
  YoutubeConnector,
  YoutubeEmbedConnector,
  InsidiousConnector,
} from 'internals'

import scrobblers from './scrobblerList'

const connectors: ConnectorStatic[] = [
  YoutubeConnector,
  YoutubeEmbedConnector,
  InsidiousConnector,
]

const main = async () => {
  const MatchingConnector = connectors.find((conn) =>
    conn.locationMatch(location),
  )

  if (!MatchingConnector) {
    return
  }

  const config = await bgActions.getConfig()

  const scrobbler = config.scrobbler
  switch (scrobbler) {
    case 'lastFm': {
      const lastfmSessionKey = config.lastfmSessionKey
      if (!lastfmSessionKey) {
        await bgActions.saveConfig({
          scrobbler: null,
        })
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
