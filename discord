// alerts/discord.js
const fetch    = require("node-fetch");
const settings = require("../config/settings");

const STORE_META = {
  walmart:   { name: "Walmart",    color: 0x0071CE, emoji: "🔵" },
  target:    { name: "Target",     color: 0xCC0000, emoji: "🎯" },
  bestbuy:   { name: "Best Buy",   color: 0x0046BE, emoji: "💙" },
  gamestop:  { name: "GameStop",   color: 0xE31837, emoji: "🎮" },
  homedepot: { name: "Home Depot", color: 0xF96302, emoji: "🏠" },
  lowes:     { name: "Lowe's",     color: 0x004990, emoji: "🔧" },
  amazon:    { name: "Amazon",     color: 0xFF9900, emoji: "📦" },
  woot:      { name: "Woot",       color: 0x00AAFF, emoji: "💥" },
  other:     { name: "Deal Site",  color: 0x888888, emoji: "🏷️" },
};

async function sendDiscord({ title, price, originalPrice, dropPct, url, store, source, alertType }) {
  const meta        = STORE_META[store] || STORE_META.other;
  const isPenny     = alertType === "PENNY";
  const savings     = originalPrice ? (originalPrice - price).toFixed(2) : null;
  const dropRounded = Math.round(dropPct);

  const headerEmoji = isPenny ? "🪙" : "📉";
  const alertLabel  = isPenny
    ? "PENNY DEAL ALERT"
    : `${dropRounded}% PRICE DROP`;

  const embed = {
    title:       `${headerEmoji} ${alertLabel}`,
    description: `**${title}**`,
    color:       isPenny ? 0xFF2222 : meta.color,
    url:         url || undefined,
    fields: [
      {
        name:   "💰 Current Price",
        value:  `**$${price.toFixed(2)}**`,
        inline: true,
      },
      {
        name:   "🏷️ Original Price",
        value:  originalPrice ? `~~$${originalPrice.toFixed(2)}~~` : "N/A",
        inline: true,
      },
      {
        name:   "💸 You Save",
        value:  savings ? `$${savings} (${dropRounded}% off)` : isPenny ? "Nearly free!" : "N/A",
        inline: true,
      },
      {
        name:   `${meta.emoji} Store`,
        value:  meta.name,
        inline: true,
      },
      {
        name:   "📡 Source",
        value:  source || "Clearance Page",
        inline: true,
      },
      {
        name:   "🔗 Link",
        value:  url ? `[View Deal](${url})` : "No link",
        inline: true,
      },
    ],
    footer: {
      text: `PriceBot • ${new Date().toLocaleString()}`,
    },
    timestamp: new Date().toISOString(),
  };

  const body = {
    username:   "PriceBot 🤖",
    content:    isPenny
      ? "@everyone 🚨 **PENNY DEAL DETECTED — ACT FAST!**"
      : `🔥 **Big drop spotted at ${meta.name}!**`,
    embeds: [embed],
  };

  const res = await fetch(settings.DISCORD_WEBHOOK_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord failed: ${res.status} — ${text}`);
  }
}

module.exports = { sendDiscord };
