import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

import browser from 'webextension-polyfill'

import type { State } from 'interfaces'
import { bgActions, initialState } from 'internals'

import EditSearch from './EditSearch'

const DEBUG = Number(process.env.DEBUG) === 1 || false

const defaultAlbumArtUrl = 'https://via.placeholder.com/150'

const Track = ({
  activeConnectorId,
  track,
  startEdit,
}: {
  activeConnectorId: State['activeConnectorId']
  track: State['track']
  startEdit: () => void
}) => {
  if (!track) {
    return null
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
            Ids: {activeConnectorId} - {track.musicBrainzReleaseGroupId}
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

const Content = () => {
  const [state, setState] = useState<State>(initialState)
  const [edittingSearch, setEditingSearch] = useState<boolean>(false)
  useEffect(() => {
    const updateState = async () => {
      const newState = await bgActions.getState()
      setState(newState)
    }

    updateState()
    const interval = setInterval(updateState, 100)
    return () => clearInterval(interval)
  }, [])

  if (!state.activeConnectorId) {
    return <div>Unrecognised site</div>
  }

  return (
    <div>
      {edittingSearch ? (
        <EditSearch
          connectorId={state.activeConnectorId}
          searchResults={state.searchResults}
          track={state.track}
          stopEditting={() => setEditingSearch(false)}
        />
      ) : (
        <Track
          activeConnectorId={state.activeConnectorId}
          track={state.track}
          startEdit={() => {
            setEditingSearch(true)
          }}
        />
      )}
      <div>
        {state.scrobbleState} (
        {state.track ? state.track.scrobblerMatchQuality : -1}/
        {Math.floor(state.minimumScrobblerQuality)}),{' '}
        {Math.round(state.playTime * 10) / 10}
        s/{Math.round(state.scrobbleAt)}s
      </div>
      <div>
        <button onClick={() => bgActions.toggleDisableToggleCurrent()}>
          Don't scrobble current
        </button>
        <button onClick={() => bgActions.forceScrobbleCurrent()}>
          Force scrobble current
        </button>
        <button onClick={() => browser.runtime.openOptionsPage()}>
          Options
        </button>
      </div>
      <pre>{DEBUG && state.debugString}</pre>
    </div>
  )
}

const container = document.getElementById('content')!
const root = createRoot(container)
root.render(<Content />)
