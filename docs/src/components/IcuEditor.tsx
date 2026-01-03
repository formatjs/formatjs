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
    <div className="my-6 p-6 border border-purple-500/20 rounded-lg bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
      <div className="mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-purple-300">
          ICU Message Editor
        </h3>
      </div>
      <form className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="icu-message-input"
            className="block text-sm font-semibold mb-2 text-purple-300"
          >
            ICU Message
          </label>
          <textarea
            id="icu-message-input"
            className="flex w-full rounded-md border border-purple-500/30 bg-gray-950/50 px-4 py-3 text-base shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[80px] text-gray-200 font-mono transition-all"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Enter ICU message format..."
            rows={3}
          />
        </div>

        <div>
          <label
            htmlFor="values-input"
            className="block text-sm font-semibold mb-2 text-purple-300"
          >
            Values as JSON
          </label>
          <Input
            id="values-input"
            value={values}
            onChange={e => setValues(e.target.value)}
            placeholder="{}"
            className="border-purple-500/30 bg-gray-950/50 text-gray-200 font-mono focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="result-input"
            className="block text-sm font-semibold mb-2 text-purple-300"
          >
            Result
          </label>
          <Input
            id="result-input"
            value={error || result}
            readOnly
            className={`border-purple-500/30 bg-purple-900/20 text-gray-200 font-medium ${
              error ? 'border-red-500/50 bg-red-900/20 text-red-300' : ''
            }`}
          />
          {error && (
            <div className="mt-2 p-3 rounded-md bg-red-900/20 border border-red-500/30">
              <p className="text-sm text-red-300 flex items-center gap-2">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Error in ICU message format
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
