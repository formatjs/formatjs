import {expect, test} from '@playwright/test'
import type {Editable} from './editor.fixture.js'

test('mounted editor retains translation while its provider direction changes', async ({
  mount,
}) => {
  const component = await mount<typeof Editable>('Editor/Editable', {
    direction: 'ltr',
  })
  const translation = component.getByRole('textbox', {
    name: 'Translation',
    exact: true,
  })
  await translation.fill('Bonjour {name}')
  await component.update({direction: 'rtl'})
  await expect(component.locator('[dir]')).toHaveAttribute('dir', 'rtl')
  await expect(translation).toHaveValue('Bonjour {name}')
  await component
    .getByRole('button', {name: 'Clear translation', exact: true})
    .click()
  await expect(translation).toHaveValue('')
  await component.unmount()
  await expect(component).toBeEmpty()
})

test('fresh mounts isolate drafts and validate ICU in the real editor', async ({
  mount,
}) => {
  const component = await mount('Editor/Editable')
  const translation = component.getByRole('textbox', {
    name: 'Translation',
    exact: true,
  })
  await translation.fill('{name')
  await expect(component.getByRole('alert')).toContainText(
    'Invalid ICU message'
  )
  const fresh = await mount('Editor/Editable')
  await expect(
    fresh.getByRole('textbox', {name: 'Translation', exact: true})
  ).toHaveValue('')
  await expect(fresh.getByRole('alert')).toHaveCount(0)
})
