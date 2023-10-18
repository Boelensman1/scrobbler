import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Field, FieldArray, Form, Formik, useFormikContext } from 'formik'

import { bgActions } from 'internals'

import type { Config } from '../interfaces'
import useConfig from './useConfig'
import useScrobblerState from './useScrobblerState'
import useEdittedTracks from './useEdittedTracks'
import useSavedRegexes from './useSavedRegexes'

import SavedRegexDisplay from './SavedRegexDisplay'

const InvidiousHostList = () => {
  const { values } = useFormikContext<Config>()
  const hosts = values.connectorConfig.invidious.hosts
  return (
    <div>
      <h1>Invidious Host List</h1>
      <FieldArray
        name="connectorConfig.invidious.hosts"
        render={(arrayHelpers) => (
          <div>
            {hosts &&
              hosts.map &&
              hosts.map((_host, index) => (
                <div key={index}>
                  <Field name={`connectorConfig.invidious.hosts.${index}`} />

                  <button
                    type="button"
                    onClick={() => arrayHelpers.remove(index)}
                  >
                    -
                  </button>

                  <button
                    type="button"
                    onClick={() => arrayHelpers.insert(index, '')}
                  >
                    +
                  </button>
                </div>
              ))}
            <button type="button" onClick={() => arrayHelpers.push('')}>
              Add a host
            </button>
          </div>
        )}
      />
    </div>
  )
}

const SyncFormAndConfig = ({ config }: { config: Config }) => {
  const formik = useFormikContext<Config>()

  useEffect(() => {
    if (config) {
      formik.setValues(config)
    }
  }, [config])

  return null
}

const Content = () => {
  const [addingRegex, setAddingRegex] = useState(false)
  const { config, saveConfig, resetConfig } = useConfig()
  const { connectorState, globalState } = useScrobblerState()
  const { edittedTracks } = useEdittedTracks()
  const { savedRegexes } = useSavedRegexes()

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

        <Formik
          initialValues={{ ...config }}
          onSubmit={async (values: Partial<Config>) => {
            delete values.scrobbler
            saveConfig(values)
          }}
        >
          <Form>
            <SyncFormAndConfig config={config} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div>
                <label htmlFor="minimumScrobblerQuality">
                  Minimum scrobbler quality{' '}
                </label>
                <Field name={`minimumScrobblerQuality`} />
              </div>

              <div>
                <label htmlFor="scrobblerCompensateForVideoAge">
                  Scrobbler compensate for video age (newer videos need less
                  quality){' '}
                </label>
                <Field name="scrobblerCompensateForVideoAge" type="checkbox" />
              </div>

              <div>
                <label htmlFor="scrobblerQualityDynamic">
                  Dynamic scrobbler quality{' '}
                </label>
                <Field name="scrobblerQualityDynamic" type="checkbox" />
              </div>

              <div>
                <label htmlFor="youtubeApiKey">
                  Youtube Api Key (allows scrobbling of embedded){' '}
                </label>
                <Field name="youtubeApiKey" />
              </div>

              <div>
                <InvidiousHostList />
              </div>

              <div>
                <label htmlFor="debug">Debug </label>
                <Field name="debug" type="checkbox" />
              </div>

              <div>
                <button type="submit">Save</button>
              </div>
            </div>
          </Form>
        </Formik>

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
