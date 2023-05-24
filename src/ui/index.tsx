import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useFormik } from 'formik'

import { bgActions } from 'internals'

import type { Config } from '../interfaces'
import useConfig from './useConfig'
import useScrobblerState from './useScrobblerState'
import useEdittedTracks from './useEdittedTracks'
import useSavedRegexes from './useSavedRegexes'

import SavedRegexDisplay from './SavedRegexDisplay'

const Content = () => {
  const [addingRegex, setAddingRegex] = useState(false)
  const { config, saveConfig, resetConfig } = useConfig()
  const { connectorState, globalState } = useScrobblerState()
  const { edittedTracks } = useEdittedTracks()
  const { savedRegexes } = useSavedRegexes()

  const formik = useFormik({
    initialValues: {
      ...config,
    },
    onSubmit: async (values: Partial<Config>) => {
      delete values.scrobbler
      saveConfig(values)
    },
  })

  useEffect(() => {
    if (config) {
      formik.setValues(config)
    }
  }, [config])

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 48,
        }}
      >
        <div>
          <button onClick={() => bgActions.requestAuthentication()}>
            Authorize with Last.Fm
          </button>
        </div>

        <form onSubmit={formik.handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div>
              <label htmlFor="minimumScrobblerQuality">
                Minimum scrobbler quality{' '}
              </label>
              <input
                id="minimumScrobblerQuality"
                type="number"
                onChange={formik.handleChange}
                value={formik.values.minimumScrobblerQuality}
              />
            </div>

            <div>
              <label htmlFor="scrobblerQualityDynamic">
                Dynamic scrobbler quality{' '}
              </label>
              <input
                id="scrobblerQualityDynamic"
                type="checkbox"
                onChange={formik.handleChange}
                checked={formik.values.scrobblerQualityDynamic}
              />
            </div>

            <div>
              <label htmlFor="youtubeApiKey">
                Youtube Api Key (allows scrobbling of embedded){' '}
              </label>
              <input
                id="youtubeApiKey"
                onChange={formik.handleChange}
                value={formik.values.youtubeApiKey}
              />
            </div>

            <div>
              <label htmlFor="debug">Debug </label>
              <input
                id="debug"
                type="checkbox"
                onChange={formik.handleChange}
                checked={formik.values.debug}
              />
            </div>

            <div>
              <button type="submit">Save</button>
            </div>
          </div>
        </form>
        <div>
          <button id="resetConfig" onClick={() => resetConfig()}>
            Reset
          </button>
        </div>
      </div>

      <div>
        {savedRegexes &&
          savedRegexes.map((regex, i) => (
            <SavedRegexDisplay key={i} index={i} {...regex} />
          ))}

        {addingRegex && (
          <SavedRegexDisplay added={() => setAddingRegex(false)} />
        )}
        {!addingRegex && (
          <button onClick={() => setAddingRegex(true)}>Add</button>
        )}
        {!addingRegex && (
          <button onClick={() => bgActions.resetSavedRegexes()}>
            Reset regexes
          </button>
        )}
      </div>

      {config?.debug && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 48,
          }}
        >
          <div>
            <strong>config</strong>
            <pre style={{ margin: 0 }}>{JSON.stringify(config, null, 2)}</pre>
          </div>
          <div>
            <strong>globalState</strong>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(globalState, null, 2)}
            </pre>
          </div>
          <div>
            <strong>connectorState</strong>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(connectorState, null, 2)}
            </pre>
          </div>
          <div>
            <strong>edittedTracks</strong>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(edittedTracks, null, 2)}
            </pre>
          </div>
          <div>
            <strong>savedRegexes</strong>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(savedRegexes, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  )
}

const container = document.getElementById('content')
if (!container) {
  throw new Error('Container not found')
}

const root = createRoot(container)
root.render(<Content />)
