// scrapers/rss.js
// Parses public deal RSS feeds from SlickDeals, DealNews, Woot, etc.
// Extracts price from titles/descriptions and filters by threshold

const fetch    = require("node-fetch");
const settings = require("../config/settings");
const chalk    = require("chalk");

// Store name matchers
const STORE_PATTERNS = [
  { store: "walmart",   patterns: [/walmart/i] },
  { store: "target",    patterns: [/target/i] },
  { store: "bestbuy",   patterns: [/best\s?buy/i] },
  { store: "gamestop",  patterns: [/gamestop/i] },
  { store: "homedepot", patterns: [/home\s?depot/i] },
  { store: "lowes",     patterns: [/lowe'?s/i] },
  { store: "amazon",    patterns: [/amazon/i] },
  { store: "woot",      patterns: [/woot/i] },
];

function detectStore(text) {
  for (const { store, patterns } of STORE_PATTERNS) {
    if (patterns.some(p => p.test(text))) return store;
  }
  return "other";
}

function extractPrice(text) {
  // Match $0.01, $1.00, $49.99, etc.
  const matches = text.match(/\$(\d+(?:\.\d{1,2})?)/g);
  if (!matches || matches.length === 0) return null;
  const prices = matches.map(m => parseFloat(m.replace("$", ""))).filter(p => p > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices); // take lowest mentioned price
}

function extractOriginalPrice(text) {
  // Look for "was $X", "reg $X", "originally $X", "list $X"
  const wasMatch = text.match(/(?:was|reg(?:ular)?|orig(?:inally)?|list(?:s)?|from|retail)[:\s]+\$(\d+(?:\.\d{1,2})?)/i);
  if (wasMatch) return parseFloat(wasMatch[1]);
  // Or second price mentioned (first = sale, second = original)
  const allPrices = (text.match(/\$(\d+(?:\.\d{1,2})?)/g) || []).map(m => parseFloat(m.replace("$", "")));
  if (allPrices.length >= 2) return Math.max(...allPrices);
  return null;
}

function isPennyOrBigDrop(price, originalPrice) {
  if (price <= settings.PENNY_PRICE_MAX) return true;
  if (originalPrice && originalPrice > 0) {
    const pct = ((originalPrice - price) / originalPrice) * 100;
    if (pct >= settings.DROP_PERCENT_MIN) return true;
  }
  return false;
}

async function parseRSSFeed(feed) {
  const res  = await fetch(feed.url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PriceAlertBot/1.0)" },
    timeout: 15000,
  });
  const xml  = await res.text();
  const items = [];

  // Simple XML item parser — no external lib needed
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const block of itemBlocks) {
    const getTag = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? (m[1] || m[2] || "").trim() : "";
    };

    const title       = getTag("title");
    const description = getTag("description");
    const link        = getTag("link");
    const fullText    = `${title} ${description}`;

    const price         = extractPrice(fullText);
    const originalPrice = extractOriginalPrice(fullText);
    const store         = detectStore(fullText) || "other";

    if (!price) continue;
    if (!isPennyOrBigDrop(price, originalPrice)) continue;

    items.push({
      title:         title.replace(/<[^>]+>/g, "").trim(),
      price,
      originalPrice,
      url:           link,
      store,
      source:        feed.name,
    });
  }

  return items;
}

async function scanRSSFeeds() {
  const allDeals = [];

  for (const feed of settings.RSS_FEEDS) {
    console.log(chalk.gray(`    → ${feed.name} RSS...`));
    try {
      const deals = await parseRSSFeed(feed);
      console.log(chalk.gray(`      Found ${deals.length} deals`));
      allDeals.push(...deals);
    } catch (err) {
      console.log(chalk.red(`      Error: ${err.message}`));
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  return allDeals;
}

module.exports = { scanRSSFeeds };
