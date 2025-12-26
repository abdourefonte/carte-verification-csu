// server.js - Version avec token automatique
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const authManager = require('./auth');

const app = express();
app.use(cors());

// =============================================
// ROUTES DE DIAGNOSTIC
// =============================================

// Vérifier l'état du token
app.get('/token-status', async (req, res) => {
  try {
    const token = await authManager.getCurrentToken();
    const isExpired = authManager.tokenExpiry && authManager.tokenExpiry < Date.now();
    
    res.json({
      tokenPresent: !!token,
      tokenExpired: isExpired,
      expiresAt: authManager.tokenExpiry ? new Date(authManager.tokenExpiry).toISOString() : null,
      expiresIn: authManager.tokenExpiry ? Math.max(0, Math.round((authManager.tokenExpiry - Date.now()) / 60000)) + ' minutes' : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rafraîchir manuellement le token
app.post('/refresh-token', async (req, res) => {
  try {
    const token = await authManager.fetchNewToken();
    res.json({ 
      success: true, 
      message: 'Token rafraîchi avec succès',
      expiresAt: new Date(authManager.tokenExpiry).toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// PROXY POUR L'API (AVEC TOKEN AUTOMATIQUE)
// =============================================

app.use('/api', createProxyMiddleware({
  target: 'https://mdamsigicmu.sec.gouv.sn/services/udam',
  changeOrigin: true,
  secure: false,
  pathRewrite: { '^/api': '' },
  
  // MODIFICATION ICI : Token dynamique
  onProxyReq: async (proxyReq, req, res) => {
    try {
      // Obtenir le token automatiquement
      const token = await authManager.getCurrentToken();
      
      // Ajouter le token dans les headers
      proxyReq.setHeader('Authorization', `Bearer ${token}`);
      
      console.log(`✅ Requête ${req.method} ${req.path} avec token automatique`);
    } catch (error) {
      console.error('❌ Impossible d\'obtenir le token:', error.message);
      
      // Répondre avec une erreur
      res.status(503).json({
        error: 'Service temporairement indisponible',
        message: 'Impossible d\'authentifier la requête',
        details: error.message
      });
      
      proxyReq.destroy();
    }
  },
  
  // Si le token est rejeté (401), on le marque comme expiré
  onProxyRes: (proxyRes, req, res) => {
    if (proxyRes.statusCode === 401) {
      console.log('🔄 Token rejeté par l\'API, marqué comme expiré');
      authManager.tokenExpiry = Date.now() - 1; // Force l'expiration
    }
  }
}));

// =============================================
// SERVIR ANGULAR (NE PAS CHANGER)
// =============================================

app.use(express.static(path.join(__dirname, 'dist/carte-verification/browser')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/carte-verification/browser/index.html'));
});

// =============================================
// DÉMARRAGE
// =============================================

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Obtenir un premier token au démarrage
    console.log('🚀 Démarrage du serveur...');
    console.log('🔐 Obtention du token initial...');
    
    await authManager.fetchNewToken();
    
    // Démarrer le rafraîchissement automatique
    authManager.startAutoRefresh();
    
    app.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur le port ${PORT}`);
      console.log(`🔗 Testez le token: http://localhost:${PORT}/token-status`);
    });
    
  } catch (error) {
    console.error('❌ Échec de démarrage:', error.message);
    
    // Démarrer quand même (utilisera le token de secours ou échouera à la première requête)
    app.listen(PORT, () => {
      console.log(`⚠️ Serveur démarré SANS token sur le port ${PORT}`);
      console.log(`⚠️ Les requêtes API échoueront jusqu'à ce qu'un token soit disponible`);
    });
  }
}

startServer();