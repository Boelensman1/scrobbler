import React, { useState } from 'react'

import _ from 'lodash'
import { useFormik } from 'formik'

import type { State, TrackEditValues } from 'interfaces'
import { actions } from 'internals'

const ManualInputForm = ({
  track,
  save,
}: {
  track: State['track']
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
      <label htmlFor="name">Name</label>
      <input
        id="name"
        onChange={formik.handleChange}
        value={formik.values.name}
      />

      <label htmlFor="artist">Artist</label>
      <input
        id="artist"
        onChange={formik.handleChange}
        value={formik.values.artist}
      />
      <button type="submit">save</button>
    </form>
  )
}

const SelectResultForm = ({
  searchResults,
  save,
}: {
  searchResults: State['searchResults']
  save: (values: TrackEditValues) => void
}) => {
  const formik = useFormik({
    initialValues: {
      selectedSearchResult: '0',
    },
    onSubmit: async (values: { selectedSearchResult: string }) => {
      console.log(values)
      // actions.saveTrackEdit(connectorId, values)
      save(
        _.pick(searchResults[Number(values.selectedSearchResult)], [
          'name',
          'artist',
          'album',
        ]),
      )
    },
  })

  console.log(formik.values)

  return (
    <form onSubmit={formik.handleSubmit}>
      <label htmlFor="selectedSearchResult">
        Choose different searchResult:
      </label>
      <select
        id="selectedSearchResult"
        onChange={formik.handleChange}
        value={formik.values.selectedSearchResult}
      >
        {searchResults.map((result, i) => (
          <option key={i} value={i}>
            {result.artist} - {result.name} ({result.scrobblerMatchQuality})
          </option>
        ))}
      </select>

      <button type="submit">save</button>
    </form>
  )
}

const EditSearch = ({
  connectorId,
  track,
  searchResults,
  stopEditting,
}: {
  connectorId: string
  track: State['track']
  searchResults: State['searchResults']
  stopEditting: () => void
}) => {
  const [manualInput, setManualInput] = useState(false)
  const save = (trackEditValues: TrackEditValues) => {
    actions.saveTrackEdit(connectorId, trackEditValues)
    stopEditting()
  }
  return (
    <div>
      {manualInput ? (
        <ManualInputForm track={track} save={save} />
      ) : (
        <SelectResultForm searchResults={searchResults} save={save} />
      )}
      <button onClick={() => setManualInput(true)}>Manually edit</button>
      <button onClick={() => stopEditting()}>Cancel</button>
    </div>
  )
}

export default EditSearch
