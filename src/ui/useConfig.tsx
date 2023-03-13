import { useState, useEffect } from 'react'
import type { Config } from '../interfaces'
import { bgActions, defaultConfig } from 'internals'

const useConfig = () => {
  const [config, setConfig] = useState<Config>(defaultConfig)
  const [shouldReloadConfig, setShouldReloadConfig] = useState<boolean>(true)

  useEffect(() => {
    const updateConfig = async () => {
      setShouldReloadConfig(false)
      const newConfig = await bgActions.getConfig()
      setConfig(newConfig)
    }

    if (shouldReloadConfig) {
      updateConfig()
    }
  }, [shouldReloadConfig])

  const reloadConfig = () => setShouldReloadConfig(true)

  const saveConfig = async (newConfig: Partial<Config>) => {
    await bgActions.saveConfig(newConfig)
    reloadConfig()
  }

  const resetConfig = async () => {
    await bgActions.resetConfig()
    reloadConfig()
  }

  return { config, reloadConfig, saveConfig, resetConfig }
}

export default useConfig
