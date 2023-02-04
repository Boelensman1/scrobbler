import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

import browser from 'webextension-polyfill'

import type { State } from '../interfaces'
import { actions, initialState } from 'internals'

const DEBUG = Number(process.env.DEBUG) === 1 || false

const defaultAlbumArtUrl = 'https://via.placeholder.com/150'

const Track = ({ track }: Pick<State, 'track'>) => {
  if (!track) {
    return null
  }
  return (
    <div style={{ display: 'flex' }}>
      <div>
        <img
          src={track.albumArtUrl || defaultAlbumArtUrl}
          style={{ width: 100, height: 100 }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {DEBUG && (
          <div>
            Ids: {track.connectorId} - {track.musicBrainzReleaseGroupId}
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
      </div>
    </div>
  )
}

const Content = () => {
  const [state, setState] = useState<State>(initialState)
  useEffect(() => {
    const updateState = async () => {
      const newState = await browser.runtime.sendMessage({
        type: actions.GET_STATE,
      })
      setState(newState)
    }

    updateState()
    const interval = setInterval(updateState, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <Track track={state.track} />
      <div>
        {state.scrobbleState} (
        {state.track ? state.track.scrobblerMatchQuality : -1}),{' '}
        {Math.round(state.playTime * 10) / 10}s/{Math.round(state.scrobbleAt)}s
      </div>
      <div>
        <button onClick={() => browser.runtime.openOptionsPage()}>
          Options
        </button>
        <button
          onClick={() => {
            browser.runtime.sendMessage({
              type: actions.DISABLE_SCROBBLE_CURRENT,
            })
          }}
        >
          Don't scrobble current
        </button>
      </div>
      <pre>{DEBUG && state.debugString}</pre>
    </div>
  )
}

const container = document.getElementById('content')!
const root = createRoot(container)
root.render(<Content />)
