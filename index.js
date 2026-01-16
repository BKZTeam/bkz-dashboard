import express from "express";
import { ethers } from "ethers";

const app = express();
const PORT = process.env.PORT || 3000;

// ⚡ Configurações do token
const TOKEN_ADDRESS = "0x7852998765c0730d59D78262CfdFa666989023bd"; // teu token
const RPC_URL = "https://bsc-dataseed.binance.org/"; // BSC Mainnet public RPC
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Minimal ABI para ERC-20
const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);

// Helper para formatar números
function fmt(n, decimals = 18) {
  if (!n) return "—";
  const factor = Math.pow(10, decimals);
  return (Number(n) / factor).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// Render HTML
function renderHTML({ supply, symbol }) {
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
      <h1>${symbol} Live Dashboard</h1>
      <div class="subtitle">Dados on-chain diretamente do smart contract</div>

      <div class="grid">
        <div class="card">
          <div class="label">💰 Total Supply</div>
          <div class="value">${supply ?? "—"} ${symbol}</div>
          <div class="small">BSC Mainnet</div>
        </div>
      </div>

      <footer>Atualizado ao carregar a página — via RPC pública</footer>
    </div>
  </body>
  </html>
  `;
}

// Endpoint principal
app.get("/", async (req, res) => {
  try {
    const [totalSupplyRaw, decimals, symbol] = await Promise.all([
      tokenContract.totalSupply(),
      tokenContract.decimals(),
      tokenContract.symbol()
    ]);

    const supply = fmt(totalSupplyRaw, decimals);
    res.send(renderHTML({ supply, symbol }));

  } catch (err) {
    console.error("Erro:", err);
    res.status(500).send("Erro ao obter dados do smart contract.");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
