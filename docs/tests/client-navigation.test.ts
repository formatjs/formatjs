// @vitest-environment happy-dom
import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  handleNavigationClick,
  NAVIGATION_EVENT,
  navigate,
} from '../src/utils/client-navigation'

function click(
  anchor: HTMLAnchorElement,
  options: MouseEventInit = {}
): MouseEvent {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    ...options,
  })

  Object.defineProperty(event, 'target', {value: anchor})
  handleNavigationClick(event)

  return event
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('client navigation', () => {
  it('changes docs routes without reloading the document', () => {
    const listener = vi.fn()
    const anchor = document.createElement('a')
    anchor.href = '/docs/skills/translate'

    window.addEventListener(NAVIGATION_EVENT, listener)
    const event = click(anchor)

    expect(event.defaultPrevented).toBe(true)
    expect(window.location.pathname).toBe('/docs/skills/translate')
    expect(listener).toHaveBeenCalledOnce()

    window.removeEventListener(NAVIGATION_EVENT, listener)
  })

  it('preserves search-result anchors during client navigation', () => {
    navigate('/docs/react-intl/api#formatmessage')

    expect(window.location.pathname).toBe('/docs/react-intl/api')
    expect(window.location.hash).toBe('#formatmessage')
  })

  it('preserves modified-click browser behavior', () => {
    const anchor = document.createElement('a')
    anchor.href = '/docs/skills/translate'

    expect(click(anchor, {metaKey: true}).defaultPrevented).toBe(false)
    expect(window.location.pathname).toBe('/')
  })

  it('preserves external-link browser behavior', () => {
    const anchor = document.createElement('a')
    anchor.href = 'https://github.com/formatjs/formatjs'

    expect(click(anchor).defaultPrevented).toBe(false)
    expect(window.location.pathname).toBe('/')
  })

  it('preserves same-page heading anchor behavior', () => {
    window.history.replaceState(null, '', '/docs/react-intl/api')
    const anchor = document.createElement('a')
    anchor.href = '#formatmessage'

    expect(click(anchor).defaultPrevented).toBe(false)
    expect(window.location.pathname).toBe('/docs/react-intl/api')
  })
})
