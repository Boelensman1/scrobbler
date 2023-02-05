import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useFormik } from 'formik'

import browser from 'webextension-polyfill'

import type { Config } from '../interfaces'
import { actions, defaultConfig } from 'internals'

const requestAuth = () =>
  browser.runtime.sendMessage({
    type: actions.REQUEST_AUTHENTICATION,
  })

const resetConfig = () =>
  browser.runtime.sendMessage({
    type: actions.RESET_CONFIG,
  })

const saveConfig = (config: Partial<Config>) =>
  browser.runtime.sendMessage({
    type: actions.SAVE_CONFIG,
    data: config,
  })

const Content = () => {
  const [config, setConfig] = useState<Config>(defaultConfig)
  const [reloadConfig, setReloadConfig] = useState<boolean>(true)

  const formik = useFormik({
    initialValues: {
      ...config,
    },
    onSubmit: async (values: Partial<Config>) => {
      delete values.scrobbler
      await saveConfig(values)
    },
  })

  useEffect(() => {
    const updateConfig = async () => {
      setReloadConfig(false)
      const newConfig = (await browser.runtime.sendMessage({
        type: actions.GET_CONFIG,
      })) as Config
      setConfig(newConfig)
      formik.setValues(newConfig)
    }

    if (reloadConfig) {
      updateConfig()
    }
  }, [reloadConfig])

  return (
    <div>
      <button onClick={requestAuth}>auth</button>
      <button
        id="resetConfig"
        onClick={async () => {
          await resetConfig()
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
