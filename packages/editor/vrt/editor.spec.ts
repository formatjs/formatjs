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
