import puppeteer from 'puppeteer'

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173/'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function getPlanTripButton(page) {
  const buttons = await page.$$('button')
  for (const button of buttons) {
    const text = await page.evaluate((node) => node.textContent || '', button)
    if (/plan trip/i.test(text)) {
      return button
    }
  }
  throw new Error('Could not find "Plan Trip" button')
}

async function getBodyText(page) {
  return page.evaluate(() => document.body.innerText)
}

async function openHomePage(browser) {
  const page = await browser.newPage()
  page.on('pageerror', (error) => {
    console.error(`Page error: ${String(error)}`)
  })
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  await sleep(1500)
  return page
}

async function getTextInputs(page) {
  return page.$$('input')
}

async function replaceInputValue(input, value) {
  await input.click({ clickCount: 3 })
  await input.press('Backspace')
  if (value) {
    await input.type(value)
  }
}

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
  })

  const results = []

  try {
    {
      const page = await openHomePage(browser)
      results.push({
        name: 'load_home',
        ok: (await page.content()).includes('Plan Your Trip'),
      })
      await page.close()
    }

    {
      const page = await openHomePage(browser)
      const planTripButton = await getPlanTripButton(page)
      await planTripButton.click()
      await sleep(1000)
      const emptySubmitText = await getBodyText(page)
      results.push({
        name: 'empty_submit_validation',
        ok:
          /Enter a valid current location/.test(emptySubmitText) &&
          /Enter a valid pickup location/.test(emptySubmitText) &&
          /Enter a valid dropoff location/.test(emptySubmitText) &&
          /Check the trip details/.test(emptySubmitText),
      })
      await page.close()
    }

    {
      const page = await openHomePage(browser)
      const inputs = await getTextInputs(page)
      await replaceInputValue(inputs[0], 'Ch')
      await sleep(500)
      const shortInputText = await getBodyText(page)
      results.push({
        name: 'short_input_helper',
        ok: /Type at least 3 characters for suggestions\./.test(shortInputText),
      })
      await page.close()
    }

    {
      const page = await openHomePage(browser)
      const inputs = await getTextInputs(page)
      const planTripButton = await getPlanTripButton(page)
      await replaceInputValue(inputs[0], 'Chicago, IL')
      await replaceInputValue(inputs[1], 'Indianapolis, IN')
      await replaceInputValue(inputs[2], 'Nashville, TN')
      await planTripButton.click()
      await sleep(1200)
      const manualEntryText = await getBodyText(page)
      results.push({
        name: 'manual_without_suggestion_blocked',
        ok: (manualEntryText.match(/Choose a suggested location so we can route precisely\./g) || []).length >= 3,
      })
      await page.close()
    }

    {
      const page = await openHomePage(browser)
      const inputs = await getTextInputs(page)
      const planTripButton = await getPlanTripButton(page)
      await replaceInputValue(inputs[0], 'Chicago, IL')
      await replaceInputValue(inputs[1], 'Chicago, IL')
      await replaceInputValue(inputs[2], 'Nashville, TN')
      await planTripButton.click()
      await sleep(800)
      const duplicateText = await getBodyText(page)
      results.push({
        name: 'duplicate_locations_blocked',
        ok:
          /Each trip stop must be different\./.test(duplicateText) &&
          /Pickup location cannot match another trip stop\./.test(duplicateText) &&
          /Dropoff location cannot match another trip stop\./.test(duplicateText),
      })
      await page.close()
    }
  } finally {
    await browser.close()
  }

  const failed = results.filter((result) => !result.ok)
  console.log(JSON.stringify(results, null, 2))

  if (failed.length > 0) {
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
