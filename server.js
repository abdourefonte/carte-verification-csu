// server.js - Proxy Express pour Render
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// 1. Proxy pour l'API
app.use('/api', createProxyMiddleware({
  target: 'https://mdamsigicmu.sec.gouv.sn/services/udam',
  changeOrigin: true,
  secure: false, // ⚠️ Désactive vérif SSL (comme en local)
  pathRewrite: { '^/api': '' },
  onProxyReq: (proxyReq, req, res) => {
    // Ajoute le token JWT
    proxyReq.setHeader('Authorization', 
      'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjYWlzc2Vfc2VuY3N1IiwiYXV0aCI6IlJPTEVfVVNFUiIsImV4cCI6MTc2NjU4NTUwMn0.byUtd1B0ei5YkNPH6W5DpkU05_dJF18Y9yrHVVYb2RA2Fmp1MRHWD_cGNKoYe4B6Hxk1jbZolUpL2uL1PCgkVw');
  }
}));

// 2. Servir Angular
app.use(express.static(path.join(__dirname, 'dist/carte-verification/browser')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/carte-verification/browser/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur proxy démarré sur le port ${PORT}`);
});