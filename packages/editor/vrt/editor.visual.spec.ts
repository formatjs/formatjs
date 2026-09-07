import {expect, test} from '@playwright/test'

for (const scenario of ['loaded', 'editing']) {
  test(`editor ${scenario}`, async ({page}) => {
    await page.goto(process.env.VRT_APP_URL!)
    await expect(page.getByText('Welcome,', {exact: false})).toBeVisible()
    await expect(page.getByRole('textbox')).toBeVisible()
    if (scenario === 'editing') {
      await page.getByRole('textbox').fill('Bonjour, {name}')
      await page.getByRole('heading', {name: 'English message'}).click()
    }
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('#editor-root')).toHaveScreenshot(
      `editor-${scenario}.png`
    )
  })
}
