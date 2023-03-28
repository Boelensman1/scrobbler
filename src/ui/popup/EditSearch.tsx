import React, { useState } from 'react'

import _ from 'lodash'
import { useFormik } from 'formik'

import type { ConnectorState, SongInfo } from 'interfaces'
import { ctActions, Track } from 'internals'

type TrackEditValues = SongInfo

const ManualInputForm = ({
  searchQueryList,
  track,
  save,
}: {
  searchQueryList: ConnectorState['searchQueryList']
  track: SongInfo
  save: (values: TrackEditValues) => void
}) => {
  const formik = useFormik({
    initialValues: {
      track: track?.track || '',
      artist: track?.artist || '',
    },
    onSubmit: async (values: TrackEditValues) => {
      save(values)
    },
  })

  const copyFrom = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSearchResult = e.currentTarget.value
    if (selectedSearchResult === 'select') {
      return
    }

    formik.setValues(
      _.pick(searchQueryList[Number(selectedSearchResult)], [
        'track',
        'artist',
      ]),
    )
  }

  return (
    <div>
      <form>
        <select id="copyFrom" onChange={copyFrom}>
          <option value="select">Copy from:</option>
          {searchQueryList.map((result, i) => (
            <option key={i} value={i}>
              {result.artist} - {result.track} ({result.matchQuality})
            </option>
          ))}
        </select>
      </form>
      <form onSubmit={formik.handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="track">Name</label>
          <input
            id="track"
            onChange={formik.handleChange}
            value={formik.values.track}
            autoComplete="off"
          />

          <label htmlFor="artist">Artist</label>
          <input
            id="artist"
            onChange={formik.handleChange}
            value={formik.values.artist}
            autoComplete="off"
          />
          <button type="submit">save</button>
        </div>
      </form>
    </div>
  )
}

const SelectResultForm = ({
  searchQueryList,
  save,
  goToManualInput,
}: {
  searchQueryList: ConnectorState['searchQueryList']
  save: (values: TrackEditValues) => void
  goToManualInput: () => void
}) => {
  const submit = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSearchResult = e.currentTarget.value

    if (selectedSearchResult === 'select') {
      return
    }

    if (selectedSearchResult === 'manual') {
      goToManualInput()
      return
    }

    save(
      _.pick(searchQueryList[Number(selectedSearchResult)], [
        'track',
        'artist',
        'album',
      ]),
    )
  }

  return (
    <form>
      <select id="selectedSearchResult" onChange={submit}>
        <option value="select">Select search result</option>
        {searchQueryList
          .filter((r) => r.matchQuality)
          .map((result, i) => (
            <option key={i} value={i}>
              {result.artist} - {result.track} (
              {result.matchQuality || 'no-match'})
            </option>
          ))}
        <option value="manual">Manual input</option>
      </select>
    </form>
  )
}

const EditSearch = ({
  activeConnectorTabId,
  track,
  searchQueryList,
  stopEditting,
}: {
  activeConnectorTabId: number
  track: ConnectorState['track']
  searchQueryList: ConnectorState['searchQueryList']
  stopEditting: () => void
}) => {
  const [manualInput, setManualInput] = useState(false)
  const save = (trackEditValues: TrackEditValues) => {
    ctActions.saveTrackEdit(activeConnectorTabId, trackEditValues)
    stopEditting()
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        {manualInput ? (
          <ManualInputForm
            searchQueryList={searchQueryList}
            track={track ? new Track(track).toSongInfo() : searchQueryList[0]}
            save={save}
          />
        ) : (
          <SelectResultForm
            searchQueryList={searchQueryList}
            save={save}
            goToManualInput={() => setManualInput(true)}
          />
        )}
      </div>
      <button onClick={() => stopEditting()}>Cancel</button>
    </div>
  )
}

export default EditSearch
