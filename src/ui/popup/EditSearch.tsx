import React, { useState } from 'react'

import _ from 'lodash'
import { useFormik } from 'formik'

import type { ConnectorState, TrackEditValues } from 'interfaces'
import { ctActions } from 'internals'

const ManualInputForm = ({
  track,
  save,
}: {
  track: ConnectorState['track']
  save: (values: TrackEditValues) => void
}) => {
  const formik = useFormik({
    initialValues: {
      name: track?.name || '',
      artist: track?.artist || '',
    },
    onSubmit: async (values: TrackEditValues) => {
      save(values)
    },
  })

  return (
    <form onSubmit={formik.handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          onChange={formik.handleChange}
          value={formik.values.name}
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
  )
}

const SelectResultForm = ({
  searchResults,
  save,
  goToManualInput,
}: {
  searchResults: ConnectorState['searchResults']
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
      _.pick(searchResults[Number(selectedSearchResult)], [
        'name',
        'artist',
        'album',
      ]),
    )
  }

  return (
    <form>
      <select id="selectedSearchResult" onChange={submit}>
        <option value="select">Select search result</option>
        {searchResults.map((result, i) => (
          <option key={i} value={i}>
            {result.artist} - {result.name} ({result.scrobblerMatchQuality})
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
  searchResults,
  stopEditting,
}: {
  activeConnectorTabId: number
  track: ConnectorState['track']
  searchResults: ConnectorState['searchResults']
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
          <ManualInputForm track={track || searchResults[0]} save={save} />
        ) : (
          <SelectResultForm
            searchResults={searchResults}
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
