import { useState, useEffect } from 'react'
import type { ConnectorState, State } from 'interfaces'
import { bgActions, ctActions, initialState } from 'internals'

const useScrobblerState = ({
  updateInterval,
}: { updateInterval?: number } = {}) => {
  const [globalState, setGlobalState] = useState<State>(initialState)
  const [connectorState, setConnectorState] = useState<ConnectorState>()

  useEffect(() => {
    const updateState = async () => {
      const newState = await bgActions.getState()
      if (newState.activeConnectorTabId) {
        const newConnectorState = await ctActions.getConnectorState(
          newState.activeConnectorTabId,
        )
        if (newConnectorState) {
          setConnectorState(newConnectorState)
        }
      }
      setGlobalState(newState)
    }

    updateState()
    const interval = setInterval(updateState, updateInterval || 500)
    return () => clearInterval(interval)
  }, [])

  return { connectorState, globalState }
}

export default useScrobblerState
