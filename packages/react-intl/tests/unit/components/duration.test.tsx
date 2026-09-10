import {cleanup, render} from '@testing-library/react'
import {afterEach, expect, it} from 'vitest'
import {
  FormattedDuration,
  FormattedDurationParts,
  IntlProvider,
  useIntl,
} from '#packages/react-intl/index.js'
import {createIntl as createServerIntl} from '#packages/react-intl/server.js'

const DURATION = {hours: 1, minutes: 2, seconds: 3}

afterEach(cleanup)

it('uses provider locale and named formats and updates when they change', () => {
  const {container, rerender} = render(
    <IntlProvider
      locale="en"
      textComponent="span"
      formats={{duration: {elapsed: {style: 'long'}}}}
    >
      <FormattedDuration value={DURATION} format="elapsed" />
    </IntlProvider>
  )
  expect(container.innerHTML).toBe('<span>1 hour, 2 minutes, 3 seconds</span>')
  rerender(
    <IntlProvider
      locale="fr"
      formats={{duration: {elapsed: {style: 'digital'}}}}
    >
      <FormattedDuration value={DURATION} format="elapsed" />
    </IntlProvider>
  )
  expect(container.textContent).toBe(
    new Intl.DurationFormat('fr', {style: 'digital'}).format(DURATION)
  )
})

it('passes the formatted duration to a render function with explicit option overrides', () => {
  const {container} = render(
    <IntlProvider
      locale="en"
      formats={{duration: {elapsed: {style: 'digital'}}}}
    >
      <FormattedDuration value={DURATION} format="elapsed" style="long">
        {text => <strong>{text}</strong>}
      </FormattedDuration>
    </IntlProvider>
  )
  expect(container.innerHTML).toBe(
    '<strong>1 hour, 2 minutes, 3 seconds</strong>'
  )
})

it('passes localized parts including units to the render function', () => {
  const {container} = render(
    <IntlProvider locale="en">
      <FormattedDurationParts value={{minutes: 3, seconds: 42}} style="long">
        {parts => (
          <>
            {parts.map((part, index) =>
              part.type === 'integer' ? (
                <b key={index} data-unit={part.unit}>
                  {part.value}
                </b>
              ) : (
                part.value
              )
            )}
          </>
        )}
      </FormattedDurationParts>
    </IntlProvider>
  )
  expect(container.innerHTML).toBe(
    '<b data-unit="minute">3</b> minutes, <b data-unit="second">42</b> seconds'
  )
})

it('exposes duration formatting through useIntl and the server entry point', () => {
  function Duration() {
    const intl = useIntl()
    return <>{intl.formatDuration(DURATION, {style: 'long'})}</>
  }
  const {container} = render(
    <IntlProvider locale="en">
      <Duration />
    </IntlProvider>
  )
  expect(container.textContent).toBe('1 hour, 2 minutes, 3 seconds')
  const intl = createServerIntl({locale: 'en'})
  expect(intl.formatDuration(DURATION, {style: 'long'})).toBe(
    container.textContent
  )
  expect(
    intl
      .formatDurationToParts(DURATION, {style: 'long'})
      .map(part => part.value)
      .join('')
  ).toBe(container.textContent)
})
