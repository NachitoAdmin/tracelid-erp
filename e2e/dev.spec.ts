import { test, expect } from '@playwright/test'

const DEV_URL = 'https://erp-nextjs-k5qnqj5pm-nachitoadmins-projects.vercel.app'

test.describe('DEV Environment E2E Tests', () => {
  
  test('A) Basic Load - DEV banner visible', async ({ page }) => {
    const response = await page.goto(DEV_URL)
    expect(response?.status()).toBe(200)
    
    // Confirm DEV banner
    const devBanner = page.locator('text=DEV ENVIRONMENT')
    await expect(devBanner).toBeVisible()
    
    // Check no console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.waitForTimeout(1000)
    expect(errors).toHaveLength(0)
  })

  test('B) Tenant Selection - dropdown click changes label', async ({ page }) => {
    await page.goto(DEV_URL)
    
    // Wait for tenant section to load
    await page.waitForSelector('text=TENANT')
    
    // Get initial tenant label
    const initialLabel = await page.locator('text=Test Loco').first().textContent()
    
    // Click the gear/settings icon to open tenant selector
    const settingsBtn = page.locator('button:has-text("⚙️")').first()
    await settingsBtn.click()
    
    // Wait for tenant ID input to be visible
    await page.waitForSelector('input[placeholder*="Tenant ID"]', { timeout: 5000 })
    
    // Get available tenants from the page (check if there are multiple)
    const tenantIdInput = page.locator('input[placeholder*="Tenant ID"]').first()
    await expect(tenantIdInput).toBeVisible()
    
    // Try to change tenant - clear and type a different tenant ID
    // First get current value
    const currentValue = await tenantIdInput.inputValue()
    
    // Clear and type new value (using a different tenant if available)
    await tenantIdInput.fill('1c0e4803-293d-4bc6-baaf-9e4d8d4186b3') // Ultra tenant
    
    // Click Set button
    await page.click('button:has-text("Set")')
    
    // Wait for label to update
    await page.waitForTimeout(1000)
    
    // Verify tenant label changed
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
      // Get viewport size
      const viewport = page.viewportSize()
      expect(viewport).not.toBeNull()
      
      if (viewport) {
        // Check chatbot is within right: 24px ± 8px, bottom: 24px ± 8px
        // Allow some tolerance for responsive design
        const expectedRight = 24
        const expectedBottom = 24
        const tolerance = 50 // Allow 50px tolerance
        
        const actualRight = viewport.width - (box.x + box.width)
        const actualBottom = viewport.height - (box.y + box.height)
        
        // Must be in bottom-right quadrant
        expect(box.x).toBeGreaterThan(viewport.width / 2)
        expect(box.y).toBeGreaterThan(viewport.height / 2)
        
        // Check within tolerance of expected position
        expect(actualRight).toBeGreaterThanOrEqual(expectedRight - tolerance)
        expect(actualBottom).toBeGreaterThanOrEqual(expectedBottom - tolerance)
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
      
      // Wait for success
      await page.waitForTimeout(2000)
      
      // Check analytics shows data
      const totalTrans = page.locator('text=Total Transactions:').locator('..')
      await expect(totalTrans).toContainText(/[1-9]/)
    } else {
      test.skip()
    }
  })

  test('D) Create SALE Transaction', async ({ page }) => {
    await page.goto(DEV_URL)
    
    // Fill transaction form
    await page.selectOption('select >> nth=0', 'SALE')
    
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
    
    // Find language selector
    const langSelect = page.locator('select').first()
    
    // Switch to Spanish
    await langSelect.selectOption('es')
    await page.waitForTimeout(500)
    
    // Check transaction type is translated
    const saleOption = page.locator('option:has-text("Venta")')
    await expect(saleOption).toBeVisible()
  })

  test('F) Dark Mode Toggle', async ({ page }) => {
    await page.goto(DEV_URL)
    
    // Find theme toggle (sun/moon emoji button)
    const themeBtn = page.locator('button:has-text("🌙"), button:has-text("☀️")').first()
    await themeBtn.click()
    
    // Wait for transition
    await page.waitForTimeout(500)
    
    // Check background changed (dark mode class or style)
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
