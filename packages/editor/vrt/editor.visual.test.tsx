import React from 'react'
import ReactDOM from 'react-dom'
import {afterEach, expect, test} from 'vitest'
import {page} from 'vitest/browser'
import App from '../index'

afterEach(() => {
  ReactDOM.unmountComponentAtNode(document.getElementById('editor-root')!)
  document.body.innerHTML = ''
})

for (const scenario of ['loaded', 'editing']) {
  test(`editor ${scenario}`, async () => {
    const root = document.createElement('div')
    root.id = 'editor-root'
    document.body.appendChild(root)
    ReactDOM.render(<App />, root)
    await expect
      .element(page.getByText('Welcome,', {exact: false}))
      .toBeVisible()
    await expect.element(page.getByRole('textbox')).toBeVisible()
    if (scenario === 'editing') {
      await page.getByRole('textbox').fill('Bonjour, {name}')
      await page.getByRole('heading', {name: 'English message'}).click()
    }
    await document.fonts.ready
    await expect(root).toMatchScreenshot(`editor-${scenario}`)
  })
}
