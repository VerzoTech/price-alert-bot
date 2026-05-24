// api/server.js
// Lightweight Express API server
// Your Next.js frontend calls these endpoints to get deal data
// Protected by BOT_API_SECRET so only your app can access it

require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const { getRecentDeals, getStats } = require("../data/db");

const app = express();
app.use(express.json());
app.use(cors());

// ── AUTH MIDDLEWARE ───────────────────────────────────────
// Every request must include: Authorization: Bearer YOUR_BOT_API_SECRET
function requireSecret(req, res, next) {
  const auth   = req.headers["authorization"] || "";
  const token  = auth.replace("Bearer ", "").trim();
  const secret = process.env.BOT_API_SECRET;

  if (!secret || token !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ── ROUTES ────────────────────────────────────────────────

// GET /health — bot is alive check
app.get("/health", (req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// GET /deals — fetch recent deals
// Query params:
//   ?limit=50          max results (default 50)
//   ?store=walmart     filter by store
//   ?type=PENNY        filter by PENNY or DROP
app.get("/deals", requireSecret, async (req, res) => {
  try {
    const { limit = 50, store, type } = req.query;
    const deals = await getRecentDeals({
      limit:     Math.min(parseInt(limit), 200),
      store:     store  || null,
      alertType: type   || null,
    });
    res.json({ deals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats — counts for dashboard widgets
app.get("/stats", requireSecret, async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function startAPI() {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`\n  🌐 API server running on http://localhost:${port}`);
    console.log(`     Endpoints:`);
    console.log(`       GET /health`);
    console.log(`       GET /deals?limit=50&store=walmart&type=PENNY`);
    console.log(`       GET /stats\n`);
  });
}

module.exports = { startAPI };
