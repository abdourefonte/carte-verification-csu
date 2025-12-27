const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const authService = require('./authService'); // Import du service

const app = express();
app.use(cors());

// Middleware pour logger les requêtes (utile pour le débogage)
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Fonction pour configurer le proxy avec le token dynamique
const createProxyWithAuth = async () => {
  try {
    // Obtenir un token valide
    const token = await authService.getValidToken();
    
    return createProxyMiddleware({
      target: 'https://mdamsigicmu.sec.gouv.sn/services/udam',
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/api': '' },
      onProxyReq: (proxyReq, req, res) => {
        // Ajouter le token JWT actuel
        proxyReq.setHeader('Authorization', `Bearer ${token}`);
        console.log('🔑 Token utilisé pour la requête');
      },
      onError: (err, req, res) => {
        console.error('❌ Erreur proxy:', err.message);
        res.status(500).json({ error: 'Erreur du serveur proxy' });
      }
    });
  } catch (error) {
    console.error('❌ Impossible d\'obtenir le token:', error.message);
    // Retourner un middleware qui répond avec une erreur
    return (req, res, next) => {
      res.status(500).json({ 
        error: 'Service d\'authentification indisponible',
        details: error.message 
      });
    };
  }
};

// Route proxy dynamique avec authentification
app.use('/api', async (req, res, next) => {
  const proxyMiddleware = await createProxyWithAuth();
  proxyMiddleware(req, res, next);
});

// Endpoint de santé pour vérifier le token (optionnel)
app.get('/health', async (req, res) => {
  try {
    const token = await authService.getValidToken();
    const isExpired = authService.isTokenExpired();
    
    res.json({
      status: 'healthy',
      token_available: !!token,
      token_expired: isExpired,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Servir Angular (votre code existant)
app.use(express.static(path.join(__dirname, 'dist/carte-verification/browser')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/carte-verification/browser/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur proxy démarré sur le port ${PORT}`);
  console.log(`🔐 Authentification automatique activée`);
});