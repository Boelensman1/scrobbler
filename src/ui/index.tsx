import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useFormik } from 'formik'

import type { Config } from '../interfaces'
import { actions, defaultConfig } from 'internals'

const Content = () => {
  const [config, setConfig] = useState<Config>(defaultConfig)
  const [reloadConfig, setReloadConfig] = useState<boolean>(true)

  const formik = useFormik({
    initialValues: {
      ...config,
    },
    onSubmit: async (values: Partial<Config>) => {
      delete values.scrobbler
      await actions.saveConfig(values)
    },
  })

  useEffect(() => {
    const updateConfig = async () => {
      setReloadConfig(false)
      const newConfig = await actions.getConfig()
      setConfig(newConfig)
      formik.setValues(newConfig)
    }

    if (reloadConfig) {
      updateConfig()
    }
  }, [reloadConfig])

  return (
    <div>
      <button onClick={() => actions.requestAuthentication()}>auth</button>
      <button
        id="resetConfig"
        onClick={async () => {
          await actions.resetConfig()
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

const container = document.getElementById('content')!
const root = createRoot(container)
root.render(<Content />)
