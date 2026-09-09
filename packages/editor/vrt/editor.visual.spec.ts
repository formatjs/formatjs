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
