import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// ⚡ Troca aqui pelo teu token
const TOKEN_ADDRESS = "0x7852998765c0730d59D78262CfdFa666989023bd";

// Serve simple HTML (preto + dourado)
function renderHTML({ price, priceChange, liquidity, pairName }) {
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Token Live Dashboard</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      :root { --gold: #FFD700; --bg: #000; --white: #fff; --muted: #BBBBBB; }
      html,body{height:100%;margin:0;background:var(--bg);color:var(--white);font-family:Inter, Poppins, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;}
      .wrap{max-width:920px;margin:40px auto;padding:24px;}
      h1{margin:0 0 8px;font-size:28px}
      .subtitle{color:var(--muted);margin-bottom:24px}
      .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
      .card{background:rgba(255,255,255,0.02);border-radius:12px;padding:18px;box-shadow:0 4px 18px rgba(0,0,0,0.6);transition:transform 0.14s, box-shadow 0.14s;}
      .card:hover{transform:translateY(-6px);box-shadow:0 10px 30px rgba(0,0,0,0.7);}
      .label{font-size:13px;color:var(--muted);margin-bottom:8px}
      .value{font-size:20px;color:var(--gold);font-weight:700;word-break:break-all}
      .small{font-size:13px;color:var(--muted)}
      footer{margin-top:28px;color:var(--muted);font-size:13px}
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Token Live Dashboard</h1>
      <div class="subtitle">Data via DexScreener (free, live)</div>

      <div class="grid">
        <div class="card">
          <div class="label">💵 Price (USD)</div>
          <div class="value">${price ?? "—"}</div>
          <div class="small">${pairName ?? "Pair info"}</div>
        </div>

        <div class="card">
          <div class="label">📈 24h Change</div>
          <div class="value">${priceChange ?? "—"}%</div>
          <div class="small">DexScreener</div>
        </div>

        <div class="card">
          <div class="label">💰 Liquidity (USD)</div>
          <div class="value">${liquidity ?? "—"}</div>
          <div class="small">Approx.</div>
        </div>
      </div>

      <footer>Updated on page load — DexScreener API</footer>
    </div>
  </body>
  </html>
  `;
}

// Helper para formatar números
function fmt(n) {
  if (!n) return "—";
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

app.get("/", async (req, res) => {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${TOKEN_ADDRESS}`;
    const resp = await fetch(url);
    const data = await resp.json();

    // Pega na primeira pair
    const pair = data?.pairs?.[0] ?? {};

    const price = pair.priceUsd ? fmt(pair.priceUsd) : null;
    const priceChange = pair.priceChange ? fmt(pair.priceChange) : null;
    const liquidity = pair.liquidity ? fmt(pair.liquidity.usd) : null;
    const pairName = pair.pairAddress ?? "—";

    res.send(renderHTML({ price, priceChange, liquidity, pairName }));

  } catch (err) {
    console.error("Erro:", err);
    res.status(500).send("Erro ao obter dados do DexScreener API.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
