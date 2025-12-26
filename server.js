// =============================================
// server.js - Version corrigée
// =============================================

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const NodeCache = require('node-cache');

// Charger les variables d'environnement
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Cache pour le token (55 minutes)
const tokenCache = new NodeCache({ 
  stdTTL: 3300,
  checkperiod: 60
});

// =============================================
// FONCTIONS D'AUTHENTIFICATION
// =============================================

async function obtenirNouveauToken() {
  console.log('🔄 Connexion à l\'API d\'authentification...');
  
  try {
    const reponse = await axios.post(
      'https://mdamsigicmu.sec.gouv.sn/api/authenticate',
      {
        username: process.env.API_USERNAME || 'caisse_sencsu',
        password: process.env.API_PASSWORD || 'passer'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    if (reponse.data && reponse.data.token) {
      const token = reponse.data.token;
      console.log('✅ Token obtenu avec succès');
      return token;
    } else {
      console.error('❌ Réponse API invalide:', reponse.data);
      throw new Error('Token non trouvé dans la réponse');
    }
    
  } catch (erreur) {
    console.error('❌ Erreur d\'authentification:');
    
    if (erreur.response) {
      console.error('Status:', erreur.response.status);
      console.error('Données:', erreur.response.data);
    }
    
    // Token de secours
    if (process.env.FALLBACK_TOKEN) {
      console.log('⚠️ Utilisation du token de secours');
      return process.env.FALLBACK_TOKEN;
    }
    
    throw new Error(`Authentification échouée: ${erreur.message}`);
  }
}

async function obtenirTokenCourant() {
  let token = tokenCache.get('token_jwt');
  
  if (!token) {
    console.log('📝 Authentification nécessaire...');
    token = await obtenirNouveauToken();
    tokenCache.set('token_jwt', token);
    tokenCache.set('derniere_auth', Date.now());
  }
  
  return token;
}

// =============================================
// ROUTES DE DIAGNOSTIC
// =============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Proxy CSU Verification',
    timestamp: new Date().toISOString(),
    env: {
      api_username: process.env.API_USERNAME ? 'configuré' : 'non configuré',
      node_env: process.env.NODE_ENV || 'non défini'
    }
  });
});

app.get('/auth/status', (req, res) => {
  const token = tokenCache.get('token_jwt');
  const derniereAuth = tokenCache.get('derniere_auth');
  
  res.json({
    authentifie: !!token,
    token_present: !!token,
    dernier_auth: derniereAuth ? new Date(derniereAuth).toISOString() : null,
    cache_taille: tokenCache.keys().length
  });
});

// =============================================
// PROXY POUR L'API UDAM
// =============================================

const proxyOptions = {
  target: 'https://mdamsigicmu.sec.gouv.sn',
  changeOrigin: true,
  secure: false,
  pathRewrite: {
    // CORRECTION ICI : Transforme /api/... en /services/udam/...
    '^/api': '/services/udam'
  },
  logLevel: 'debug',
  
  onProxyReq: async (proxyReq, req, res) => {
    try {
      console.log(`🔗 Proxy requête: ${req.method} ${req.originalUrl}`);
      
      // Obtenir le token
      const token = await obtenirTokenCourant();
      
      // Ajouter les headers
      proxyReq.setHeader('Authorization', `Bearer ${token}`);
      proxyReq.setHeader('Accept', 'application/json');
      
      console.log(`✅ Headers ajoutés pour ${req.path}`);
      
    } catch (erreur) {
      console.error('❌ Erreur proxy:', erreur.message);
      
      res.status(503).json({
        error: 'Service indisponible',
        message: 'Impossible d\'authentifier la requête',
        details: erreur.message,
        timestamp: new Date().toISOString()
      });
      
      proxyReq.destroy();
    }
  },
  
  onProxyRes: (proxyRes, req, res) => {
    console.log(`📤 Réponse API: ${proxyRes.statusCode} ${req.method} ${req.path}`);
    
    // Si token expiré
    if (proxyRes.statusCode === 401) {
      console.log('🔄 Token expiré, nettoyage cache...');
      tokenCache.del('token_jwt');
    }
    
    // Headers CORS
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
  },
  
  onError: (err, req, res) => {
    console.error('🔥 Erreur proxy:', err.message);
    res.status(500).json({
      error: 'Erreur de connexion',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Appliquer le proxy
app.use('/api', createProxyMiddleware(proxyOptions));

// =============================================
// SERVIR ANGULAR
// =============================================

const angularPath = path.join(__dirname, 'dist/carte-verification/browser');
app.use(express.static(angularPath, {
  maxAge: '1h',
  index: false
}));

// Toutes les autres routes -> Angular
app.get('*', (req, res) => {
  res.sendFile(path.join(angularPath, 'index.html'));
});

// =============================================
// INITIALISATION
// =============================================

async function initialiser() {
  console.log('🚀 Initialisation du proxy...');
  console.log(`📁 Port: ${PORT}`);
  console.log(`📁 API Target: https://mdamsigicmu.sec.gouv.sn/services/udam`);
  
  try {
    // Obtenir un premier token
    const token = await obtenirNouveauToken();
    tokenCache.set('token_jwt', token);
    tokenCache.set('derniere_auth', Date.now());
    
    console.log('✅ Proxy initialisé avec succès!');
    
    // Rafraîchir automatiquement
    setInterval(async () => {
      try {
        const nouveauToken = await obtenirNouveauToken();
        tokenCache.set('token_jwt', nouveauToken);
        tokenCache.set('derniere_auth', Date.now());
        console.log('🔄 Token rafraîchi automatiquement');
      } catch (err) {
        console.error('⚠️ Rafraîchissement automatique échoué:', err.message);
      }
    }, 50 * 60 * 1000); // 50 minutes
    
  } catch (erreur) {
    console.error('⚠️ Initialisation échouée:', erreur.message);
    console.log('⚠️ Le proxy démarre quand même, premier token à la première requête');
  }
}

// =============================================
// DÉMARRAGE
// =============================================

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré: http://localhost:${PORT}`);
  initialiser();
});

// Gestion des erreurs
process.on('uncaughtException', (err) => {
  console.error('🔥 ERREUR NON GÉRÉE:', err);
});