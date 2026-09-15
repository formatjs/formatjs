import type {ReactNode} from 'react'
import {useEditorDesignSystem} from '#packages/editor/design-system.js'
import {
  CopyTextButton,
  type CopyTextButtonProps,
} from '#packages/editor/copy-text-button.js'
import type {EditorMessage, SourceLocation} from '#packages/editor/workflow.js'

export interface MessageContextLabels {
  title: string
  id: string
  description: string
  catalogs: string
  locations: string
  catalogCopy: (catalog: string) => string
  locationCopy: (location: string) => string
}
export interface MessageContextProps {
  message?: Pick<
    EditorMessage,
    'id' | 'description' | 'catalogs' | 'locations'
  > | null
  labels?: Partial<MessageContextLabels>
  copyId?: boolean
  copyCatalogs?: boolean
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
  locations: 'Source locations',
  catalogCopy: catalog => `source catalog ${catalog}`,
  locationCopy: location => `source location ${location}`,
}
function locationText(location: SourceLocation): string {
  const start = location.start === undefined ? '' : `:${location.start}`
  const end =
    location.end === undefined
      ? ''
      : `${location.start === undefined ? ':' : '–'}${location.end}`
  return `${location.file}${start}${end}`
}

export function MessageContext({
  message,
  labels,
  copyId = true,
  copyCatalogs = false,
  copyLocations = false,
  copyOptions,
  renderLocation = locationText,
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
          {!!message.locations?.length && (
            <div>
              <dt>{text.locations}</dt>
              <dd>
                <ul>
                  {message.locations.map((location, index) => {
                    const value = locationText(location)
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
