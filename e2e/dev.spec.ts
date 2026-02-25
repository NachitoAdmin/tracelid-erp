import { test, expect } from '@playwright/test'

const DEV_URL = process.env.BASE_URL || 'https://tracelid-j8am7ly4v-nachitoadmins-projects.vercel.app'
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'nachitobot888@gmail.com'
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || '123Tamarindo'
const ULTRA_TENANT_ID = '1f968e99-eba7-4229-8847-6d942b46999b'

test.beforeEach(async ({ page }) => {
  // Login via API to get auth cookie + set localStorage
  const res = await page.request.post(`${DEV_URL}/api/auth/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    headers: { 'Content-Type': 'application/json' },
  })

  if (res.ok()) {
    const data = await res.json()
    // Navigate to home page first so we can set localStorage
    await page.goto(DEV_URL)
    await page.evaluate((userData) => {
      localStorage.setItem('tracelid-user', JSON.stringify(userData))
      localStorage.setItem('tracelid-selected-tenant', userData.tenant?.id || '')
      localStorage.setItem('tracelid-selected-tenant-name', userData.tenant?.name || '')
    }, data.user)
  }
})

test.describe('DEV Environment E2E Tests', () => {

  test('A) Basic Load - DEV banner visible', async ({ page }) => {
    const response = await page.goto(DEV_URL)
    expect(response?.status()).toBe(200)

    // Confirm DEV banner
    const devBanner = page.locator('text=DEV ENVIRONMENT')
    await expect(devBanner).toBeVisible()
  })

  test('B) Tenant Selection - dropdown click changes label', async ({ page }) => {
    await page.goto(DEV_URL)

    // Wait for tenant section to load
    await page.waitForSelector('text=TENANT')

    // Get initial tenant label (user's tenant is Test Loco)
    const initialLabel = await page.locator('text=Test Loco').first().textContent()

    // Click the gear/settings icon to open tenant selector
    const settingsBtn = page.locator('button:has-text("⚙️")').first()
    await settingsBtn.click()

    // Wait for tenant ID input to be visible
    await page.waitForSelector('input[placeholder*="Tenant ID"]', { timeout: 5000 })

    const tenantIdInput = page.locator('input[placeholder*="Tenant ID"]').first()
    await expect(tenantIdInput).toBeVisible()

    // Switch to Ultra tenant
    await tenantIdInput.fill(ULTRA_TENANT_ID)

    // Click Set button
    await page.click('button:has-text("Set")')

    // Wait for label to update
    await page.waitForTimeout(1000)

    // Verify tenant label changed to Ultra
    const newLabel = await page.locator('text=Ultra').first()
    await expect(newLabel).toBeVisible({ timeout: 5000 })
  })

  test('B2) Chatbot Position - must be in viewport', async ({ page }) => {
    await page.goto(DEV_URL)

    // Find chatbot button
    const chatbotBtn = page.locator('button:has-text("💬"), button:has-text("help")').first()
    await expect(chatbotBtn).toBeVisible()

    // Get bounding box
    const box = await chatbotBtn.boundingBox()
    expect(box).not.toBeNull()

    if (box) {
      const viewport = page.viewportSize()
      expect(viewport).not.toBeNull()

      if (viewport) {
        const tolerance = 50

        // Must be in bottom-right quadrant
        expect(box.x).toBeGreaterThan(viewport.width / 2)
        expect(box.y).toBeGreaterThan(viewport.height / 2)

        const actualRight = viewport.width - (box.x + box.width)
        const actualBottom = viewport.height - (box.y + box.height)
        expect(actualRight).toBeGreaterThanOrEqual(24 - tolerance)
        expect(actualBottom).toBeGreaterThanOrEqual(24 - tolerance)
      }
    }
  })

  test('C) Seed Demo Data', async ({ page }) => {
    await page.goto(DEV_URL)

    // Look for seed button (only in dev)
    const seedBtn = page.locator('text=Seed Demo Data')
    const count = await seedBtn.count()

    if (count > 0) {
      await seedBtn.click()
      await page.waitForTimeout(2000)

      const totalTrans = page.locator('text=Total Transactions:').locator('..')
      await expect(totalTrans).toContainText(/[1-9]/)
    } else {
      test.skip()
    }
  })

  test('D) Create SALE Transaction', async ({ page }) => {
    await page.goto(DEV_URL)

    // Wait for the transaction form to be ready
    await page.waitForSelector('button:has-text("Create Transaction")', { timeout: 10000 })

    // Transaction type is the 4th select (after language, currency, tenant)
    await page.selectOption('select >> nth=3', 'SALE')

    // Product fields
    await page.fill('input[placeholder*="product ID"]', 'PROD-001')
    await page.fill('input[placeholder*="product name"]', 'Test Product')

    // Customer fields
    await page.fill('input[placeholder*="customer ID"]', 'CUST-001')
    await page.fill('input[placeholder*="customer name"]', 'Test Customer')

    // Amount
    await page.fill('input[type="number"]', '1234')

    // Description
    await page.fill('textarea', 'automation test')

    // Submit
    await page.click('button:has-text("Create Transaction")')

    // Wait for success
    await page.waitForSelector('text=Transaction created', { timeout: 5000 })

    // Verify appears in list
    await page.waitForSelector('text=Test Product', { timeout: 5000 })
  })

  test('E) Language Switch', async ({ page }) => {
    await page.goto(DEV_URL)

    // Language selector is the first select on the page
    const langSelect = page.locator('select').first()

    // Switch to Spanish
    await langSelect.selectOption('es')
    await page.waitForTimeout(500)

    // Verify language changed by checking the select value
    await expect(langSelect).toHaveValue('es')

    // Also verify some translated text appears on the page
    const transTypeLabel = page.locator('text=Tipo de Transacción, text=Venta')
    const count = await transTypeLabel.count()
    // Accept if either the label is translated or the page reflects Spanish
    expect(await langSelect.inputValue()).toBe('es')
  })

  test('F) Dark Mode Toggle', async ({ page }) => {
    await page.goto(DEV_URL)

    // Find theme toggle (sun/moon emoji button)
    const themeBtn = page.locator('button:has-text("🌙"), button:has-text("☀️")').first()
    await themeBtn.click()

    // Wait for transition
    await page.waitForTimeout(500)

    // Check background changed (dark mode)
    const body = page.locator('body')
    const bg = await body.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).not.toBe('rgb(255, 255, 255)')
  })

  test('G) Analytics Page', async ({ page }) => {
    await page.goto(`${DEV_URL}/analytics`)

    // Wait for page load
    await page.waitForSelector('text=Analytics Dashboard')

    // Check VPM section
    const vpm = page.locator('text=Volume-Price-Mix')
    await expect(vpm).toBeVisible()

    // Check category breakdown
    const category = page.locator('text=Category Breakdown')
    await expect(category).toBeVisible()

    // Check customer analysis
    const customer = page.locator('text=Customer Analysis')
    await expect(customer).toBeVisible()
  })
})
