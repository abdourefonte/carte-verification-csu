// server.js - VERSION CORRIGÉE POUR RENDER

// Désactiver tous les proxys (spécifique à Render)
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

// Permettre les connexions SSL non vérifiées (nécessaire pour l'API gouvernementale)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('🔧 Configuration Render:');
console.log('   - Proxy HTTP désactivé:', !process.env.HTTP_PROXY ? '✅' : '⚠️');
console.log('   - Proxy HTTPS désactivé:', !process.env.HTTPS_PROXY ? '✅' : '⚠️');
console.log('   - TLS strict désactivé:', process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ? '✅' : '⚠️');

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

// 3. Proxy API CSU avec token automatique - CONFIGURATION CORRIGÉE
const apiProxy = createProxyMiddleware({
  // ✅ CORRECTION 1: Target pointe vers la racine de l'API
  target: 'https://mdamsigicmu.sec.gouv.sn',
  changeOrigin: true,
  secure: false,
  
  // ✅ CORRECTION 2: PathRewrite ajoute le chemin complet
  pathRewrite: {
    '^/api': '/services/udam/api'  // /api/xxx -> /services/udam/api/xxx
  },
  
  // ✅ CORRECTION 3: Ajout de headers pour éviter ECONNRESET
  headers: {
    'Connection': 'keep-alive'
  },
  
  // ✅ CORRECTION 4: Timeouts plus longs
  proxyTimeout: 30000,
  timeout: 30000,
  
  onProxyReq: (proxyReq, req, res) => {
    const token = config.getToken();
    proxyReq.setHeader('Authorization', token);
    
    // Log détaillé pour déboguer
    console.log(`🔄 [PROXY] ${req.method} ${req.originalUrl}`);
    console.log(`   → ${proxyReq.getHeader('host')}${proxyReq.path}`);
    console.log(`   🔑 Token: ${token.substring(0, 50)}...`);
  },
  
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ [API] Response ${proxyRes.statusCode} pour ${req.originalUrl}`);
  },
  
  onError: (err, req, res) => {
    console.error('❌ [ERREUR PROXY]:', {
      message: err.message,
      code: err.code,
      url: req.originalUrl
    });
    
    res.status(500).json({ 
      error: 'Proxy Error', 
      details: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api', apiProxy);

// 4. Endpoints d'information
app.get('/token-info', (req, res) => {
  res.json(config.getTokenInfo());
});

// ✅ Endpoint de test direct de l'API
app.get('/test-api', async (req, res) => {
  console.log('🧪 Test direct de l\'API CSU...');
  
  const axios = require('axios');
  const https = require('https');
  
  const testCode = req.query.code || 'V9676R6540';
  
  try {
    console.log(`📡 Test avec le code: ${testCode}`);
    
    const response = await axios.get(
      `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${testCode}`,
      {
        headers: { 
          'Authorization': config.getToken(),
          'Connection': 'keep-alive'
        },
        httpsAgent: new https.Agent({ 
          rejectUnauthorized: false,
          keepAlive: true 
        }),
        timeout: 15000
      }
    );
    
    console.log(`✅ Test API réussi: status ${response.status}`);
    
    res.json({
      success: true,
      message: 'API CSU accessible depuis Render',
      status: response.status,
      dataPreview: JSON.stringify(response.data).substring(0, 300),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test API échoué:', {
      message: error.message,
      code: error.code,
      status: error.response?.status
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      isConnectionError: error.code === 'ECONNRESET',
      isTimeout: error.code === 'ETIMEDOUT',
      suggestion: error.code === 'ECONNRESET' 
        ? 'Connexion réinitialisée - possible pare-feu Render' 
        : 'Vérifiez si l\'API est accessible',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'CSU Proxy',
    version: '2.0.1',
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
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test-api`);
});