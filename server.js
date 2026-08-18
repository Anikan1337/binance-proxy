// ==========================================================================
// Binance Proxy — forwarding-прокси для публичных market data эндпоинтов
// Binance (стакан, тикер 24ч, цена пары). Обход HTTP 451 "restricted location"
// для запросов с серверов Google Apps Script. Авторизация не нужна — все
// эндпоинты публичные.
//
// Деплой на Render — как с bybit-proxy: New Web Service, Node, Build:
// npm install, Start: node server.js.
//
// Эндпоинты:
//   GET /depth?symbol=GMEBUSDT&limit=5000
//   GET /ticker24hr?symbol=GMEBUSDT
//   GET /price?symbol=USDCUSDT
// Все пробрасывают ответ Binance как есть.
// ==========================================================================

const express = require('express');
const app = express();

const BINANCE_BASE = 'https://api.binance.com';

async function proxyFetch(res, url) {
  try {
    const resp = await fetch(url);
    const text = await resp.text();
    res.status(resp.status);
    res.set('Content-Type', 'application/json');
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: 'proxy_fetch_failed', message: e.message });
  }
}

app.get('/depth', (req, res) => {
  const symbol = req.query.symbol;
  const limit = req.query.limit || '5000';
  if (!symbol) return res.status(400).json({ error: 'symbol query param is required' });
  proxyFetch(res, `${BINANCE_BASE}/api/v3/depth?symbol=${encodeURIComponent(symbol)}&limit=${encodeURIComponent(limit)}`);
});

app.get('/ticker24hr', (req, res) => {
  const symbol = req.query.symbol;
  if (!symbol) return res.status(400).json({ error: 'symbol query param is required' });
  proxyFetch(res, `${BINANCE_BASE}/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`);
});

app.get('/price', (req, res) => {
  const symbol = req.query.symbol;
  if (!symbol) return res.status(400).json({ error: 'symbol query param is required' });
  proxyFetch(res, `${BINANCE_BASE}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`);
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'binance-proxy' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Binance proxy listening on port ${PORT}`);
});
// ---- ДОБАВИТЬ В binance-proxy/server.js ----
// Вставить после app.get('/price', ...) и перед app.get('/', ...)
 
const BINANCE_FUTURES_BASE = 'https://fapi.binance.com';
 
app.get('/fdepth', (req, res) => {
  const symbol = req.query.symbol;
  const limit = req.query.limit || '1000';
  if (!symbol) return res.status(400).json({ error: 'symbol query param is required' });
  proxyFetch(res, `${BINANCE_FUTURES_BASE}/fapi/v1/depth?symbol=${encodeURIComponent(symbol)}&limit=${encodeURIComponent(limit)}`);
});
 
// ---- ДОБАВИТЬ В binance-proxy/server.js ----
// Вставить рядом с остальными app.get(...) — точность цены инструмента (для авто-подбора шага агрегации)
 
app.get('/info', (req, res) => {
  const symbol = req.query.symbol;
  if (!symbol) return res.status(400).json({ error: 'symbol query param is required' });
  proxyFetch(res, `${BINANCE_BASE}/api/v3/exchangeInfo?symbol=${encodeURIComponent(symbol)}`);
});
