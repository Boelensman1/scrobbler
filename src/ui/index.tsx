import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useFormik } from 'formik'

import type { Config } from '../interfaces'
import { bgActions, defaultConfig } from 'internals'

const Content = () => {
  const [config, setConfig] = useState<Config>(defaultConfig)
  const [reloadConfig, setReloadConfig] = useState<boolean>(true)

  const formik = useFormik({
    initialValues: {
      ...config,
    },
    onSubmit: async (values: Partial<Config>) => {
      delete values.scrobbler
      await bgActions.saveConfig(values)
    },
  })

  useEffect(() => {
    const updateConfig = async () => {
      setReloadConfig(false)
      const newConfig = await bgActions.getConfig()
      setConfig(newConfig)
      formik.setValues(newConfig)
    }

    if (reloadConfig) {
      updateConfig()
    }
  }, [reloadConfig])

  return (
    <div>
      <button onClick={() => bgActions.requestAuthentication()}>auth</button>
      <button
        id="resetConfig"
        onClick={async () => {
          await bgActions.resetConfig()
          setReloadConfig(true)
        }}
      >
        reset config
      </button>

      <form onSubmit={formik.handleSubmit}>
        <label htmlFor="minimumScrobblerQuality">
          Minimum Scrobbler Quality{' '}
        </label>
        <input
          id="minimumScrobblerQuality"
          type="number"
          onChange={formik.handleChange}
          value={formik.values.minimumScrobblerQuality}
        />

        <label htmlFor="scrobblerQualityDynamic">
          Dynamic scrobbler quality{' '}
        </label>
        <input
          id="scrobblerQualityDynamic"
          type="checkbox"
          onChange={formik.handleChange}
          checked={formik.values.scrobblerQualityDynamic}
        />
        <button type="submit">save</button>
      </form>
    </div>
  )
}

const container = document.getElementById('content')
if (!container) {
  throw new Error('Container not found')
}

const root = createRoot(container)
root.render(<Content />)
