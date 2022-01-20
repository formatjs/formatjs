import React from 'react'

const InputTest = ({intl}) => {
  let placeholder = intl.formatMessage({
    defaultMessage: 'test',
    id: 'Krqghu',
  })
  console.log(
    intl.formatMessage({
      defaultMessage: 'in call',
    })
  )
  return (
    <div>
      {getFieldDecorator('emails', {
        rules: [
          {
            required: true,
            message: intl.formatMessage({
              defaultMessage: 'nesttt',
              id: '1',
            }),
          },
        ],
      })(
        <input
          placeholder={placeholder}
          placeholder2={intl.formatMessage({
            defaultMessage: 'testsss',
            id: 'Krqghus',
          })}
        />
      )}
    </div>
  )
}

export default InputTest
