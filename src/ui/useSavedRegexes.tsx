import { useState, useEffect } from 'react'
import type { AddSavedRegexValues } from 'interfaces'
import { bgActions } from 'internals'

const useSavedRegexes = ({
  updateInterval,
}: { updateInterval?: number } = {}) => {
  const [savedRegexes, setSavedRegexes] = useState<AddSavedRegexValues[]>([])

  useEffect(() => {
    const updateSavedRegexes = async () => {
      const newSavedRegexes = await bgActions.getSavedRegexes()
      setSavedRegexes(newSavedRegexes)
    }

    updateSavedRegexes()
    const interval = setInterval(updateSavedRegexes, updateInterval || 500)
    return () => clearInterval(interval)
  }, [])

  return { savedRegexes }
}

export default useSavedRegexes
