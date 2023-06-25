import { useState, useEffect } from 'react'
import type { StringifiedSavedRegex } from 'interfaces'
import { bgActions } from 'internals'

const useSavedRegexes = ({
  updateInterval,
}: { updateInterval?: number } = {}) => {
  const [savedRegexes, setSavedRegexes] = useState<StringifiedSavedRegex[]>([])

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
