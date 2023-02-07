import type { InformationProvider } from 'interfaces'
import {
  CoverArtArchiveInformationProvider,
  MusicBrainzInformationProvider,
  Track,
} from 'internals'

const informationProviders: InformationProvider[] = [
  new MusicBrainzInformationProvider(),
  new CoverArtArchiveInformationProvider(),
]

const getAdditionalDataFromInfoProviders = async (track: Track) => {
  const missingFields = track.getMissingFields()
  for (let informationProvider of informationProviders) {
    // check if some of the missing fields can be provided by this information provider
    const fieldsToProvide = informationProvider.fields.filter((f) =>
      missingFields.includes(f),
    )
    if (fieldsToProvide.length > 0) {
      const newData = await informationProvider.getAdditionalInfo(track)
      fieldsToProvide.forEach((field) => {
        // additional check on !track[field] is needed so we don't overwrite
        // info set by a previous provider
        if (newData[field] && !track[field]) {
          track[field] = newData[field]
        }
      })
    }
  }
}

export default getAdditionalDataFromInfoProviders
