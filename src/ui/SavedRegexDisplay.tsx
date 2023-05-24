import React from 'react'

import { useFormik } from 'formik'

import { bgActions } from 'internals'
import type { AddSavedRegexValues } from 'interfaces'

interface PropTypeAdding extends AddSavedRegexValues {
  index: undefined
  added: () => void
}
interface PropTypeUpdating extends AddSavedRegexValues {
  index: number
  added: undefined
}

type PropType = PropTypeAdding | PropTypeUpdating

const SavedRegexDisplay = ({
  index,
  matchArtist,
  matchTrack,
  searchArtist,
  replaceArtist,
  searchTrack,
  replaceTrack,
  stop,
  added,
}: PropType) => {
  const formik = useFormik({
    initialValues: {
      matchArtist,
      matchTrack,
      searchArtist,
      replaceArtist,
      searchTrack,
      replaceTrack,
      stop,
    },
    onSubmit: async (values: AddSavedRegexValues) => {
      if (added) {
        await bgActions.addSavedRegex(values)
        added()
      } else {
        await bgActions.updateSavedRegex(index, values)
      }
    },
  })

  return (
    <form onSubmit={formik.handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {index ?? <div>Index: {index}</div>}

        <label htmlFor="match">Match Artist</label>
        <input
          id="matchArtist"
          onChange={formik.handleChange}
          value={formik.values.matchArtist}
          autoComplete="off"
        />

        <label htmlFor="match">Match Track</label>
        <input
          id="matchTrack"
          onChange={formik.handleChange}
          value={formik.values.matchTrack}
          autoComplete="off"
        />

        <label htmlFor="search">Search Artist</label>
        <input
          id="searchArtist"
          onChange={formik.handleChange}
          value={formik.values.searchArtist}
          autoComplete="off"
        />

        <label htmlFor="replace">Replace Artist</label>
        <input
          id="replaceArtist"
          onChange={formik.handleChange}
          value={formik.values.replaceArtist}
          autoComplete="off"
        />

        <label htmlFor="search">Search Track</label>
        <input
          id="searchTrack"
          onChange={formik.handleChange}
          value={formik.values.searchTrack}
          autoComplete="off"
        />

        <label htmlFor="replace">Replace Track</label>
        <input
          id="replaceTrack"
          onChange={formik.handleChange}
          value={formik.values.replaceTrack}
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
        <button type="submit">{added ? 'Add' : 'Update'}</button>
      </div>
    </form>
  )
}

SavedRegexDisplay.defaultProps = {
  matchArtist: '.*',
  matchTrack: '.*',
  searchArtist: '',
  replaceArtist: '',
  searchTrack: '',
  replaceTrack: '',
  stop: false,
}

export default SavedRegexDisplay
