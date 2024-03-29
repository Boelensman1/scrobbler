import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'

import browser from 'webextension-polyfill'

import type { ConnectorState, State } from 'interfaces'
import { ctActions, scrobbleStates } from 'internals'

import EditSearch from './EditSearch'

import useConfig from '../useConfig'
import useScrobblerState from '../useScrobblerState'

// @ts-expect-error not typescript, but handled by parcel just fine
import refreshIcon from './refresh.png'

const defaultAlbumArtUrl = 'https://via.placeholder.com/150'

const Track = ({
  activeConnectorTabId,
  track,
  searchQueryList,
  startEdit,
  debug,
}: {
  activeConnectorTabId: State['activeConnectorTabIdQueue'][0]
  track: ConnectorState['track']
  searchQueryList: ConnectorState['searchQueryList']
  startEdit: () => void
  debug: boolean
}) => {
  if (!track) {
    return (
      <div>
        {searchQueryList?.length > 0 && (
          <>
            <div>Track not found, best guess:</div>
            <div>
              {searchQueryList[0].artist} - {searchQueryList[0].track}
            </div>
          </>
        )}
        <button onClick={() => startEdit()}>Edit search</button>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <div>
        <img
          src={track.albumArtUrl || defaultAlbumArtUrl}
          style={{ width: 100, height: 100, marginRight: 8 }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {debug && (
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
  const { config } = useConfig()
  const { connectorState, globalState } = useScrobblerState()
  const [edittingSearch, setEditingSearch] = useState<boolean>(false)
  const [recentlyRefrehsed, setRecentlyRefreshed] = useState<boolean>(false)

  const tabId = globalState.activeConnectorTabIdQueue[0]
  if (!connectorState || tabId === null) {
    return (
      <>
        <div>loading... Check scrobblers.</div>
        <button onClick={() => browser.runtime.openOptionsPage()}>
          Options
        </button>
      </>
    )
  }

  return (
    <>
      {connectorState.track && (
        <div
          className={
            connectorState.scrobbleState === 'SEARCHING' || recentlyRefrehsed
              ? 'spin'
              : ''
          }
          style={{ position: 'absolute', top: 5, right: 5 }}
          onClick={() => {
            if (
              connectorState.scrobbleState !== 'SEARCHING' &&
              !recentlyRefrehsed
            ) {
              setRecentlyRefreshed(true)
              setTimeout(() => setRecentlyRefreshed(false), 2000)
              ctActions.refreshCurrentTrack(tabId)
            }
          }}
        >
          <img src={refreshIcon} alt="Refresh" style={{ maxHeight: 14 }} />
        </div>
      )}

      {!connectorState.track && config.debug && <div>active tab: {tabId}</div>}
      {edittingSearch ? (
        <EditSearch
          activeConnectorTabId={tabId}
          searchQueryList={connectorState.searchQueryList}
          track={connectorState.track}
          stopEditting={() => setEditingSearch(false)}
        />
      ) : (
        <Track
          activeConnectorTabId={tabId}
          searchQueryList={connectorState.searchQueryList}
          track={connectorState.track}
          startEdit={() => {
            setEditingSearch(true)
          }}
          debug={config.debug}
        />
      )}
      <div>
        {connectorState.scrobbleState}{' '}
        {config.debug &&
          connectorState.scrobbleState !==
            scrobbleStates.TRACK_NOT_RECOGNISED &&
          `(${
            connectorState.track
              ? connectorState.track.scrobblerMatchQuality
              : -1
          }/${Math.floor(connectorState.minimumScrobblerQuality)}), `}
        {Math.round(connectorState.playTime * 10) / 10}s/
        {Math.round(connectorState.scrobbleAt)}s
      </div>
      <div>
        <button
          onClick={() => ctActions.toggleDisableToggleCurrent(tabId)}
          style={{ marginRight: 2 }}
        >
          Disable
        </button>
        <button onClick={() => ctActions.forceScrobbleCurrent(tabId)}>
          Scrobble now
        </button>
        <button
          style={{ marginRight: 2 }}
          onClick={() =>
            ctActions.setForceRecogniseCurrent(
              tabId,
              !connectorState.shouldForceRecogniseCurrentTrack,
            )
          }
        >
          {connectorState.shouldForceRecogniseCurrentTrack
            ? 'Unforce recognition'
            : 'Force recognition'}
        </button>
      </div>
      {config.debug && <pre>{globalState.debugString}</pre>}
      <button onClick={() => browser.runtime.openOptionsPage()}>Options</button>
    </>
  )
}

const Content = () => {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        flexDirection: 'column',
        maxWidth: '320px',
      }}
    >
      <InnerPopup />
    </div>
  )
}

const container = document.getElementById('content')
if (!container) {
  throw new Error('Container not found')
}

const root = createRoot(container)
root.render(<Content />)
