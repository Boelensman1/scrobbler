import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useFormik } from 'formik'

import { bgActions } from 'internals'

import type { Config } from '../interfaces'
import useConfig from './useConfig'

const Content = () => {
  const { config, saveConfig, resetConfig } = useConfig()

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
  )
}

const container = document.getElementById('content')
if (!container) {
  throw new Error('Container not found')
}

const root = createRoot(container)
root.render(<Content />)
