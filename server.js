// =============================================
// server.js - Serveur Proxy avec Token Dynamique
// =============================================

// 1. IMPORTER LES MODULES
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const NodeCache = require('node-cache');

// 2. CONFIGURATION DE BASE
const app = express();
const PORT = process.env.PORT || 3000;

// 3. MIDDLEWARES
app.use(cors()); // Autoriser toutes les origines
app.use(express.json()); // Lire les données JSON

// 4. CACHE POUR LE TOKEN (durée de vie: 55 minutes)
const tokenCache = new NodeCache({ 
  stdTTL: 3300, // 55 minutes en secondes
  checkperiod: 60 // Vérifier toutes les minutes
});

// 5. FONCTION : OBTENIR UN NOUVEAU TOKEN
async function obtenirNouveauToken() {
  console.log('🔄 Tentative de connexion à l\'API...');
  
  try {
    // Configuration de la requête
    const reponse = await axios.post(
      'https://mdamsigicmu.sec.gouv.sn/api/authenticate',
      {
        username: process.env.API_USERNAME,
        password: process.env.API_PASSWORD
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 secondes maximum
      }
    );

    // Vérifier la réponse
    if (reponse.data && reponse.data.token) {
      const token = reponse.data.token;
      console.log('✅ Token obtenu avec succès !');
      return token;
    } else {
      throw new Error('Token non trouvé dans la réponse');
    }
    
  } catch (erreur) {
    console.error('❌ Erreur lors de l\'authentification :', erreur.message);
    
    // Si échec, utiliser le token de secours
    if (process.env.FALLBACK_TOKEN) {
      console.log('⚠️ Utilisation du token de secours');
      return process.env.FALLBACK_TOKEN;
    }
    
    throw erreur;
  }
}

// 6. FONCTION : OBTENIR LE TOKEN COURANT
async function obtenirTokenCourant() {
  // Vérifier si on a déjà un token en cache
  let token = tokenCache.get('token_jwt');
  
  // Si pas de token, en obtenir un nouveau
  if (!token) {
    console.log('📝 Pas de token en cache, nouvelle authentification...');
    token = await obtenirNouveauToken();
    
    // Stocker dans le cache
    tokenCache.set('token_jwt', token);
    tokenCache.set('derniere_auth', Date.now());
  }
  
  return token;
}

// 7. ROUTE : VÉRIFIER L'ÉTAT DU SERVEUR
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Serveur proxy actif',
    timestamp: new Date().toISOString(),
    tokenPresent: !!tokenCache.get('token_jwt')
  });
});

// 8. ROUTE : VÉRIFIER L'AUTHENTIFICATION
app.get('/api/auth/etat', (req, res) => {
  const token = tokenCache.get('token_jwt');
  const derniereAuth = tokenCache.get('derniere_auth');
  
  res.json({
    authentifie: !!token,
    dernierAuth: derniereAuth ? new Date(derniereAuth).toLocaleString() : null,
    enCache: !!token,
    cacheKeys: tokenCache.keys()
  });
});

// 9. PROXY DYNAMIQUE POUR L'API
const proxyApi = createProxyMiddleware({
  target: 'https://mdamsigicmu.sec.gouv.sn/services/udam',
  changeOrigin: true,
  secure: false,
  pathRewrite: {
    '^/api': '' // Retire "/api" de l'URL
  },
  
  // AVANT d'envoyer la requête à l'API
  onProxyReq: async (proxyReq, req, res) => {
    try {
      // 1. Obtenir le token actuel
      const token = await obtenirTokenCourant();
      
      // 2. Ajouter le token dans les headers
      proxyReq.setHeader('Authorization', `Bearer ${token}`);
      
      console.log(`🔗 Proxy: ${req.method} ${req.path} avec token`);
      
    } catch (erreur) {
      console.error('❌ Impossible d\'obtenir le token :', erreur.message);
      
      // Répondre avec une erreur claire
      res.status(503).json({
        error: 'Service temporairement indisponible',
        message: 'Authentification impossible',
        conseil: 'Vérifiez les identifiants dans le fichier .env'
      });
      
      // Arrêter la requête proxy
      proxyReq.destroy();
    }
  },
  
  // APRÈS avoir reçu la réponse de l'API
  onProxyRes: (proxyRes, req, res) => {
    // Si le token est expiré (401), le supprimer du cache
    if (proxyRes.statusCode === 401) {
      console.log('🔄 Token expiré, suppression du cache...');
      tokenCache.del('token_jwt');
    }
  }
});

// 10. APPLIQUER LE PROXY
app.use('/api', proxyApi);

// 11. SERVIR L'APPLICATION ANGULAR
app.use(express.static(path.join(__dirname, 'dist/carte-verification/browser')));

// 12. TOUTES LES AUTRES ROUTES → ANGULAR
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/carte-verification/browser/index.html'));
});

// 13. INITIALISATION AU DÉMARRAGE
async function demarrerApplication() {
  console.log('🚀 Démarrage du serveur...');
  console.log(`📁 Port: ${PORT}`);
  console.log(`📁 Dossier Angular: dist/carte-verification/browser`);
  
  try {
    // Obtenir un token au démarrage
    const token = await obtenirNouveauToken();
    tokenCache.set('token_jwt', token);
    tokenCache.set('derniere_auth', Date.now());
    
    console.log('✅ Serveur prêt avec token valide !');
    
    // Rafraîchir le token automatiquement toutes les 50 minutes
    setInterval(async () => {
      try {
        console.log('🔄 Rafraîchissement automatique du token...');
        const nouveauToken = await obtenirNouveauToken();
        tokenCache.set('token_jwt', nouveauToken);
        tokenCache.set('derniere_auth', Date.now());
        console.log('✅ Token rafraîchi automatiquement');
      } catch (erreur) {
        console.error('⚠️ Échec du rafraîchissement automatique:', erreur.message);
      }
    }, 50 * 60 * 1000); // 50 minutes
    
  } catch (erreur) {
    console.error('⚠️ Attention: Échec de l\'authentification initiale');
    console.error('⚠️ Message:', erreur.message);
    console.log('ℹ️ Le serveur démarre quand même...');
    console.log('ℹ️ Le token sera obtenu à la première requête API');
  }
}

// 14. DÉMARRER LE SERVEUR
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  demarrerApplication();
});

// 15. GESTION DES ERREURS NON ATTRAVÉES
process.on('uncaughtException', (erreur) => {
  console.error('🔥 ERREUR GRAVE:', erreur);
});