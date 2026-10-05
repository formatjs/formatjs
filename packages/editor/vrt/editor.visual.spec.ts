import {expect, test} from '@playwright/test'

test('page renders, validates ICU, and recovers after editing', async ({
  page,
}) => {
  await page.goto('/')
  const editor = page.locator('#editor-root')
  const translation = page.getByRole('textbox', {
    name: 'Translation',
    exact: true,
  })
  await expect(translation).toHaveValue('')
  await expect(editor).toHaveScreenshot('editor-loaded.png')

  await translation.fill('{name')
  await expect(page.getByRole('alert')).toContainText('Invalid ICU message')
  await expect(translation).toBeFocused()
  await expect(editor).toHaveScreenshot('editor-invalid.png')

  await translation.fill('Bonjour, {name}')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await translation.blur()
  await expect(editor).toHaveScreenshot('editor-editing.png')
})

test('page saves a locale draft and filters translated messages', async ({
  page,
}) => {
  await page.goto('/?workflow=1')
  const translation = page.getByRole('textbox', {
    name: 'Translation',
    exact: true,
  })
  const locale = page.getByRole('combobox', {name: 'Target locale'})
  await translation.fill('Bonjour, {name}')
  await locale.selectOption('ru')
  await translation.fill('Привет, {name}')
  await locale.selectOption('fr')
  await expect(translation).toHaveValue('Bonjour, {name}')
  await page
    .getByRole('button', {name: 'Save translation', exact: true})
    .click()
  await expect(page.getByRole('status')).toHaveText('Translation saved.')
  const status = page.getByRole('combobox', {name: 'Status', exact: true})
  await status.selectOption('translated')
  await expect(page.getByRole('navigation').getByRole('button')).toHaveCount(1)
  await status.blur()
  await page.mouse.move(0, 0)
  await expect(page.locator('#editor-root')).toHaveScreenshot(
    'editor-workflow.png'
  )
})
