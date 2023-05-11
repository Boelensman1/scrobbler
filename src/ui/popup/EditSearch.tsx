import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  Ref,
} from 'react'

import _ from 'lodash'
import { useFormik } from 'formik'

import type { ConnectorState, SongInfo } from 'interfaces'
import { ctActions, Track } from 'internals'

type TrackEditValues = SongInfo

const getMatchQuality = (matchQuality: undefined | number): string => {
  if (!matchQuality) {
    return 'no match'
  }
  if (matchQuality === -2) {
    return 'from saved edit'
  }
  return matchQuality.toString()
}

type FormHandle = {
  submitForm: () => void
}

const ManualInputForm = forwardRef(
  (
    {
      searchQueryList,
      track,
      save,
    }: {
      searchQueryList: ConnectorState['searchQueryList']
      track: SongInfo
      save: (values: TrackEditValues) => void
    },
    ref: Ref<FormHandle>,
  ) => {
    const formik = useFormik({
      initialValues: {
        track: track?.track || '',
        artist: track?.artist || '',
      },
      onSubmit: async (values: TrackEditValues) => {
        save(values)
      },
    })

    useImperativeHandle(ref, () => ({
      submitForm() {
        formik.submitForm()
      },
    }))

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
                {result.artist} - {result.track}{' '}
                {`(${getMatchQuality(result.matchQuality)})`}
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
          </div>
        </form>
      </div>
    )
  },
)
ManualInputForm.displayName = 'ManualInputForm'

const SelectResultForm = forwardRef(
  (
    {
      searchQueryList,
      save,
    }: {
      searchQueryList: ConnectorState['searchQueryList']
      save: (values: TrackEditValues) => void
    },
    ref: Ref<FormHandle>,
  ) => {
    const formRef = useRef<HTMLFormElement>(null)
    const submit = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedSearchResult = e.currentTarget.value

      if (selectedSearchResult === 'select') {
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

    useImperativeHandle(ref, () => ({
      submitForm() {
        formRef.current?.submit()
      },
    }))

    return (
      <form ref={formRef}>
        <select id="selectedSearchResult" onSubmit={submit}>
          <option value="select">Select search result</option>
          {searchQueryList.map((result, i) => (
            <option key={i} value={i}>
              {result.artist} - {result.track} (
              {getMatchQuality(result.matchQuality)})
            </option>
          ))}
          <option value="manual">Manual input</option>
        </select>
      </form>
    )
  },
)
SelectResultForm.displayName = 'SelectResultForm'

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
  const [manualInput, setManualInput] = useState(true)
  const save = (trackEditValues: TrackEditValues) => {
    ctActions.saveTrackEdit(activeConnectorTabId, trackEditValues)
    stopEditting()
  }
  const ref = useRef<FormHandle>(null)

  return (
    <div style={{ border: '1px black solid', padding: '4px', marginBottom: 8 }}>
      <div style={{ marginBottom: 8 }}>
        {manualInput ? (
          <ManualInputForm
            searchQueryList={searchQueryList}
            track={track ? new Track(track).toSongInfo() : searchQueryList[0]}
            save={save}
            ref={ref}
          />
        ) : (
          <SelectResultForm
            searchQueryList={searchQueryList}
            save={save}
            ref={ref}
          />
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <button onClick={() => stopEditting()}>Cancel</button>
        <button onClick={() => setManualInput((mi) => !mi)}>
          Toggle manual entry
        </button>
        <button onClick={() => ref.current && ref.current.submitForm()}>
          Save
        </button>
      </div>
    </div>
  )
}

export default EditSearch
