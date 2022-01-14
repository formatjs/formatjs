import React from 'react'

const InputTest = ({intl}) => {
  let placeholder = intl.formatMessage({
    defaultMessage: 'test',
    id: 'Krqghu',
  })
  return (
    <input
      placeholder={placeholder}
      placeholder2={intl.formatMessage({
        defaultMessage: 'testsss',
        id: 'Krqghus',
      })}
    />
  )
}

export default InputTest
