const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
app.use(cors());

// Logging des requêtes
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Endpoint API - Version directe sans proxy middleware
app.get('/api/beneficiairess/codeImmatriculation', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Code immatriculation requis' });
    }
    
    // Récupérer le token depuis config.js
    const token = require('./config').getToken();
    
    console.log(`🔍 Recherche du bénéficiaire avec code: ${code}`);
    console.log(`🔑 Token utilisé: ${token.substring(0, 50)}...`);
    
    // Appel direct à l'API CSU
    const response = await axios({
      method: 'GET',
      url: `https://mdamsigicmu.sec.gouv.sn/services/udam/api/beneficiairess/codeImmatriculation?code=${encodeURIComponent(code)}`,
      headers: {
        'Authorization': token,
        'Accept': 'application/json'
      },
      timeout: 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false  // Ignore SSL pour contourner le problème
      })
    });
    
    console.log(`✅ Succès - Status: ${response.status}`);
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Erreur API:', {
      message: error.message,
      code: error.code,
      status: error.response?.status
    });
    
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'CSU Proxy',
    timestamp: new Date().toISOString()
  });
});

// Servir l'application Angular
app.use(express.static(path.join(__dirname, 'dist/carte-verification/browser')));

// Fallback pour Angular routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/carte-verification/browser/index.html'));
});

// Port d'écoute
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📁 Static files: ${path.join(__dirname, 'dist/carte-verification/browser')}`);
});