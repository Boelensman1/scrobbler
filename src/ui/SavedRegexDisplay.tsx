import React from 'react'

import { useFormik } from 'formik'

import { bgActions } from 'internals'
import type { AddSavedRegexValues } from 'interfaces'

interface PropType extends AddSavedRegexValues {
  index?: number
  added?: () => void
}

const SavedRegexDisplay = ({
  index,
  type,
  match,
  search,
  replace,
  stop,
  added,
}: PropType) => {
  const adding = !!added
  const formik = useFormik({
    initialValues: {
      type,
      match,
      search,
      replace,
      stop,
    },
    onSubmit: async (values: AddSavedRegexValues) => {
      if (adding) {
        await bgActions.addSavedRegex(values)
        added()
      }
    },
  })

  return (
    <form onSubmit={formik.handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {index ?? <div>Index: {index}</div>}

        <label htmlFor="type">Type</label>
        <select
          id="type"
          onChange={formik.handleChange}
          value={formik.values.type}
          autoComplete="off"
        >
          <option value="track" label="track">
            track
          </option>
          <option value="artist" label="artist">
            artist
          </option>
        </select>

        <label htmlFor="match">Match</label>
        <input
          id="match"
          onChange={formik.handleChange}
          value={formik.values.match}
          autoComplete="off"
        />

        <label htmlFor="search">Search</label>
        <input
          id="search"
          onChange={formik.handleChange}
          value={formik.values.search}
          autoComplete="off"
        />

        <label htmlFor="replace">Replace</label>
        <input
          id="replace"
          onChange={formik.handleChange}
          value={formik.values.replace}
          autoComplete="off"
        />

        <div>
          <label htmlFor="stop">Stop after this regex</label>
          <input
            id="stop"
            type="checkbox"
            onChange={formik.handleChange}
            checked={formik.values.stop}
            autoComplete="off"
          />
        </div>
        {adding && <button type="submit">Add</button>}
      </div>
    </form>
  )
}

SavedRegexDisplay.defaultProps = {
  type: 'track',
  match: '.*',
  search: '',
  replace: '',
  stop: false,
}

export default SavedRegexDisplay
