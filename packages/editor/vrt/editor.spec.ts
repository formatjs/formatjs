import {expect, test} from '@playwright/test'

test('consumer edits, searches, switches messages, and recovers from invalid ICU', async ({
  page,
}) => {
  await page.goto('/')
  const translation = page.getByRole('textbox', {
    name: 'Translation',
    exact: true,
  })
  await translation.fill('{name')
  await expect(page.getByRole('alert')).toContainText('Invalid ICU message')
  await translation.fill('Bonjour {name}')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page
    .getByRole('button', {
      name: 'You have {count, number} messages',
      exact: true,
    })
    .click()
  await page.getByRole('button', {name: 'Copy source', exact: true}).click()
  await expect(translation).toHaveValue('You have {count, number} messages')
  await page
    .getByRole('button', {name: 'Clear translation', exact: true})
    .click()
  await expect(translation).toHaveValue('')
  await page.getByRole('searchbox').fill('welcome')
  await expect(page.getByRole('navigation').getByRole('button')).toHaveCount(1)
  await page.getByRole('button', {name: 'Welcome, {name}', exact: true}).click()
  await expect(translation).toHaveValue('Bonjour {name}')
})

test('workflow keeps translation drafts across locales and saves them', async ({
  page,
}) => {
  await page.goto('/?workflow=1')
  const translation = page.getByRole('textbox', {
    name: 'Translation',
    exact: true,
  })
  await translation.fill('Bonjour, {name}')
  await page.getByRole('combobox', {name: 'Target locale'}).selectOption('ru')
  await translation.fill('Привет, {name}')
  await page.getByRole('combobox', {name: 'Target locale'}).selectOption('fr')
  await expect(translation).toHaveValue('Bonjour, {name}')
  await page
    .getByRole('button', {name: 'Save translation', exact: true})
    .click()
  await expect(page.getByRole('status')).toHaveText('Translation saved.')
  await page
    .getByRole('combobox', {name: 'Status', exact: true})
    .selectOption('translated')
  await expect(page.getByRole('navigation').getByRole('button')).toHaveCount(1)
})

test('reusable tools select locales, preview ICU, copy exact text, and recover from invalid input', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/?tools=1')
  await page.getByRole('button', {name: 'Locales: fr', exact: true}).click()
  const all = page.getByRole('checkbox', {name: 'Select all 5 locales'})
  await expect(all).toHaveAttribute('aria-checked', 'mixed')
  await page.getByRole('checkbox', {name: 'de', exact: true}).press('Space')
  await expect(
    page.getByRole('button', {name: 'Locales: 2 locales selected'})
  ).toBeVisible()
  await all.check()
  for (const locale of ['ar', 'de', 'es', 'fr', 'ja'])
    await expect(
      page.getByRole('checkbox', {name: locale, exact: true})
    ).toBeChecked()
  await page.getByRole('button', {name: 'Clear', exact: true}).click()
  await expect(all).not.toBeChecked()
  const input = page.getByRole('textbox', {name: 'ICU message'})
  const text = 'Hello\n  {name}'
  await input.fill(text)
  await page
    .getByRole('button', {name: 'Copy ICU message', exact: true})
    .click()
  await expect(page.getByRole('status')).toHaveText('Copied ICU message')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text)
  await input.fill('{broken')
  await expect(page.getByRole('alert')).toBeVisible()
  await input.fill('Hello {name}')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.setViewportSize({width: 390, height: 844})
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
})
