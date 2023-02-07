import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

import browser from 'webextension-polyfill'

import type { ConnectorState, State } from 'interfaces'
import { ctActions, bgActions, initialState } from 'internals'

import EditSearch from './EditSearch'

const DEBUG = Number(process.env.DEBUG) === 1 || false

const defaultAlbumArtUrl = 'https://via.placeholder.com/150'

const Track = ({
  activeConnectorTabId,
  track,
  startEdit,
}: {
  activeConnectorTabId: State['activeConnectorTabId']
  track: ConnectorState['track']
  startEdit: () => void
}) => {
  if (!track) {
    return (
      <div>
        <button onClick={() => startEdit()}>Edit search</button>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex' }}>
      <div>
        <img
          src={track.albumArtUrl || defaultAlbumArtUrl}
          style={{ width: 100, height: 100, marginRight: 8 }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {DEBUG && (
          <div>
            Ids: {activeConnectorTabId} - {track.musicBrainzReleaseGroupId}
          </div>
        )}
        <div>
          <a href={track.scrobblerLinks.track}>{track.name}</a>
        </div>
        <div>
          <a href={track.scrobblerLinks.artist}>{track.artist}</a>
        </div>
        <div>
          <a href={track.scrobblerLinks.album}>{track.album}</a>
        </div>

        <div>
          <button onClick={() => startEdit()}>Edit search</button>
        </div>
      </div>
    </div>
  )
}

const InnerPopup = () => {
  const [edittingSearch, setEditingSearch] = useState<boolean>(false)
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
    const interval = setInterval(updateState, 500)
    return () => clearInterval(interval)
  }, [])

  const tabId = globalState.activeConnectorTabId
  if (!connectorState || tabId === null) {
    return <div>loading... Check scrobblers.</div>
  }

  return (
    <div>
      {!connectorState.track && (
        <div>active tab: {globalState.activeConnectorTabId}</div>
      )}
      {edittingSearch ? (
        <EditSearch
          activeConnectorTabId={tabId}
          searchQueryList={connectorState.searchQueryList}
          track={connectorState.track}
          stopEditting={() => setEditingSearch(false)}
        />
      ) : (
        <Track
          activeConnectorTabId={globalState.activeConnectorTabId}
          track={connectorState.track}
          startEdit={() => {
            setEditingSearch(true)
          }}
        />
      )}
      <div>
        {connectorState.scrobbleState} (
        {connectorState.track ? connectorState.track.scrobblerMatchQuality : -1}
        /{Math.floor(connectorState.minimumScrobblerQuality)}),{' '}
        {Math.round(connectorState.playTime * 10) / 10}
        s/{Math.round(connectorState.scrobbleAt)}s
      </div>
      <div>
        <button onClick={() => ctActions.toggleDisableToggleCurrent(tabId)}>
          Don't scrobble current
        </button>
        <button onClick={() => ctActions.forceScrobbleCurrent(tabId)}>
          Force scrobble current
        </button>
      </div>
      <pre>{DEBUG && globalState.debugString}</pre>
    </div>
  )
}

const Content = () => {
  return (
    <div>
      <InnerPopup />
      <button onClick={() => browser.runtime.openOptionsPage()}>Options</button>
    </div>
  )
}

const container = document.getElementById('content')!
const root = createRoot(container)
root.render(<Content />)
