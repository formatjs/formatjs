import * as React from 'react'
import {useEffect, useState} from 'react'
import {Input} from './ui/input'
import IntlMessageFormat from 'intl-messageformat'

export interface IcuEditorProps {
  defaultMessage?: string
  defaultValues?: string
}

export function IcuEditor({
  defaultMessage,
  defaultValues,
}: IcuEditorProps): React.ReactNode {
  const [message, setMessage] = useState<string>(defaultMessage || '')
  const [values, setValues] = useState<string>(defaultValues || '{}')
  const [error, setError] = useState<string>('')
  const [result, setResult] = useState<string>('')

  useEffect(() => {
    try {
      let opts = {}
      try {
        opts = JSON.parse(values)
      } catch {
        // Ignore invalid JSON error
      }

      const msg = new IntlMessageFormat(message).format(opts) as string
      setError('')
      setResult(msg)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
        setResult('')
      }
    }
  }, [values, message])

  return (
    <div className="my-6 p-4 border border-border rounded-md">
      <form className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">ICU Message</label>
          <textarea
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[80px]"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Enter ICU message format..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Values as JSON
          </label>
          <Input
            value={values}
            onChange={e => setValues(e.target.value)}
            placeholder="{}"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Result</label>
          <Input
            value={error || result}
            readOnly
            className={error ? 'border-destructive' : ''}
          />
          {error && (
            <p className="text-sm text-destructive mt-1">
              Error in ICU message format
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
