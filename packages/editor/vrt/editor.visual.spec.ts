import {expect, test} from '@playwright/test'

for (const scenario of ['loaded', 'editing']) {
  test(`editor ${scenario}`, async ({page}) => {
    await page.goto(process.env.VRT_APP_URL!)
    await expect(
      page.getByRole('heading', {name: 'Message editor', exact: true})
    ).toBeVisible()
    const translation = page.getByRole('textbox', {
      name: 'Translation',
      exact: true,
    })
    await expect(translation).toBeVisible()
    if (scenario === 'editing') {
      await translation.fill('Bonjour, {name}')
      await page.getByRole('heading', {name: 'Source message'}).click()
    }
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('#editor-root')).toHaveScreenshot(
      `editor-${scenario}.png`
    )
  })
}

test('consumer edits, searches, switches messages, and recovers from invalid ICU', async ({
  page,
}) => {
  await page.goto(process.env.VRT_APP_URL!)
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

test('keyboard focus and invalid translation remain visible', async ({
  page,
}) => {
  await page.goto(process.env.VRT_APP_URL!)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('searchbox')).toBeFocused()
  const translation = page.getByRole('textbox', {
    name: 'Translation',
    exact: true,
  })
  await translation.fill('{name')
  await expect(translation).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.locator('#editor-root')).toHaveScreenshot(
    'editor-invalid.png'
  )
})

test('narrow RTL layout fits without horizontal scrolling', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844})
  await page.goto(`${process.env.VRT_APP_URL!}?rtl=1`)
  await page
    .getByRole('textbox', {name: 'Translation', exact: true})
    .fill('مرحبًا، {name}')
  await page.getByRole('heading', {name: 'Source message'}).click()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
  await expect(page.locator('#editor-root')).toHaveScreenshot(
    'editor-mobile-rtl.png'
  )
})

test('workflow saves, filters catalogs, and retains locale drafts', async ({
  page,
}) => {
  await page.goto(`${process.env.VRT_APP_URL!}?workflow=1`)
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
  await page.getByRole('heading', {name: 'Source message'}).click()
  await expect(page.locator('#editor-root')).toHaveScreenshot(
    'editor-workflow.png'
  )
})

test('workflow controls fit a narrow RTL viewport', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844})
  await page.goto(`${process.env.VRT_APP_URL!}?workflow=1&rtl=1`)
  await expect(
    page.getByRole('combobox', {name: 'Catalog', exact: true})
  ).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
  await expect(page.locator('#editor-root')).toHaveScreenshot(
    'editor-workflow-mobile-rtl.png'
  )
})
