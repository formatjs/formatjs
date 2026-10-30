import type {ReactNode} from 'react'
import {useEditorDesignSystem} from '#packages/editor/design-system.js'
import {
  CopyTextButton,
  type CopyTextButtonProps,
} from '#packages/editor/copy-text-button.js'
import type {EditorMessage} from '#packages/editor/workflow.js'
import {
  formatSourceLocation,
  type SourceLocation,
} from '#packages/editor/source-location.js'

export interface MessageContextLabels {
  title: string
  id: string
  description: string
  catalogs: string
  sources: string
  locations: string
  catalogCopy: (catalog: string) => string
  sourceCopy: (source: string) => string
  locationCopy: (location: string) => string
}
export interface MessageContextProps {
  message?: Pick<
    EditorMessage,
    'id' | 'description' | 'catalogs' | 'sources' | 'locations'
  > | null
  labels?: Partial<MessageContextLabels>
  copyId?: boolean
  copyCatalogs?: boolean
  copySources?: boolean
  copyLocations?: boolean
  copyOptions?: Pick<
    CopyTextButtonProps,
    'writeText' | 'onCopy' | 'onError' | 'labels' | 'feedbackDurationMs'
  >
  /** Default locations are plain text, never file URLs or HTML. */
  renderLocation?: (location: SourceLocation, text: string) => ReactNode
}
const defaults: MessageContextLabels = {
  title: 'Message context',
  id: 'Message ID',
  description: 'Description',
  catalogs: 'Source catalogs',
  sources: 'Sources',
  locations: 'Source locations',
  catalogCopy: catalog => `source catalog ${catalog}`,
  sourceCopy: source => `source ${source}`,
  locationCopy: location => `source location ${location}`,
}

export function MessageContext({
  message,
  labels,
  copyId = true,
  copyCatalogs = false,
  copySources = false,
  copyLocations = false,
  copyOptions,
  renderLocation = formatSourceLocation,
}: MessageContextProps): ReactNode {
  const {Metadata} = useEditorDesignSystem()
  const text = {...defaults, ...labels}
  return (
    <Metadata label={text.title}>
      {message && (
        <dl>
          <div>
            <dt>{text.id}</dt>
            <dd>
              <code>{message.id}</code>
              {copyId && (
                <CopyTextButton
                  {...copyOptions}
                  value={message.id}
                  label={text.id}
                />
              )}
            </dd>
          </div>
          {message.description && (
            <div>
              <dt>{text.description}</dt>
              <dd>{message.description}</dd>
            </div>
          )}
          {!!message.catalogs?.length && (
            <div>
              <dt>{text.catalogs}</dt>
              <dd>
                <ul>
                  {message.catalogs.map((catalog, index) => (
                    <li key={`${catalog}:${index}`}>
                      <span>{catalog}</span>
                      {copyCatalogs && (
                        <CopyTextButton
                          {...copyOptions}
                          value={catalog}
                          label={text.catalogCopy(catalog)}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {!!message.sources?.length && (
            <div>
              <dt>{text.sources}</dt>
              <dd>
                <ul>
                  {message.sources.map((source, index) => (
                    <li key={`${source}:${index}`}>
                      <span>{source}</span>
                      {copySources && (
                        <CopyTextButton
                          {...copyOptions}
                          value={source}
                          label={text.sourceCopy(source)}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {!!message.locations?.length && (
            <div>
              <dt>{text.locations}</dt>
              <dd>
                <ul>
                  {message.locations.map((location, index) => {
                    const value = formatSourceLocation(location)
                    return (
                      <li key={`${value}:${index}`}>
                        <span>{renderLocation(location, value)}</span>
                        {copyLocations && (
                          <CopyTextButton
                            {...copyOptions}
                            value={value}
                            label={text.locationCopy(value)}
                          />
                        )}
                      </li>
                    )
                  })}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      )}
    </Metadata>
  )
}
