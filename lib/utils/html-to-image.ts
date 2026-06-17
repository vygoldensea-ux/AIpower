// Screenshot HTML → PNG buffer using Puppeteer (free, no API needed)
export async function htmlToImageBuffer(html: string): Promise<Buffer> {
  const chromium = await import('@sparticuz/chromium')
  const puppeteer = await import('puppeteer-core')

  const browser = await puppeteer.default.launch({
    args: chromium.default.args,
    defaultViewport: { width: 900, height: 900 },
    executablePath: await chromium.default.executablePath(),
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 900, height: 900 })
    await page.setContent(html, { waitUntil: 'load', timeout: 15000 })
    // Wait for Manrope font to load
    await page.evaluate(() => document.fonts.ready)
    const screenshot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 900, height: 900 } })
    return Buffer.from(screenshot)
  } finally {
    await browser.close()
  }
}
