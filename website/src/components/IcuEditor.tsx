import React, {useEffect, useId, useRef, useState} from 'react'
import IntlMessageFormat from 'intl-messageformat'
import styles from './styles.module.css'

export interface IcuEditorProps {
  defaultMessage?: string
  defaultValues?: string
}

export const IcuEditor = ({defaultMessage, defaultValues}: IcuEditorProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const [message, setMessage] = useState<string>(defaultMessage || '')
  const [values, setValues] = useState<string>(defaultValues || '{}')
  const [error, setError] = useState<boolean>(false)
  const [result, setResult] = useState<string>('')

  const messageId = useId()
  const valuesId = useId()
  const resultId = useId()

  useEffect(() => {
    try {
      let opts = {}
      try {
        opts = JSON.parse(values)
      } catch (err) {
        //Ignore invalid JSON error
      }

      const msg = new IntlMessageFormat(message).format(opts) as string
      setError(false)
      setResult(msg)
    } catch (err) {
      if (err instanceof Error) {
        setResult(err.message)
        setError(true)
      }
    }
  }, [values, message])

  const resizeTextArea = () => {
    if (textAreaRef?.current) {
      textAreaRef.current.style.height = 'auto'
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px'
    }
  }

  useEffect(resizeTextArea, [message])

  return (
    <form className={styles.form}>
      <div>
        <label htmlFor={messageId} className={styles.label}>
          ICU Message
        </label>
        <pre>
          <textarea
            className={styles.textarea}
            id={messageId}
            onChange={e => setMessage(e.target.value)}
            value={message}
            ref={textAreaRef}
          />
        </pre>
      </div>
      <div>
        <label htmlFor={valuesId} className={styles.label}>
          Values as JSON
        </label>
        <pre>
          <input
            className={styles.wFull}
            id={valuesId}
            type="text"
            onChange={e => setValues(e.target.value)}
            value={values}
          />
        </pre>
      </div>
      <div>
        <label htmlFor={resultId} className={styles.label}>
          Result
        </label>
        <pre>
          <input
            id={resultId}
            type="text"
            value={result}
            readOnly
            disabled
            className={styles.wFull}
          />
          {error && <p>{error}</p>}
        </pre>
      </div>
    </form>
  )
}
