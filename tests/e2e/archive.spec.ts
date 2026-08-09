import { expect, test } from '@playwright/test'

test('visitor can reach a complete tournament record', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /Ti 百科/ })).toBeVisible()
  await page.goto('/ti/6')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('第六届')
  await expect(page.getByText('Wings Gaming', { exact: true }).first()).toBeVisible()
  const teamLogo = page.locator('img[alt="Wings Gaming logo"]').first()
  await expect(teamLogo).toHaveAttribute('src', /\/media\/liquipedia\/teams\//)
  await expect.poll(async () => teamLogo.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  const regionCell = page.locator('td').filter({ hasText: '中国' }).first()
  await expect(regionCell).toHaveCSS('white-space', 'nowrap')
  await expect(page.getByText('数据截至')).toBeVisible()
  await expect(page.getByRole('link', { name: '报告数据问题' })).toHaveAttribute('href', /github\.com\/fishandsheep\/tiwiki\/issues\/new/)
})

test('static search finds aliases without a network search request', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.goto('/search')
  await page.getByRole('searchbox', { name: '搜索 Ti 百科' }).fill('made in thailand')
  await expect(page.getByRole('link', { name: /MiTH\.Trust/ })).toBeVisible()
  expect(requests.filter((url) => url.includes('query=') || url.includes('search='))).toEqual([])
})

test('keyboard user can bypass repeated navigation', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: '跳到主要内容' })
  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})

test('reduced motion keeps content visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/ti')
  await expect(page.getByRole('heading', { level: 1, name: '历届赛事' })).toBeVisible()
  await expect(page.locator('.reveal').first()).toBeVisible()
})

test('archive surfaces, adjacent navigation, and 404 remain reachable', async ({ page }) => {
  await page.goto('/china')
  await expect(page.getByRole('heading', { level: 1, name: '中国战队的 Ti征程' })).toBeVisible()
  await page.goto('/rankings')
  await expect(page.getByRole('heading', { level: 1, name: '榜单' })).toBeVisible()
  await page.goto('/ti/6')
  await expect(page.getByRole('navigation', { name: '相邻赛事' }).getByRole('link', { name: /Ti5/ })).toBeVisible()
  const response = await page.goto('/not-a-real-page')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1, name: '这页还没收录' })).toBeVisible()
})
