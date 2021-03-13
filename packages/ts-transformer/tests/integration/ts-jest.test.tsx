import {msg, Component, formattedMessage} from './comp'
import * as React from 'react'
import * as ReactDOMServer from 'react-dom/server'
describe('ts-jest transformer', function () {
  it('should work with ts-jest', function () {
    expect(msg).toEqual({
      defaultMessage: [
        {
          type: 0,
          value: 'defineMessage',
        },
      ],
      id: 'Vg+BA7',
    })
  })
  it('intl.formatMessage', function () {
    expect(formattedMessage).toEqual({
      defaultMessage: [
        {
          type: 0,
          value: 'formatMessage',
        },
      ],
      id: 'w8L3pO',
    })
  })
  it('Comp', function () {
    expect(ReactDOMServer.renderToString(<Component />)).toEqual(
      '<span data-reactroot="">lQsqfv<!-- --> - <!-- -->[{&quot;type&quot;:0,&quot;value&quot;:&quot;test message&quot;}]<!-- --> - <!-- --> <!-- -->- <!-- -->fooo</span>'
    )
  })
})
