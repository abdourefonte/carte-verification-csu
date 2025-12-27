// server.js - VERSION POUR AUTOMATISATION
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const config = require('./config');  // Import du token automatisé

const app = express();

// 1. CORS configuration
app.use(cors());

// 2. Logging des requêtes
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// 3. Proxy API CSU avec token automatique
const apiProxy = createProxyMiddleware({
  target: 'https://mdamsigicmu.sec.gouv.sn/services/udam',
  changeOrigin: true,
  secure: false,
  pathRewrite: {
    '^/api': ''  // Transforme /api/api/beneficiaires → /api/beneficiaires
  },
  onProxyReq: (proxyReq, req, res) => {
    // Utilise le token frais de config.js
    const token = config.getToken();
    proxyReq.setHeader('Authorization', token);
    console.log(`🔑 Token utilisé (${token.length} caractères)`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`📊 API Response: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({ 
      error: 'Proxy Error', 
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api', apiProxy);

// 4. Endpoints d'information
app.get('/token-info', (req, res) => {
  res.json(config.getTokenInfo());
});

app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'CSU Proxy',
    version: '2.0.0',
    token_auto_update: true,
    last_token_update: config.getTokenInfo().lastUpdate,
    timestamp: new Date().toISOString()
  });
});

// 5. Servir Angular (votre frontend)
app.use(express.static(path.join(__dirname, 'dist/carte-verification/browser')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/carte-verification/browser/index.html'));
});

// 6. Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('🔥 Global Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`🔐 Token auto-update: ENABLED`);
  console.log(`📁 Static files: ${path.join(__dirname, 'dist/carte-verification/browser')}`);
  console.log(`🔄 Last token update: ${config.getTokenInfo().lastUpdate}`);
});