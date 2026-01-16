import express from "express";
import { ethers } from "ethers";

const app = express();
const PORT = process.env.PORT || 3000;

// ⚡ CONFIGURAÇÕES
const TOKEN_ADDRESS = "0x7852998765c0730d59D78262CfdFa666989023bd";

// Public RPCs (fallback se um falhar)
const RPCS = {
  bsc: [
    "https://bsc-dataseed.binance.org/",
    "https://bsc-dataseed1.defibit.io/",
    "https://bsc-dataseed1.ninicoin.io/"
  ],
  eth: [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://rpc.ankr.com/eth_goerli" // só se fores testnet
  ]
};

// Minimal ERC-20 ABI
const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// Helper para formatar números
function fmt(n, decimals = 18) {
  if (!n) return "—";
  const factor = Math.pow(10, decimals);
  return (Number(n) / factor).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// Render HTML
function renderHTML({ supply, symbol, chainName, error }) {
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
      <h1>${symbol ?? TOKEN_ADDRESS} Live Dashboard</h1>
      <div class="subtitle">Dados on-chain via RPC pública — ${chainName ?? "desconhecida"}</div>

      <div class="grid">
        <div class="card">
          <div class="label">💰 Total Supply</div>
          <div class="value">${supply ?? "—"} ${symbol ?? ""}</div>
          <div class="small">${chainName ?? "Chain"}</div>
        </div>
      </div>

      ${error ? `<div class="card" style="margin-top:20px;background:rgba(255,0,0,0.2)">
        <div class="label">⚠️ Erro</div>
        <div class="value">${error}</div>
      </div>` : ""}

      <footer>Atualizado ao carregar a página</footer>
    </div>
  </body>
  </html>
  `;
}

// Função para tentar RPCs em fallback
async function tryRPCs(rpcs) {
  for (let url of rpcs) {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
      const [totalSupplyRaw, decimals, symbol] = await Promise.all([
        tokenContract.totalSupply(),
        tokenContract.decimals(),
        tokenContract.symbol()
      ]);
      return { totalSupplyRaw, decimals, symbol, chainName: url.includes("bsc") ? "BSC" : "Ethereum" };
    } catch (err) {
      console.warn(`RPC falhou: ${url}`);
      continue;
    }
  }
  throw new Error("Todos os RPCs falharam ou token inválido");
}

// Endpoint principal
app.get("/", async (req, res) => {
  try {
    // tenta BSC primeiro
    let result;
    try {
      result = await tryRPCs(RPCS.bsc);
    } catch {
      // tenta Ethereum
      result = await tryRPCs(RPCS.eth);
    }

    const supply = fmt(result.totalSupplyRaw, result.decimals);
    res.send(renderHTML({ supply, symbol: result.symbol, chainName: result.chainName }));

  } catch (err) {
    console.error("Erro geral:", err);
    res.send(renderHTML({ error: err.message }));
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
