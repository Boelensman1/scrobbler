import { useState, useEffect } from 'react'
import type { EdittedTracks } from 'interfaces'
import { bgActions } from 'internals'

const useEdittedTracks = ({
  updateInterval,
}: { updateInterval?: number } = {}) => {
  const [edittedTracks, setEdittedTracks] = useState<EdittedTracks>({})

  useEffect(() => {
    const updateEdittedTracks = async () => {
      const newEdittedTracks = await bgActions.getEdittedTracks()
      setEdittedTracks(newEdittedTracks)
    }

    updateEdittedTracks()
    const interval = setInterval(updateEdittedTracks, updateInterval || 500)
    return () => clearInterval(interval)
  }, [])

  return { edittedTracks }
}

export default useEdittedTracks
