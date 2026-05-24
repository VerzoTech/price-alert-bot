// ============================================================
//  PRICE ALERT BOT v3 — bot.js
//  Now writes all deals to Supabase instead of local JSON
// ============================================================
require("dotenv").config();

const cron = require("node-cron");
const { scanClearancePages } = require("./scrapers/clearance");
const { scanRSSFeeds }       = require("./scrapers/rss");
const { sendDiscord }        = require("./alerts/discord");
const { wasAlerted, markAlerted, saveDeal } = require("./data/db");
const { startAPI }           = require("./api/server");
const settings               = require("./config/settings");
const chalk                  = require("chalk");

console.log(chalk.cyan.bold("\n🔍 PRICE ALERT BOT v3 STARTING...\n"));
console.log(chalk.gray(`   Supabase URL:     ${process.env.SUPABASE_URL}`));
console.log(chalk.gray(`   Penny threshold:  $${settings.PENNY_PRICE_MAX}`));
console.log(chalk.gray(`   Drop threshold:   ${settings.DROP_PERCENT_MIN}%`));
console.log(chalk.gray(`   Scan interval:    every ${settings.SCAN_INTERVAL_MINUTES} minutes\n`));

async function runScan() {
  console.log(chalk.yellow(`\n[${new Date().toLocaleString()}] ━━━ SCAN STARTING ━━━`));
  let totalFound = 0;

  // ── 1. CLEARANCE PAGES ────────────────────────────────
  console.log(chalk.cyan("  📦 Scanning clearance pages..."));
  try {
    const deals = await scanClearancePages();
    for (const deal of deals) {
      const fired = await processAndAlert(deal);
      if (fired) totalFound++;
    }
  } catch (err) {
    console.error(chalk.red("  Clearance error:"), err.message);
  }

  // ── 2. RSS FEEDS ──────────────────────────────────────
  console.log(chalk.cyan("  📡 Scanning RSS feeds..."));
  try {
    const deals = await scanRSSFeeds();
    for (const deal of deals) {
      const fired = await processAndAlert(deal);
      if (fired) totalFound++;
    }
  } catch (err) {
    console.error(chalk.red("  RSS error:"), err.message);
  }

  console.log(chalk.green(`\n  ✅ Scan complete — ${totalFound} new alerts fired.\n`));
}

async function processAndAlert(deal) {
  const { title, price, originalPrice, url, store, source } = deal;
  if (!price || isNaN(price)) return false;

  const isPenny   = price <= settings.PENNY_PRICE_MAX;
  const dropPct   = originalPrice ? ((originalPrice - price) / originalPrice) * 100 : 0;
  const isBigDrop = dropPct >= settings.DROP_PERCENT_MIN;

  if (!isPenny && !isBigDrop) return false;

  // Dedupe check via Supabase
  const alreadyAlerted = await wasAlerted(url, price);
  if (alreadyAlerted) return false;

  const alertType = isPenny ? "PENNY" : "DROP";
  console.log(chalk.red(`  🚨 ${alertType}: ${title} — $${price} (${store})`));

  // Save to Supabase deals table
  await saveDeal({ title, price, originalPrice, dropPct, store, source, url, alertType });

  // Fire Discord alert
  await sendDiscord({ title, price, originalPrice, dropPct, url, store, source, alertType });

  // Mark as alerted
  await markAlerted(url, price);

  return true;
}

// Start REST API server for frontend
startAPI();

// Run immediately
runScan();

// Then on schedule
cron.schedule(`*/${settings.SCAN_INTERVAL_MINUTES} * * * *`, runScan);

console.log(chalk.green(`✅ Bot live. Scanning every ${settings.SCAN_INTERVAL_MINUTES} min. API on port ${process.env.PORT || 3001}.`));
