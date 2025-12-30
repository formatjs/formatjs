import * as React from 'react'
import {useEffect, useState} from 'react'
import {Box, TextField, Paper} from '@mui/material'
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
    <Paper
      elevation={0}
      sx={{
        my: 3,
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Box
        component="form"
        sx={{display: 'flex', flexDirection: 'column', gap: 2}}
      >
        <TextField
          label="ICU Message"
          multiline
          fullWidth
          minRows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Enter ICU message format..."
        />

        <TextField
          label="Values as JSON"
          fullWidth
          value={values}
          onChange={e => setValues(e.target.value)}
          placeholder="{}"
        />

        <TextField
          label="Result"
          fullWidth
          value={error || result}
          error={!!error}
          helperText={error ? 'Error in ICU message format' : ''}
          InputProps={{
            readOnly: true,
          }}
        />
      </Box>
    </Paper>
  )
}
