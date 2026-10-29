import {expect, test} from '@playwright/test'
import type {Editable} from './editor.visual.js'

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

test('keyboard focus and invalid input remain accessible', async ({
  mount,
  page,
}) => {
  const component = await mount('Editor/Editable')
  await page.keyboard.press('Tab')
  await expect(component.getByRole('searchbox')).toBeFocused()
  const translation = component.getByRole('textbox', {
    name: 'Translation',
    exact: true,
  })
  await translation.fill('{name')
  await expect(translation).toHaveAttribute('aria-invalid', 'true')
  await expect(component.getByRole('alert')).toBeVisible()
})

test('editor and workflow controls fit a narrow RTL viewport', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({width: 390, height: 844})
  await mount('Editor/Editable', {direction: 'rtl'})
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
  const workflow = await mount('Editor/workflow-mobile-rtl')
  await expect(
    workflow.getByRole('combobox', {name: 'Catalog', exact: true})
  ).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
})

test('projects compose source filtering, badges, metadata and location links', async ({
  mount,
}) => {
  const component = await mount('Editor/projects')
  const source = component.getByRole('combobox', {name: 'Source', exact: true})
  const navigation = component.getByRole('navigation', {
    name: 'Messages',
    exact: true,
  })
  await expect(navigation.getByRole('button')).toHaveCount(3)
  await expect(navigation.locator('[title="Source main"]')).toBeVisible()
  await expect(
    component.getByRole('link', {name: 'src/home.tsx:12–18'})
  ).toHaveAttribute(
    'href',
    'https://git.example.com/acme/web/blob/main/src/home.tsx#L12-L18'
  )
  await expect(
    component.getByRole('button', {name: 'Copy source main'})
  ).toBeVisible()
  await navigation.getByRole('button', {name: /Legacy message/}).click()
  await expect(component.getByText('Sources', {exact: true})).toHaveCount(0)
  await expect(component.getByRole('link')).toHaveCount(0)
  await source.selectOption('release/2026.10')
  await expect(navigation.getByRole('button')).toHaveCount(2)
  await component
    .getByRole('combobox', {name: 'Project', exact: true})
    .selectOption('mobile')
  await expect(source).toHaveValue('')
  await expect(source.getByRole('option')).toHaveText([
    'All sources',
    'android',
    'ios',
  ])
  await expect(navigation.getByRole('button')).toHaveCount(1)
  await expect(navigation).toContainText('Open settings')
  await expect(
    component.getByRole('textbox', {name: 'French translation'})
  ).toHaveValue('Ouvrir les paramètres')
})

test('project picker preserves unsaved drafts until reset', async ({mount}) => {
  const component = await mount('Editor/projects')
  const project = component.getByRole('combobox', {
    name: 'Project',
    exact: true,
  })
  const translation = component.getByRole('textbox', {
    name: 'French translation',
  })
  await translation.fill('Salut, {name}')
  await project.selectOption('mobile')
  await expect(project).toHaveValue('web')
  await expect(translation).toHaveValue('Salut, {name}')
  await expect(component.getByRole('alert')).toContainText(
    'Reset unsaved translations'
  )
  await component.getByRole('button', {name: 'Reset', exact: true}).click()
  await project.selectOption('mobile')
  await expect(project).toHaveValue('mobile')
  await expect(component.getByRole('alert')).toHaveCount(0)
})

test('project and source controls fit narrow RTL layouts', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({width: 390, height: 844})
  const component = await mount('Editor/projects-mobile-rtl')
  await expect(
    component.getByRole('combobox', {name: 'Project', exact: true})
  ).toBeVisible()
  await expect(
    component.getByRole('combobox', {name: 'Source', exact: true})
  ).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
})
