import {expect, test} from '@playwright/test'

test('loads messages and lets the user edit a translation', async ({page}) => {
  await page.goto('/')
  await expect(page.getByText('Welcome,', {exact: false})).toBeVisible()
  const translation = page.getByRole('textbox', {
    name: 'Translate',
    exact: true,
  })
  await translation.click()
  await translation.fill('Bonjour, {name}')
  await page.getByRole('heading', {name: 'English message'}).click()
  await expect(translation).toHaveValue('Bonjour, {name}')
  await translation.click()
  await translation.press('ControlOrMeta+A')
  await translation.press('Backspace')
  await expect(translation).toBeEmpty()
})

test('renders messages supplied by a test-owned API fixture', async ({
  page,
}) => {
  const messages = Object.fromEntries(
    Array.from({length: 51}, (_, index) => [
      `message-${index}`,
      index === 50 ? 'A message supplied by the E2E test' : 'Earlier message',
    ])
  )
  await page.route('**/fixtures/*.json', route =>
    route.fulfill({json: messages})
  )
  await page.goto('/')
  const message = page.getByText('A message supplied by the E2E test', {
    exact: true,
  })
  await expect(message).toBeVisible()
  await expect(
    page.getByRole('list').filter({has: message}).getByRole('listitem')
  ).toHaveCount(1)
  const search = page.getByRole('searchbox', {name: 'Search message'})
  await search.click()
  await search.fill('supplied')
  await expect(search).toHaveValue('supplied')
  // Search filtering is not implemented by this legacy editor yet.
  await expect(message).toBeVisible()
})
