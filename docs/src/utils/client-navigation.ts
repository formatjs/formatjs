export const NAVIGATION_EVENT = 'formatjs:navigate'

export function navigate(url: string): void {
  const destination = new URL(url, window.location.href)

  if (destination.origin !== window.location.origin) {
    window.location.assign(destination.href)
    return
  }

  window.history.pushState(null, '', destination.href)
  window.dispatchEvent(new Event(NAVIGATION_EVENT))
}

export function handleNavigationClick(event: MouseEvent): void {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  ) {
    return
  }

  const element = event.target
  const anchor =
    element instanceof Element
      ? element.closest<HTMLAnchorElement>('a[href]')
      : null

  if (
    !anchor ||
    anchor.hasAttribute('download') ||
    (anchor.target && anchor.target !== '_self')
  ) {
    return
  }

  const destination = new URL(anchor.href, window.location.href)

  if (
    destination.origin !== window.location.origin ||
    (destination.pathname !== '/' &&
      !destination.pathname.startsWith('/docs/')) ||
    (destination.pathname === window.location.pathname &&
      destination.search === window.location.search &&
      destination.hash)
  ) {
    return
  }

  event.preventDefault()
  navigate(destination.href)
}
