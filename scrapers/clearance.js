// scrapers/clearance.js
// Crawls public clearance/sale sections of each store
// and returns deals that hit penny or big-drop thresholds

const { getPage } = require("./browser");
const settings    = require("../config/settings");
const chalk       = require("chalk");

// ── STORE CLEARANCE URLS ──────────────────────────────────
const CLEARANCE_TARGETS = [
  {
    store: "walmart",
    url:   "https://www.walmart.com/shop/deals/clearance",
    scrape: scrapeWalmartClearance,
  },
  {
    store: "target",
    url:   "https://www.target.com/c/clearance/-/N-5q0ga",
    scrape: scrapeTargetClearance,
  },
  {
    store: "bestbuy",
    url:   "https://www.bestbuy.com/site/electronics/top-deals/pcmcat1563299784494.c",
    scrape: scrapeBestBuyClearance,
  },
  {
    store: "gamestop",
    url:   "https://www.gamestop.com/collection/clearance",
    scrape: scrapeGameStopClearance,
  },
  {
    store: "homedepot",
    url:   "https://www.homedepot.com/b/Deals-Savings-Center-Clearance/N-5yc1vZc6jf",
    scrape: scrapeHomeDepotClearance,
  },
  {
    store: "lowes",
    url:   "https://www.lowes.com/store/deals/clearance",
    scrape: scrapeLowsClearance,
  },
];

async function scanClearancePages() {
  const allDeals = [];

  for (const target of CLEARANCE_TARGETS) {
    if (!settings.STORES[target.store]?.enabled) continue;

    console.log(chalk.gray(`    → ${settings.STORES[target.store].name} clearance...`));
    try {
      const deals = await target.scrape(target.url, target.store);
      console.log(chalk.gray(`      Found ${deals.length} items`));
      allDeals.push(...deals);
    } catch (err) {
      console.log(chalk.red(`      Error: ${err.message}`));
    }

    await delay(2000 + Math.random() * 1500);
  }

  return allDeals;
}

// ── WALMART ───────────────────────────────────────────────
async function scrapeWalmartClearance(url, store) {
  const { page, browser } = await getPage(url);
  try {
    await page.waitForSelector('[data-item-id], .search-result-gridview-item', { timeout: 20000 });

    const items = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('[data-item-id], .search-result-gridview-item');

      cards.forEach(card => {
        const titleEl   = card.querySelector('[data-automation-id="product-title"], .product-title-link');
        const priceEl   = card.querySelector('[data-automation-id="product-price"] .price-characteristic, .price-main .price-characteristic');
        const wasEl     = card.querySelector('.price-old, [data-automation-id="was-price"]');
        const linkEl    = card.querySelector('a[href]');

        if (!titleEl || !priceEl) return;

        const price = parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ''));
        const was   = wasEl ? parseFloat(wasEl.innerText.replace(/[^0-9.]/g, '')) : null;
        const href  = linkEl?.getAttribute('href');

        if (!isNaN(price) && href) {
          results.push({
            title:         titleEl.innerText.trim(),
            price,
            originalPrice: was,
            url:           href.startsWith('http') ? href : 'https://www.walmart.com' + href,
          });
        }
      });

      return results.slice(0, 40);
    });

    return items.map(i => ({ ...i, store: 'walmart', source: 'clearance' }));
  } finally {
    await browser.close();
  }
}

// ── TARGET ────────────────────────────────────────────────
async function scrapeTargetClearance(url, store) {
  const { page, browser } = await getPage(url);
  try {
    await page.waitForSelector('[data-test="product-details"], .ProductCardVariantDefault', { timeout: 20000 });

    const items = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('[data-test="product-details"], .ProductCardVariantDefault');

      cards.forEach(card => {
        const titleEl = card.querySelector('[data-test="product-title"], a[data-test="product-title"]');
        const priceEl = card.querySelector('[data-test="current-price"]');
        const wasEl   = card.querySelector('[data-test="previous-price"]');
        const linkEl  = card.querySelector('a[href]');

        if (!titleEl || !priceEl) return;

        const price = parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ''));
        const was   = wasEl ? parseFloat(wasEl.innerText.replace(/[^0-9.]/g, '')) : null;
        const href  = linkEl?.getAttribute('href');

        if (!isNaN(price) && href) {
          results.push({
            title:         titleEl.innerText.trim(),
            price,
            originalPrice: was,
            url:           href.startsWith('http') ? href : 'https://www.target.com' + href,
          });
        }
      });

      return results.slice(0, 40);
    });

    return items.map(i => ({ ...i, store: 'target', source: 'clearance' }));
  } finally {
    await browser.close();
  }
}

// ── BEST BUY ──────────────────────────────────────────────
async function scrapeBestBuyClearance(url, store) {
  const { page, browser } = await getPage(url);
  try {
    await page.waitForSelector('.sku-item, [data-sku-id]', { timeout: 20000 });

    const items = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.sku-item, [data-sku-id]');

      cards.forEach(card => {
        const titleEl = card.querySelector('.sku-header a, .sku-title a');
        const priceEl = card.querySelector('.priceView-customer-price span, .sr-only');
        const wasEl   = card.querySelector('.pricing-price__regular-price');
        const linkEl  = card.querySelector('a[href]');

        if (!titleEl || !priceEl) return;

        const price = parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ''));
        const was   = wasEl ? parseFloat(wasEl.innerText.replace(/[^0-9.]/g, '')) : null;
        const href  = linkEl?.getAttribute('href');

        if (!isNaN(price) && price > 0 && href) {
          results.push({
            title:         titleEl.innerText.trim(),
            price,
            originalPrice: was,
            url:           href.startsWith('http') ? href : 'https://www.bestbuy.com' + href,
          });
        }
      });

      return results.slice(0, 40);
    });

    return items.map(i => ({ ...i, store: 'bestbuy', source: 'clearance' }));
  } finally {
    await browser.close();
  }
}

// ── GAMESTOP ──────────────────────────────────────────────
async function scrapeGameStopClearance(url, store) {
  const { page, browser } = await getPage(url);
  try {
    await page.waitForSelector('.product-item, [data-pid]', { timeout: 20000 });

    const items = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.product-item, [data-pid]');

      cards.forEach(card => {
        const titleEl = card.querySelector('.product-item__title, .product-title');
        const priceEl = card.querySelector('.actual-price, .product-item__price');
        const wasEl   = card.querySelector('.original-price, .strike-through .value');
        const linkEl  = card.querySelector('a[href]');

        if (!titleEl || !priceEl) return;

        const price = parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ''));
        const was   = wasEl ? parseFloat(wasEl.innerText.replace(/[^0-9.]/g, '')) : null;
        const href  = linkEl?.getAttribute('href');

        if (!isNaN(price) && price > 0 && href) {
          results.push({
            title:         titleEl.innerText.trim(),
            price,
            originalPrice: was,
            url:           href.startsWith('http') ? href : 'https://www.gamestop.com' + href,
          });
        }
      });

      return results.slice(0, 40);
    });

    return items.map(i => ({ ...i, store: 'gamestop', source: 'clearance' }));
  } finally {
    await browser.close();
  }
}

// ── HOME DEPOT ────────────────────────────────────────────
async function scrapeHomeDepotClearance(url, store) {
  const { page, browser } = await getPage(url);
  try {
    await page.waitForSelector('.plp-pod, [data-testid="product-pod"]', { timeout: 20000 });

    const items = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.plp-pod, [data-testid="product-pod"]');

      cards.forEach(card => {
        const titleEl = card.querySelector('.product-header__title, [data-testid="product-header"]');
        const priceEl = card.querySelector('[data-testid="price-format__main-price"], .price-format__main-price');
        const wasEl   = card.querySelector('.price-format__was-price, [data-testid="price-format__was-price"]');
        const linkEl  = card.querySelector('a[href]');

        if (!titleEl || !priceEl) return;

        const price = parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ''));
        const was   = wasEl ? parseFloat(wasEl.innerText.replace(/[^0-9.]/g, '')) : null;
        const href  = linkEl?.getAttribute('href');

        if (!isNaN(price) && price > 0 && href) {
          results.push({
            title:         titleEl.innerText.trim(),
            price,
            originalPrice: was,
            url:           href.startsWith('http') ? href : 'https://www.homedepot.com' + href,
          });
        }
      });

      return results.slice(0, 40);
    });

    return items.map(i => ({ ...i, store: 'homedepot', source: 'clearance' }));
  } finally {
    await browser.close();
  }
}

// ── LOWE'S ───────────────────────────────────────────────
async function scrapeLowsClearance(url, store) {
  const { page, browser } = await getPage(url);
  try {
    await page.waitForSelector('.article-item-wrapper, [data-test="product-pod"]', { timeout: 20000 });

    const items = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.article-item-wrapper, [data-test="product-pod"]');

      cards.forEach(card => {
        const titleEl = card.querySelector('.art-pd-title, [data-test="product-display-name"]');
        const priceEl = card.querySelector('[data-selector="product-actual-price"], .art-pd-price');
        const wasEl   = card.querySelector('.art-pd-was-price, [data-selector="product-was-price"]');
        const linkEl  = card.querySelector('a[href]');

        if (!titleEl || !priceEl) return;

        const price = parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ''));
        const was   = wasEl ? parseFloat(wasEl.innerText.replace(/[^0-9.]/g, '')) : null;
        const href  = linkEl?.getAttribute('href');

        if (!isNaN(price) && price > 0 && href) {
          results.push({
            title:         titleEl.innerText.trim(),
            price,
            originalPrice: was,
            url:           href.startsWith('http') ? href : 'https://www.lowes.com' + href,
          });
        }
      });

      return results.slice(0, 40);
    });

    return items.map(i => ({ ...i, store: 'lowes', source: 'clearance' }));
  } finally {
    await browser.close();
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = { scanClearancePages };
