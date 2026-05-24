// data/db.js
// Replaces local prices.json — all reads/writes go to Supabase now
const { supabase } = require("./supabase");

// Check if a URL has already been alerted at this price
async function wasAlerted(url, price) {
  const { data, error } = await supabase
    .from("alerted")
    .select("price")
    .eq("url", url)
    .single();

  if (error || !data) return false;
  return data.price === price;
}

// Mark a URL as alerted at this price
async function markAlerted(url, price) {
  await supabase
    .from("alerted")
    .upsert({ url, price, updated_at: new Date().toISOString() }, { onConflict: "url" });
}

// Save a deal to the deals table
async function saveDeal({ title, price, originalPrice, dropPct, store, source, url, alertType }) {
  const { error } = await supabase.from("deals").insert({
    title,
    price,
    original_price: originalPrice || null,
    drop_pct:       dropPct ? Math.round(dropPct) : null,
    store,
    source,
    url:            url || null,
    alert_type:     alertType,
  });

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
}

// Fetch recent deals (used by API endpoint)
async function getRecentDeals({ limit = 50, store = null, alertType = null } = {}) {
  let query = supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (store)     query = query.eq("store", store);
  if (alertType) query = query.eq("alert_type", alertType);

  const { data, error } = await query;
  if (error) throw new Error(`Supabase fetch failed: ${error.message}`);
  return data;
}

// Stats for dashboard
async function getStats() {
  const { data, error } = await supabase.rpc("get_deal_stats").single();
  // If RPC doesn't exist, fall back to manual counts
  if (error) {
    const [penny, drop, total] = await Promise.all([
      supabase.from("deals").select("id", { count: "exact" }).eq("alert_type", "PENNY"),
      supabase.from("deals").select("id", { count: "exact" }).eq("alert_type", "DROP"),
      supabase.from("deals").select("id", { count: "exact" }),
    ]);
    return {
      penny: penny.count || 0,
      drop:  drop.count  || 0,
      total: total.count || 0,
    };
  }
  return data;
}

module.exports = { wasAlerted, markAlerted, saveDeal, getRecentDeals, getStats };
