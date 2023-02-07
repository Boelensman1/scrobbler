import type { ConnectorStatic } from 'interfaces'
import { YoutubeConnector } from 'internals'

const connectors: ConnectorStatic[] = [YoutubeConnector]

const main = async () => {
  const MatchingConnector = connectors.find((conn) =>
    conn.hostMatch(location.host),
  )

  if (!MatchingConnector) {
    return
  }
  const activeConnector = new MatchingConnector()

  await activeConnector.connectorMiddleware.setup()
}

main()
