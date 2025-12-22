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
      'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjYWlzc2Vfc2VuY3N1IiwiYXV0aCI6IlJPTEVfVVNFUiIsImV4cCI6MTc2NjQ4MTQzM30.ykRiTsG0MrIG8GTwrBbRjkvE0eDzMco9kLlpFS6Aicqm0GojYq9onDKDOd0VUsFxz9cdEj2oQPYAYGBtmBp5dA');
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